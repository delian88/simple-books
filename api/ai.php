<?php
// ai.php — corrected to match snake_case schema
require_once 'db.php';
define('AUTH_AS_LIB', true);
require_once 'auth.php';

$userId    = requireAuth();
$companyId = getActiveCompanyId($pdo, $userId);
$action    = $_GET['action'] ?? '';

switch ($action) {

    // ── Receipt scanning (mocked for shared hosting) ──────────────────────────
    case 'processReceiptBase64':
        $data       = json_decode(file_get_contents('php://input'), true) ?? [];
        $base64Data = $data['base64Data'] ?? '';
        $filename   = $data['filename']   ?? 'receipt.jpg';
        $mimeType   = $data['mimeType']   ?? 'image/jpeg';

        $base64Clean = preg_replace('/^data:image\/\w+;base64,/', '', $base64Data);
        $buffer      = base64_decode($base64Clean);

        // Save document using correct snake_case columns
        $docId = bin2hex(random_bytes(9));
        $now   = date('Y-m-d H:i:s');
        $pdo->prepare("INSERT INTO documents (id, company_id, filename, mime_type, content, created_at)
                       VALUES (?, ?, ?, ?, ?, ?)")
            ->execute([$docId, $companyId, $filename, $mimeType, $buffer, $now]);

        jsonResponse([
            'documentId'  => $docId,
            'vendor'      => 'Example Vendor',
            'amount'      => 5000,
            'date'        => date('Y-m-d'),
            'category'    => 'Meals',
            'description' => "Mocked receipt scan from $filename",
            'rawText'     => "MOCKED OCR TEXT\nTOTAL 5000",
        ]);
        break;

    // ── Save / update an AI-extracted expense ─────────────────────────────────
    case 'saveAIExpense':
        $data        = json_decode(file_get_contents('php://input'), true) ?? [];
        $id          = $data['id']          ?? null;
        $vendor      = $data['vendor']      ?? '';
        $amount      = (float)($data['amount'] ?? 0);
        $date        = $data['date']        ?? date('Y-m-d');
        $accountId   = $data['accountId']   ?? '';
        $category    = $data['category']    ?? ($accountId ?: 'General Expense');
        $description = $data['description'] ?? null;
        $documentId  = $data['documentId']  ?? null;
        $bankAccountId = $data['bankAccountId'] ?? null;
        $isFlagged   = 0;
        $flagReason  = null;
        $now         = date('Y-m-d H:i:s');

        $pdo->beginTransaction();
        try {
            if ($id) {
                $pdo->prepare("UPDATE expenses
                               SET vendor=?, description=?, amount=?, date=?, category=?, bank_account_id=?,
                                   is_flagged=?, flag_reason=?, updated_at=?
                               WHERE id=? AND company_id=?")
                    ->execute([$vendor, $description, $amount, $date, $category, $bankAccountId,
                               $isFlagged, $flagReason, $now, $id, $companyId]);
            } else {
                $id = bin2hex(random_bytes(9));
                $pdo->prepare("INSERT INTO expenses
                               (id, company_id, document_id, vendor, description, amount,
                                date, category, bank_account_id, is_flagged, flag_reason, created_at, updated_at)
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                    ->execute([$id, $companyId, $documentId, $vendor, $description,
                               $amount, $date, $category, $bankAccountId, $isFlagged, $flagReason, $now, $now]);
                
                // Safe Double-Entry Journal creation
                // 1. Resolve Expense Account to a valid accounts.id
                $validExpenseAccountId = null;
                if ($accountId && strlen($accountId) <= 32) {
                    $chk = $pdo->prepare("SELECT id FROM accounts WHERE id = ? AND company_id = ?");
                    $chk->execute([$accountId, $companyId]);
                    $validExpenseAccountId = $chk->fetchColumn() ?: null;
                }
                if (!$validExpenseAccountId) {
                    $nameToSearch = $category ?: ($accountId ?: 'General Expense');
                    $find = $pdo->prepare("SELECT id FROM accounts WHERE company_id = ? AND LOWER(name) = LOWER(?) LIMIT 1");
                    $find->execute([$companyId, $nameToSearch]);
                    $validExpenseAccountId = $find->fetchColumn() ?: null;
                }
                if (!$validExpenseAccountId) {
                    $findAny = $pdo->prepare("SELECT id FROM accounts WHERE company_id = ? AND type = 'EXPENSE' LIMIT 1");
                    $findAny->execute([$companyId]);
                    $validExpenseAccountId = $findAny->fetchColumn() ?: null;
                }
                if (!$validExpenseAccountId) {
                    $validExpenseAccountId = bin2hex(random_bytes(9));
                    $accName = $category ?: 'General Expense';
                    $pdo->prepare("INSERT INTO accounts (id, company_id, name, type, sub_type, code, opening_balance, created_at, updated_at)
                                   VALUES (?, ?, ?, 'EXPENSE', 'Operating Expense', '5000', 0, ?, ?)")
                        ->execute([$validExpenseAccountId, $companyId, $accName, $now, $now]);
                }

                // 2. Resolve Bank / Asset Account to a valid accounts.id
                $validBankAccountId = null;
                if ($bankAccountId && strlen($bankAccountId) <= 32) {
                    $chkB = $pdo->prepare("SELECT id FROM accounts WHERE id = ? AND company_id = ?");
                    $chkB->execute([$bankAccountId, $companyId]);
                    $validBankAccountId = $chkB->fetchColumn() ?: null;
                }
                if (!$validBankAccountId) {
                    $findBank = $pdo->prepare("SELECT id FROM accounts WHERE company_id = ? AND (type = 'ASSET' OR sub_type = 'Cash' OR LOWER(name) LIKE '%cash%' OR LOWER(name) LIKE '%bank%') LIMIT 1");
                    $findBank->execute([$companyId]);
                    $validBankAccountId = $findBank->fetchColumn() ?: null;
                }
                if (!$validBankAccountId) {
                    $validBankAccountId = bin2hex(random_bytes(9));
                    $pdo->prepare("INSERT INTO accounts (id, company_id, name, type, sub_type, code, opening_balance, created_at, updated_at)
                                   VALUES (?, ?, 'Cash on Hand', 'ASSET', 'Cash', '1000', 0, ?, ?)")
                        ->execute([$validBankAccountId, $companyId, $now, $now]);
                }

                // 3. Insert Journal Entry with guaranteed valid foreign keys
                if ($validExpenseAccountId && $validBankAccountId && $amount > 0) {
                    try {
                        $jeId = bin2hex(random_bytes(9));
                        $journalDesc = "Expense: " . ($vendor ?: 'Vendor') . ($description ? " - $description" : "");
                        $pdo->prepare("INSERT INTO journal_entries (id, company_id, date, description, reference, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'POSTED', ?, ?)")
                            ->execute([$jeId, $companyId, $date, $journalDesc, $id, $now, $now]);
                        
                        // Debit: Expense Account
                        $l1 = bin2hex(random_bytes(9));
                        $pdo->prepare("INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit, created_at) VALUES (?, ?, ?, ?, 0, ?)")
                            ->execute([$l1, $jeId, $validExpenseAccountId, $amount, $now]);
                            
                        // Credit: Bank/Asset Account
                        $l2 = bin2hex(random_bytes(9));
                        $pdo->prepare("INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit, created_at) VALUES (?, ?, ?, 0, ?, ?)")
                            ->execute([$l2, $jeId, $validBankAccountId, $amount, $now]);
                    } catch (Exception $jeEx) {
                        // Log warning, but don't fail expense creation
                        error_log("Journal entry skipped for expense $id: " . $jeEx->getMessage());
                    }
                }
            }
            $pdo->commit();
            jsonResponse(['ok' => true, 'expenseId' => $id,
                          'isFlagged' => (bool)$isFlagged, 'flagReason' => $flagReason]);
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(['error' => $e->getMessage()], 500);
        }
        break;

    // ── List expenses ─────────────────────────────────────────────────────────
    case 'listExpenses':
        $stmt = $pdo->prepare("
            SELECT e.*, d.id AS doc_id, d.filename, d.mime_type
            FROM expenses e
            LEFT JOIN documents d ON e.document_id = d.id
            WHERE e.company_id = ?
            ORDER BY e.date DESC
        ");
        $stmt->execute([$companyId]);
        $rows   = $stmt->fetchAll();
        $result = [];
        foreach ($rows as $exp) {
            $result[] = [
                'id'          => $exp['id'],
                'vendor'      => $exp['vendor'],
                'amount'      => (float) $exp['amount'],
                'date'        => substr($exp['date'] ?? '', 0, 10),
                'category'    => $exp['category'],
                'bankAccountId' => $exp['bank_account_id'],
                'description' => $exp['description'],
                'isFlagged'   => (bool) $exp['is_flagged'],
                'flagReason'  => $exp['flag_reason'],
                'document'    => $exp['doc_id'] ? [
                    'id'       => $exp['doc_id'],
                    'filename' => $exp['filename'],
                    'mimeType' => $exp['mime_type'],
                ] : null,
            ];
        }
        jsonResponse($result);
        break;

    // ── Delete an expense ─────────────────────────────────────────────────────
    case 'deleteAIExpense':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $pdo->prepare("DELETE FROM expenses WHERE id = ? AND company_id = ?")
            ->execute([$data['id'], $companyId]);
        jsonResponse(['ok' => true]);
        break;

    // ── Fetch document binary ─────────────────────────────────────────────────
    case 'getExpenseDocument':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $stmt = $pdo->prepare("SELECT filename, mime_type, content
                               FROM documents WHERE id = ? AND company_id = ? LIMIT 1");
        $stmt->execute([$data['documentId'], $companyId]);
        $doc  = $stmt->fetch();
        if (!$doc) jsonResponse(['error' => 'Not found'], 404);
        jsonResponse([
            'filename' => $doc['filename'],
            'mimeType' => $doc['mime_type'],
            'dataUrl'  => 'data:' . $doc['mime_type'] . ';base64,' . base64_encode($doc['content']),
        ]);
        break;

    // ── Ask your books AI chat (queries live company data) ───────────────────
    case 'aiChatQuery':
        $data  = json_decode(file_get_contents('php://input'), true) ?? [];
        $query = trim($data['query'] ?? '');
        if ($query === '') {
            jsonResponse(['response' => 'Ask me about your revenue, expenses, overdue invoices, cash balance, or stock!']);
        }

        // Gather live summary from company database
        $today = date('Y-m-d');
        $invStmt = $pdo->prepare("SELECT i.invoice_number, i.total_amount, i.due_date, i.status, c.name AS customer_name
                                  FROM sales_invoices i LEFT JOIN customers c ON c.id = i.customer_id
                                  WHERE i.company_id = ? AND i.status <> 'CANCELLED'");
        $invStmt->execute([$companyId]);
        $invoices = $invStmt->fetchAll();

        $totalInvoiced = 0; $totalPaid = 0; $totalUnpaid = 0; $overdueList = [];
        foreach ($invoices as $inv) {
            $amt = (float)$inv['total_amount'];
            if ($inv['status'] !== 'DRAFT') $totalInvoiced += $amt;
            if ($inv['status'] === 'PAID') {
                $totalPaid += $amt;
            } elseif ($inv['status'] !== 'DRAFT') {
                $totalUnpaid += $amt;
                if (!empty($inv['due_date']) && substr($inv['due_date'], 0, 10) < $today) {
                    $overdueList[] = "{$inv['invoice_number']} ({$inv['customer_name']}: " . number_format($amt, 2) . ")";
                }
            }
        }

        $expStmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE company_id = ?");
        $expStmt->execute([$companyId]);
        $aiExp = (float)$expStmt->fetchColumn();

        $txInStmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE company_id = ? AND direction = 'inflow'");
        $txInStmt->execute([$companyId]);
        $txIn = (float)$txInStmt->fetchColumn();

        $txOutStmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE company_id = ? AND direction = 'outflow'");
        $txOutStmt->execute([$companyId]);
        $txOut = (float)$txOutStmt->fetchColumn();

        $totalRevenue  = $totalInvoiced + $txIn;
        $totalExpenses = $aiExp + $txOut;
        $netProfit     = $totalRevenue - $totalExpenses;

        $qLower = strtolower($query);
        if (strpos($qLower, 'overdue') !== false || strpos($qLower, 'owe') !== false || strpos($qLower, 'unpaid') !== false || strpos($qLower, 'receivable') !== false) {
            $msg = "You currently have " . number_format($totalUnpaid, 2) . " in unpaid receivables.";
            if ($overdueList) {
                $msg .= " Overdue invoices: " . implode(', ', array_slice($overdueList, 0, 5)) . ".";
            } else {
                $msg .= " None of your invoices are overdue right now.";
            }
            jsonResponse(['response' => $msg]);
        }
        if (strpos($qLower, 'profit') !== false || strpos($qLower, 'margin') !== false || strpos($qLower, 'net') !== false) {
            jsonResponse(['response' => "Your total recorded revenue is " . number_format($totalRevenue, 2) . ", total expenses are " . number_format($totalExpenses, 2) . ", giving an estimated net profit of " . number_format($netProfit, 2) . "."]);
        }
        if (strpos($qLower, 'expense') !== false || strpos($qLower, 'spend') !== false || strpos($qLower, 'outflow') !== false) {
            jsonResponse(['response' => "Your total recorded expenses & outflows are " . number_format($totalExpenses, 2) . " (" . number_format($aiExp, 2) . " from scanned/AI expenses and " . number_format($txOut, 2) . " from Money Out)."]);
        }
        if (strpos($qLower, 'revenue') !== false || strpos($qLower, 'sales') !== false || strpos($qLower, 'income') !== false || strpos($qLower, 'inflow') !== false) {
            jsonResponse(['response' => "Your total revenue is " . number_format($totalRevenue, 2) . " (" . number_format($totalInvoiced, 2) . " invoiced, " . number_format($totalPaid, 2) . " marked paid, plus " . number_format($txIn, 2) . " in Money In)."]);
        }

        // General answer with live context via Pollinations AI + deterministic fallback
        $context = "Live company numbers: Revenue=" . number_format($totalRevenue, 2)
                 . ", Expenses=" . number_format($totalExpenses, 2)
                 . ", NetProfit=" . number_format($netProfit, 2)
                 . ", UnpaidReceivables=" . number_format($totalUnpaid, 2)
                 . ", OverdueCount=" . count($overdueList) . ".";
        $prompt = "You are KoboBooks AI, a concise bookkeeping assistant. $context Answer the user's question clearly in 2-3 sentences: $query";
        $aiReply = @file_get_contents('https://text.pollinations.ai/' . urlencode($prompt));
        if ($aiReply && strlen(trim($aiReply)) > 5) {
            jsonResponse(['response' => trim($aiReply)]);
        }

        jsonResponse(['response' => "Here is your live snapshot: Revenue " . number_format($totalRevenue, 2) . ", Expenses " . number_format($totalExpenses, 2) . ", Net Profit " . number_format($netProfit, 2) . ", and Unpaid Receivables " . number_format($totalUnpaid, 2) . " (" . count($overdueList) . " overdue)."]);
        break;

    case 'generateFinancialInsights':
        jsonResponse([
            'insights'   => [
                'Revenue looks steady.',
                'Keep an eye on categorising your expenses.',
                'Upload more receipts to get better insights!',
            ],
            'prediction' => 'Cash flow should remain stable over the next 30 days.',
        ]);
        break;

    case 'processVoiceExpense':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $text = $data['text'] ?? '';
        
        $prompt = "Extract the vendor, amount, date (YYYY-MM-DD), and category from this expense text: '$text'. Return ONLY a valid JSON object with the exact keys: 'vendor', 'amount' (number), 'date' (string), 'category' (string). Do not include markdown formatting or backticks. If you can't find a category, use 'Other'. If you can't find the date, use '" . date('Y-m-d') . "'.";
        
        $url = 'https://text.pollinations.ai/' . urlencode($prompt) . '?jsonMode=true';
        
        $response = @file_get_contents($url);
        
        if ($response) {
            $parsed = json_decode($response, true);
            if (is_array($parsed) && isset($parsed['vendor'])) {
                jsonResponse([
                    'vendor'   => $parsed['vendor'] ?? 'Unknown Vendor',
                    'amount'   => (float)($parsed['amount'] ?? 0),
                    'date'     => $parsed['date'] ?? date('Y-m-d'),
                    'category' => $parsed['category'] ?? 'Other',
                ]);
            }
        }
        
        // Fallback to heuristic parser if API fails or returns invalid JSON
        $vendor = 'Unknown Vendor';
        $amount = 0;
        $category = 'Other';
        
        if (preg_match('/(?:₦|\$|£|€)?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:naira|dollars|bucks|pounds|euros)?/i', $text, $matches)) {
            $amount = (float)str_replace(',', '', $matches[1]);
        }
        if (preg_match('/\b(?:at|from|to|paid)\s+([A-Z][a-z0-9&\'\-]+\s*[A-Z]?[a-z0-9&\'\-]*)/', $text, $matches)) {
            $vendor = trim($matches[1]);
        }
        $lowerText = strtolower($text);
        if (strpos($lowerText, 'lunch') !== false || strpos($lowerText, 'food') !== false || strpos($lowerText, 'restaurant') !== false || strpos($lowerText, 'dinner') !== false || strpos($lowerText, 'meal') !== false) {
            $category = 'Meals & Entertainment';
        } elseif (strpos($lowerText, 'uber') !== false || strpos($lowerText, 'taxi') !== false || strpos($lowerText, 'flight') !== false || strpos($lowerText, 'gas') !== false) {
            $category = 'Travel & Transportation';
        } elseif (strpos($lowerText, 'paper') !== false || strpos($lowerText, 'pen') !== false || strpos($lowerText, 'office') !== false || strpos($lowerText, 'desk') !== false) {
            $category = 'Office Supplies';
        }
        
        jsonResponse([
            'vendor'   => $vendor,
            'amount'   => $amount,
            'date'     => date('Y-m-d'),
            'category' => $category,
        ]);
        break;

    default:
        jsonResponse(['error' => 'Unknown action'], 400);
}
?>
