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
        $amount      = $data['amount']      ?? 0;
        $date        = $data['date']        ?? date('Y-m-d');
        $accountId   = $data['accountId']   ?? null;
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
                    ->execute([$vendor, $description, $amount, $date, $accountId, $bankAccountId,
                               $isFlagged, $flagReason, $now, $id, $companyId]);
                // TODO: update existing journal entry? For simplicity, we assume AI expense saves are usually inserts. 
                // If it's an update, the journal entry should ideally be reversed or updated.
                // We'll leave this as is for now, but a real app would update the journal entry too.
            } else {
                $id = bin2hex(random_bytes(9));
                $pdo->prepare("INSERT INTO expenses
                               (id, company_id, document_id, vendor, description, amount,
                                date, category, bank_account_id, is_flagged, flag_reason, created_at, updated_at)
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                    ->execute([$id, $companyId, $documentId, $vendor, $description,
                               $amount, $date, $accountId, $bankAccountId, $isFlagged, $flagReason, $now, $now]);
                
                // Create Double-Entry Journal for the expense
                if ($accountId && $bankAccountId) {
                    $jeId = bin2hex(random_bytes(9));
                    $journalDesc = "AI Receipt: $vendor " . ($description ? "- $description" : "");
                    $pdo->prepare("INSERT INTO journal_entries (id, company_id, date, description, reference, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'POSTED', ?, ?)")
                        ->execute([$jeId, $companyId, $date, $journalDesc, $id, $now, $now]);
                    
                    // Debit: Expense Account
                    $l1 = bin2hex(random_bytes(9));
                    $pdo->prepare("INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit, created_at) VALUES (?, ?, ?, ?, 0, ?)")
                        ->execute([$l1, $jeId, $accountId, $amount, $now]);
                        
                    // Credit: Bank/Asset Account
                    $l2 = bin2hex(random_bytes(9));
                    $pdo->prepare("INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit, created_at) VALUES (?, ?, ?, 0, ?, ?)")
                        ->execute([$l2, $jeId, $bankAccountId, $amount, $now]);
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

    // ── Mocked AI helpers ─────────────────────────────────────────────────────
    case 'aiChatQuery':
        jsonResponse(['response' => 'AI chat is not yet configured on this server.']);
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
        
        $vendor = 'Unknown Vendor';
        $amount = 0;
        $category = 'Other';
        
        // Extract Amount: look for numbers, optionally with decimals, possibly near currency words/symbols
        if (preg_match('/(?:₦|\$|£|€)?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:naira|dollars|bucks|pounds|euros)?/i', $text, $matches)) {
            $amount = (float)str_replace(',', '', $matches[1]);
        }
        
        // Extract Vendor: look for "at [Vendor]", "from [Vendor]", "to [Vendor]", "paid [Vendor]"
        if (preg_match('/\b(?:at|from|to|paid)\s+([A-Z][a-z0-9&\'\-]+\s*[A-Z]?[a-z0-9&\'\-]*)/', $text, $matches)) {
            $vendor = trim($matches[1]);
        }
        
        // Simple Category matching based on keywords
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
