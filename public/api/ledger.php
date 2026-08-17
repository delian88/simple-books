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

    case 'getTrialBalance':
        jsonResponse(["assets" => [], "liabilities" => [], "equity" => [], "revenue" => [], "expenses" => []]);
        break;

    case 'getFinancialStatements':
        jsonResponse(["incomeStatement" => [], "balanceSheet" => []]);
        break;

    default:
        jsonResponse(["error" => "Unknown action"], 400);
}
?>
