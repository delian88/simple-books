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
        $bals = $pdo->prepare("SELECT l.account_id as id, SUM(l.debit) as debit, SUM(l.credit) as credit, a.name, a.type, a.sub_type 
                               FROM journal_lines l 
                               JOIN journal_entries e ON l.journal_entry_id = e.id 
                               JOIN accounts a ON l.account_id = a.id
                               WHERE e.company_id = ? 
                               GROUP BY l.account_id");
        $bals->execute([$companyId]);
        $balances = $bals->fetchAll(PDO::FETCH_ASSOC);

        // Virtualize Sales Invoices
        $siSum = $pdo->prepare("SELECT SUM(total_amount) as sum FROM sales_invoices WHERE company_id = ? AND status != 'DRAFT'");
        $siSum->execute([$companyId]);
        $salesInvoicesTotal = (float)($siSum->fetchColumn() ?: 0);
        if ($salesInvoicesTotal > 0) {
            $balances[] = ['id' => 'v-ar', 'name' => 'Accounts Receivable', 'type' => 'ASSET', 'sub_type' => 'Current Asset', 'debit' => $salesInvoicesTotal, 'credit' => 0];
            $balances[] = ['id' => 'v-sales', 'name' => 'Sales Revenue', 'type' => 'REVENUE', 'sub_type' => 'Operating Revenue', 'debit' => 0, 'credit' => $salesInvoicesTotal];
        }

        // Virtualize AI Expenses
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
            $bankId = $exp['bank_account_id'] ?: ('v-ai-cash-' . md5($cat));
            
            $balances[] = ['id' => 'v-ai-exp-' . md5($cat), 'name' => $cat, 'type' => 'EXPENSE', 'sub_type' => 'Operating Expense', 'debit' => $amt, 'credit' => 0];
            $balances[] = ['id' => $bankId, 'name' => $bankName, 'type' => 'ASSET', 'sub_type' => 'Cash', 'debit' => 0, 'credit' => $amt];
        }

        // Virtualize Manual Transactions
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

        $totDebit = 0; $totCredit = 0;
        foreach ($balances as $b) {
            $totDebit += $b['debit'];
            $totCredit += $b['credit'];
        }
        jsonResponse(['balances' => $balances, 'totalDebit' => $totDebit, 'totalCredit' => $totCredit]);
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
                               GROUP BY l.account_id");
        $bals->execute([$companyId, $start . ' 00:00:00', $end . ' 23:59:59']);
        $balances = $bals->fetchAll(PDO::FETCH_ASSOC);

        // Add virtuals
        $siSum = $pdo->prepare("SELECT SUM(total_amount) as sum FROM sales_invoices WHERE company_id = ? AND status != 'DRAFT' AND issue_date >= ? AND issue_date <= ?");
        $siSum->execute([$companyId, $start, $end]);
        $salesInvoicesTotal = (float)($siSum->fetchColumn() ?: 0);
        if ($salesInvoicesTotal > 0) {
            $balances[] = ['id' => 'v-ar', 'name' => 'Accounts Receivable', 'type' => 'ASSET', 'sub_type' => 'Current Asset', 'debit' => $salesInvoicesTotal, 'credit' => 0];
            $balances[] = ['id' => 'v-sales', 'name' => 'Sales Revenue', 'type' => 'REVENUE', 'sub_type' => 'Operating Revenue', 'debit' => 0, 'credit' => $salesInvoicesTotal];
        }

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
