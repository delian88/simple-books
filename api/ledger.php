<?php
// ledger.php
require_once 'db.php';
define('AUTH_AS_LIB', true);
require_once 'auth.php';

$userId = requireAuth();
$companyId = getActiveCompanyId($pdo, $userId);

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'createJournalEntry':
        $raw  = json_decode(file_get_contents('php://input'), true) ?? [];
        $data = $raw['data'] ?? $raw;
        $id   = bin2hex(random_bytes(9));
        $now  = date('Y-m-d H:i:s');
        $date = !empty($data['date']) ? $data['date'] : $now;
        
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO journal_entries (id, company_id, date, description, reference, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'POSTED', ?, ?)");
            $stmt->execute([$id, $companyId, $date, $data['description'] ?? '', $data['reference'] ?? null, $now, $now]);
            
            $lineStmt = $pdo->prepare("INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit, created_at) VALUES (?, ?, ?, ?, ?, ?)");
            foreach ($data['lines'] as $line) {
                $lid = bin2hex(random_bytes(9));
                $lineStmt->execute([$lid, $id, $line['accountId'], $line['debit'] ?? 0, $line['credit'] ?? 0, $now]);
            }
            $pdo->commit();
            jsonResponse(["id" => $id]);
        } catch(Exception $e) {
            $pdo->rollBack();
            jsonResponse(["error" => $e->getMessage()], 500);
        }
        break;

    case 'listJournalEntries':
        $stmt = $pdo->prepare("SELECT * FROM journal_entries WHERE company_id = ? ORDER BY date DESC, created_at DESC");
        $stmt->execute([$companyId]);
        $entries = $stmt->fetchAll();
        
        $linesStmt = $pdo->prepare("SELECT l.*, a.name as account_name FROM journal_lines l LEFT JOIN accounts a ON l.account_id = a.id WHERE journal_entry_id IN (SELECT id FROM journal_entries WHERE company_id = ?)");
        $linesStmt->execute([$companyId]);
        $lines = $linesStmt->fetchAll();
        
        $linesByEntry = [];
        foreach ($lines as $line) {
            $linesByEntry[$line['journal_entry_id']][] = [
                'id' => $line['id'],
                'accountId' => $line['account_id'],
                'debit' => (float)$line['debit'],
                'credit' => (float)$line['credit'],
                'account' => ['name' => $line['account_name']]
            ];
        }
        
        foreach ($entries as &$entry) {
            $entry['date'] = substr($entry['date'], 0, 10);
            $entry['lines'] = $linesByEntry[$entry['id']] ?? [];
        }
        jsonResponse($entries);
        break;

    case 'getAccountStatement':
        $raw    = json_decode(file_get_contents('php://input'), true) ?? [];
        $data   = $raw['data'] ?? $raw;
        $accId  = $data['accountId'] ?? '';
        $start  = $data['startDate'] ?? '1970-01-01';
        $end    = $data['endDate'] ?? '2099-12-31';

        // Fetch account details
        $accStmt = $pdo->prepare("SELECT * FROM accounts WHERE id = ? AND company_id = ?");
        $accStmt->execute([$accId, $companyId]);
        $account = $accStmt->fetch();

        if (!$account) {
            jsonResponse(["error" => "Account not found"], 404);
        }

        // Fetch journal lines for this account within date range
        $stmt = $pdo->prepare(
            "SELECT l.id, l.debit, l.credit, e.id as entry_id, e.date, e.description, e.reference
             FROM journal_lines l
             JOIN journal_entries e ON e.id = l.journal_entry_id
             WHERE l.account_id = ? AND e.company_id = ? AND e.date >= ? AND e.date <= ?
             ORDER BY e.date ASC, e.created_at ASC"
        );
        $stmt->execute([$accId, $companyId, $start . ' 00:00:00', $end . ' 23:59:59']);
        $lines = $stmt->fetchAll();

        $transactions = [];
        $runningBalance = (float)($account['opening_balance'] ?? 0);
        foreach ($lines as $line) {
            $debit = (float)$line['debit'];
            $credit = (float)$line['credit'];
            // Adjust running balance based on account type
            if (in_array(strtoupper($account['type'] ?? ''), ['ASSET', 'EXPENSE'])) {
                $runningBalance += ($debit - $credit);
            } else {
                $runningBalance += ($credit - $debit);
            }
            $transactions[] = [
                'id' => $line['id'],
                'date' => substr($line['date'], 0, 10),
                'description' => $line['description'],
                'reference' => $line['reference'],
                'debit' => $debit,
                'credit' => $credit,
                'runningBalance' => $runningBalance,
            ];
        }

        jsonResponse([
            'account' => [
                'id' => $account['id'],
                'name' => $account['name'],
                'code' => $account['code'],
                'type' => $account['type'],
                'openingBalance' => (float)$account['opening_balance'],
            ],
            'startDate' => $start,
            'endDate' => $end,
            'transactions' => $transactions,
            'closingBalance' => $runningBalance,
        ]);
        break;

    case 'createJournalTemplate':
        $raw  = json_decode(file_get_contents('php://input'), true) ?? [];
        $data = $raw['data'] ?? $raw;
        $id   = bin2hex(random_bytes(9));
        $now  = date('Y-m-d H:i:s');

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO journal_templates (id, company_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$id, $companyId, $data['name'] ?? 'Template', $data['description'] ?? null, $now, $now]);

            $lineStmt = $pdo->prepare("INSERT INTO template_lines (id, template_id, account_id, debitRatio, creditRatio, is_fixed_amount, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)");
            foreach ($data['lines'] ?? [] as $line) {
                $lid = bin2hex(random_bytes(9));
                $lineStmt->execute([$lid, $id, $line['accountId'], $line['debitRatio'] ?? 0, $line['creditRatio'] ?? 0, $now]);
            }
            $pdo->commit();
            jsonResponse(["id" => $id]);
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(["error" => $e->getMessage()], 500);
        }
        break;

    case 'listJournalTemplates':
        $stmt = $pdo->prepare("SELECT * FROM journal_templates WHERE company_id = ? ORDER BY created_at DESC");
        $stmt->execute([$companyId]);
        $templates = $stmt->fetchAll();

        $linesStmt = $pdo->prepare("SELECT l.*, a.name as account_name FROM template_lines l LEFT JOIN accounts a ON l.account_id = a.id WHERE template_id IN (SELECT id FROM journal_templates WHERE company_id = ?)");
        $linesStmt->execute([$companyId]);
        $lines = $linesStmt->fetchAll();

        $linesByTemplate = [];
        foreach ($lines as $line) {
            $linesByTemplate[$line['template_id']][] = [
                'id' => $line['id'],
                'accountId' => $line['account_id'],
                'debitRatio' => (float)$line['debitRatio'],
                'creditRatio' => (float)$line['creditRatio'],
                'account' => ['name' => $line['account_name']]
            ];
        }

        foreach ($templates as &$t) {
            $t['templateLines'] = $linesByTemplate[$t['id']] ?? [];
        }
        jsonResponse($templates);
        break;

    case 'getTrialBalance':
        $accountMap = [];
        $addBal = function($id, $name, $type, $subType, $debit, $credit) use (&$accountMap) {
            $name = trim($name);
            if ($name === '') return;
            $k = strtolower($name);
            if (!isset($accountMap[$k])) {
                $accountMap[$k] = [
                    'id' => $id,
                    'name' => $name,
                    'type' => $type,
                    'sub_type' => $subType,
                    'debit' => 0.0,
                    'credit' => 0.0,
                ];
            }
            $accountMap[$k]['debit'] += (float)$debit;
            $accountMap[$k]['credit'] += (float)$credit;
        };

        // 1. Journal entries
        try {
            $bals = $pdo->prepare("SELECT l.account_id as id, SUM(l.debit) as debit, SUM(l.credit) as credit, a.name, a.type, a.sub_type 
                                   FROM journal_lines l 
                                   JOIN journal_entries e ON l.journal_entry_id = e.id 
                                   JOIN accounts a ON l.account_id = a.id
                                   WHERE e.company_id = ? 
                                   GROUP BY l.account_id, a.name, a.type, a.sub_type");
            $bals->execute([$companyId]);
            foreach ($bals->fetchAll(PDO::FETCH_ASSOC) as $r) {
                $addBal($r['id'], $r['name'], $r['type'], $r['sub_type'], $r['debit'], $r['credit']);
            }
        } catch (Exception $e) {}

        // 2. Sales Invoices
        try {
            $siSum = $pdo->prepare("SELECT SUM(total_amount) as sum FROM sales_invoices WHERE company_id = ? AND status != 'DRAFT'");
            $siSum->execute([$companyId]);
            $salesTotal = (float)($siSum->fetchColumn() ?: 0);
            if ($salesTotal > 0) {
                $addBal('v-ar', 'Accounts Receivable', 'ASSET', 'Current Asset', $salesTotal, 0);
                $addBal('v-sales', 'Sales Revenue', 'REVENUE', 'Operating Revenue', 0, $salesTotal);
            }
        } catch (Exception $e) {}

        // 3. AI & Business Expenses
        try {
            $aiExpSum = $pdo->prepare("SELECT e.category, e.bank_account_id, a.name as bank_name, SUM(e.amount) as sum 
                                       FROM expenses e 
                                       LEFT JOIN accounts a ON e.bank_account_id = a.id 
                                       WHERE e.company_id = ? 
                                       GROUP BY e.category, e.bank_account_id, a.name");
            $aiExpSum->execute([$companyId]);
            foreach ($aiExpSum->fetchAll(PDO::FETCH_ASSOC) as $exp) {
                $amt = (float)$exp['sum'];
                if ($amt <= 0) continue;
                $cat = ucfirst($exp['category']);
                $bankName = $exp['bank_name'] ?: 'Cash/Bank (Uncategorized)';
                $bankId = $exp['bank_account_id'] ?: ('v-cash-' . md5($bankName));
                $addBal('v-exp-' . md5($cat), $cat, 'EXPENSE', 'Operating Expense', $amt, 0);
                $addBal($bankId, $bankName, 'ASSET', 'Cash', 0, $amt);
            }
        } catch (Exception $e) {}

        // 4. Manual Transactions
        try {
            $txSum = $pdo->prepare("SELECT t.direction, t.category, t.category_id as bank_account_id, a.name as bank_name, SUM(t.amount) as sum 
                                    FROM transactions t 
                                    LEFT JOIN accounts a ON t.category_id = a.id 
                                    WHERE t.company_id = ? 
                                    GROUP BY t.direction, t.category, t.category_id, a.name");
            $txSum->execute([$companyId]);
            foreach ($txSum->fetchAll(PDO::FETCH_ASSOC) as $tx) {
                $amt = (float)$tx['sum'];
                if ($amt <= 0) continue;
                $cat = ucfirst($tx['category']);
                $bankName = $tx['bank_name'] ?: 'Cash/Bank (Uncategorized)';
                $bankId = $tx['bank_account_id'] ?: ('v-tx-' . md5($bankName));
                if ($tx['direction'] === 'inflow') {
                    $addBal($bankId, $bankName, 'ASSET', 'Cash', $amt, 0);
                    $type = (stripos($cat, 'sale') !== false) ? 'REVENUE' : 'EQUITY';
                    $addBal('v-cat-' . md5($cat), $cat, $type, '', 0, $amt);
                } else {
                    $addBal('v-cat-' . md5($cat), $cat, 'EXPENSE', '', $amt, 0);
                    $addBal($bankId, $bankName, 'ASSET', 'Cash', 0, $amt);
                }
            }
        } catch (Exception $e) {}

        // 5. ProfitBooks modules records (pb_records)
        try {
            $pbStmt = $pdo->prepare("SELECT type, data FROM pb_records WHERE company_id = ? AND type IN ('stock_purchase', 'vendor_payment', 'receipt', 'simple_entry')");
            $pbStmt->execute([$companyId]);
            foreach ($pbStmt->fetchAll(PDO::FETCH_ASSOC) as $pbr) {
                $d = json_decode($pbr['data'] ?? '{}', true) ?: [];
                $t = $pbr['type'];
                if ($t === 'stock_purchase') {
                    $amt = (float)($d['total_amount'] ?? 0);
                    if ($amt > 0) {
                        $addBal('v-inv', 'Inventory / Stock Purchases', 'ASSET', 'Current Asset', $amt, 0);
                        $addBal('v-ap', 'Accounts Payable', 'LIABILITY', 'Current Liability', 0, $amt);
                    }
                } elseif ($t === 'vendor_payment') {
                    $amt = (float)($d['amount'] ?? 0);
                    if ($amt > 0) {
                        $addBal('v-ap', 'Accounts Payable', 'LIABILITY', 'Current Liability', $amt, 0);
                        $addBal('v-bank-vp', $d['payment_method'] ? ucfirst($d['payment_method']) : 'Cash/Bank', 'ASSET', 'Cash', 0, $amt);
                    }
                } elseif ($t === 'receipt') {
                    $amt = (float)($d['amount'] ?? 0);
                    if ($amt > 0) {
                        $addBal('v-bank-rc', $d['payment_method'] ? ucfirst($d['payment_method']) : 'Cash/Bank', 'ASSET', 'Cash', $amt, 0);
                        $addBal('v-ar', 'Accounts Receivable', 'ASSET', 'Current Asset', 0, $amt);
                    }
                } elseif ($t === 'simple_entry') {
                    $amt = (float)($d['amount'] ?? 0);
                    $debitName = $d['debit_account_name'] ?? 'General Account';
                    $creditName = $d['credit_account_name'] ?? 'General Account';
                    if ($amt > 0) {
                        $addBal($d['debit_account_id'] ?? 'v-se-dr', $debitName, 'ASSET', '', $amt, 0);
                        $addBal($d['credit_account_id'] ?? 'v-se-cr', $creditName, 'LIABILITY', '', 0, $amt);
                    }
                }
            }
        } catch (Exception $e) {}

        // Net Balances consolidation
        $finalBalances = [];
        $totDebit = 0.0;
        $totCredit = 0.0;
        foreach ($accountMap as $acc) {
            $dr = (float)$acc['debit'];
            $cr = (float)$acc['credit'];
            $netDr = 0.0;
            $netCr = 0.0;
            if ($dr > $cr) {
                $netDr = $dr - $cr;
            } elseif ($cr > $dr) {
                $netCr = $cr - $dr;
            }
            if ($netDr > 0 || $netCr > 0 || $dr > 0 || $cr > 0) {
                $finalBalances[] = [
                    'id' => $acc['id'],
                    'name' => $acc['name'],
                    'type' => $acc['type'] ?: 'GENERAL',
                    'sub_type' => $acc['sub_type'] ?: '',
                    'debit' => round($netDr, 2),
                    'credit' => round($netCr, 2),
                    'grossDebit' => round($dr, 2),
                    'grossCredit' => round($cr, 2),
                ];
                $totDebit += $netDr;
                $totCredit += $netCr;
            }
        }

        // Sort by standard accounting order: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
        usort($finalBalances, function($a, $b) {
            $order = ['ASSET' => 1, 'LIABILITY' => 2, 'EQUITY' => 3, 'REVENUE' => 4, 'EXPENSE' => 5];
            $oa = $order[$a['type']] ?? 9;
            $ob = $order[$b['type']] ?? 9;
            if ($oa !== $ob) return $oa - $ob;
            return strcasecmp($a['name'], $b['name']);
        });

        jsonResponse([
            'balances' => $finalBalances,
            'totalDebit' => round($totDebit, 2),
            'totalCredit' => round($totCredit, 2),
            'isBalanced' => abs($totDebit - $totCredit) < 0.01,
            'difference' => round(abs($totDebit - $totCredit), 2)
        ]);
        break;

    case 'getFinancialStatements':
        $raw    = json_decode(file_get_contents('php://input'), true) ?? [];
        $data   = $raw['data'] ?? $raw;
        $start  = $data['startDate'] ?? '1970-01-01';
        $end    = $data['endDate'] ?? '2099-12-31';

        $bals = $pdo->prepare("SELECT l.account_id as id, SUM(l.debit) as debit, SUM(l.credit) as credit, a.name, a.type, a.sub_type 
                               FROM journal_lines l 
                               JOIN journal_entries e ON l.journal_entry_id = e.id 
                               JOIN accounts a ON l.account_id = a.id
                               WHERE e.company_id = ? AND e.date >= ? AND e.date <= ?
                               GROUP BY l.account_id, a.name, a.type, a.sub_type");
        $bals->execute([$companyId, $start . ' 00:00:00', $end . ' 23:59:59']);
        $balances = $bals->fetchAll(PDO::FETCH_ASSOC);

        // Add virtuals
        $salesInvoicesTotal = 0;
        try {
            $siSum = $pdo->prepare("SELECT SUM(total_amount) as sum FROM sales_invoices WHERE company_id = ? AND status != 'DRAFT' AND issue_date >= ? AND issue_date <= ?");
            $siSum->execute([$companyId, $start, $end]);
            $salesInvoicesTotal = (float)($siSum->fetchColumn() ?: 0);
        } catch (Exception $e) {}
        
        if ($salesInvoicesTotal > 0) {
            $balances[] = ['id' => 'v-ar', 'name' => 'Accounts Receivable', 'type' => 'ASSET', 'sub_type' => 'Current Asset', 'debit' => $salesInvoicesTotal, 'credit' => 0];
            $balances[] = ['id' => 'v-sales', 'name' => 'Sales Revenue', 'type' => 'REVENUE', 'sub_type' => 'Operating Revenue', 'debit' => 0, 'credit' => $salesInvoicesTotal];
        }

        try {
            $aiExpSum = $pdo->prepare("SELECT e.category, e.bank_account_id, a.name as bank_name, SUM(e.amount) as sum 
                                       FROM expenses e 
                                       LEFT JOIN accounts a ON e.bank_account_id = a.id 
                                       WHERE e.company_id = ? AND e.date >= ? AND e.date <= ?
                                       GROUP BY e.category, e.bank_account_id, a.name");
            $aiExpSum->execute([$companyId, $start, $end]);
            foreach ($aiExpSum->fetchAll(PDO::FETCH_ASSOC) as $exp) {
                $amt = (float)$exp['sum'];
                if ($amt <= 0) continue;
                $cat = ucfirst($exp['category']);
                $bankName = $exp['bank_name'] ?: 'Cash/Bank (Uncategorized)';
                $bankId = $exp['bank_account_id'] ?: ('v-ai-cash-' . md5($cat));
                
                $balances[] = ['id' => 'v-ai-exp-' . md5($cat), 'name' => $cat, 'type' => 'EXPENSE', 'sub_type' => 'Operating Expense', 'debit' => $amt, 'credit' => 0];
                $balances[] = ['id' => $bankId, 'name' => $bankName, 'type' => 'ASSET', 'sub_type' => 'Cash', 'debit' => 0, 'credit' => $amt];
            }
        } catch (Exception $e) {}

        try {
            $txSum = $pdo->prepare("SELECT t.direction, t.category, t.category_id as bank_account_id, a.name as bank_name, SUM(t.amount) as sum 
                                    FROM transactions t 
                                    LEFT JOIN accounts a ON t.category_id = a.id 
                                    WHERE t.company_id = ? AND t.occurred_on >= ? AND t.occurred_on <= ?
                                    GROUP BY t.direction, t.category, t.category_id, a.name");
            $txSum->execute([$companyId, $start, $end]);
            foreach ($txSum->fetchAll(PDO::FETCH_ASSOC) as $tx) {
                $amt = (float)$tx['sum'];
                if ($amt <= 0) continue;
                $cat = ucfirst($tx['category']);
                $bankName = $tx['bank_name'] ?: 'Cash/Bank (Uncategorized)';
                $bankId = $tx['bank_account_id'] ?: ('v-tx-cash-' . md5($tx['direction'] . $cat));
                $catId = 'v-tx-cat-' . md5($tx['direction'] . $cat);

                if ($tx['direction'] === 'inflow') {
                    $balances[] = ['id' => $bankId, 'name' => $bankName, 'type' => 'ASSET', 'sub_type' => 'Cash', 'debit' => $amt, 'credit' => 0];
                    $type = (stripos($cat, 'sale') !== false) ? 'REVENUE' : 'EQUITY'; 
                    $balances[] = ['id' => $catId, 'name' => $cat, 'type' => $type, 'sub_type' => '', 'debit' => 0, 'credit' => $amt];
                } else {
                    $type = 'EXPENSE';
                    $balances[] = ['id' => $catId, 'name' => $cat, 'type' => $type, 'sub_type' => '', 'debit' => $amt, 'credit' => 0];
                    $balances[] = ['id' => $bankId, 'name' => $bankName, 'type' => 'ASSET', 'sub_type' => 'Cash', 'debit' => 0, 'credit' => $amt];
                }
            }
        } catch (Exception $e) {}

        $incStmt = ['revenue' => 0, 'cogs' => 0, 'grossProfit' => 0, 'expenses' => 0, 'netProfit' => 0, 'details' => []];
        $balSheet = ['assets' => 0, 'liabilities' => 0, 'equity' => 0, 'details' => []];

        foreach ($balances as $b) {
            $net = $b['debit'] - $b['credit'];
            $type = strtoupper($b['type'] ?? '');
            $item = ['id' => $b['id'], 'name' => $b['name'], 'type' => $type, 'subType' => $b['sub_type']];
            
            if ($type === 'REVENUE') {
                $val = $b['credit'] - $b['debit']; // Revenue has credit normal balance
                $incStmt['revenue'] += $val;
                $item['balance'] = $val;
                $incStmt['details'][] = $item;
            } elseif ($type === 'EXPENSE') {
                $val = $b['debit'] - $b['credit'];
                if (stripos($b['sub_type'] ?? '', 'Cost of Goods') !== false) {
                    $incStmt['cogs'] += $val;
                } else {
                    $incStmt['expenses'] += $val;
                }
                $item['balance'] = $val;
                $incStmt['details'][] = $item;
            } elseif ($type === 'ASSET') {
                $val = $b['debit'] - $b['credit'];
                $balSheet['assets'] += $val;
                $item['balance'] = $val;
                $balSheet['details'][] = $item;
            } elseif ($type === 'LIABILITY') {
                $val = $b['credit'] - $b['debit'];
                $balSheet['liabilities'] += $val;
                $item['balance'] = $val;
                $balSheet['details'][] = $item;
            } elseif ($type === 'EQUITY') {
                $val = $b['credit'] - $b['debit'];
                $balSheet['equity'] += $val;
                $item['balance'] = $val;
                $balSheet['details'][] = $item;
            }
        }

        $incStmt['grossProfit'] = $incStmt['revenue'] - $incStmt['cogs'];
        $incStmt['netProfit'] = $incStmt['grossProfit'] - $incStmt['expenses'];
        
        $balSheet['equity'] += $incStmt['netProfit']; // Current Year Earnings

        jsonResponse(["incomeStatement" => $incStmt, "balanceSheet" => $balSheet]);
        break;

    default:
        jsonResponse(["error" => "Unknown action"], 400);
}
?>
