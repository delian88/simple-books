<?php
// api/ledger.php
require_once 'config.php';

function getActiveCompanyId($userId, $pdo) {
    $stmt = $pdo->prepare("SELECT company_id FROM company_users WHERE user_id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    if (!$row) {
        http_response_code(400);
        sendResponse(['error' => 'User does not belong to any company']);
    }
    return $row['company_id'];
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);
$payload = require_auth();
$companyId = getActiveCompanyId($payload['userId'], $pdo);

if ($action === 'createJournalEntry' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = $input['data'] ?? [];
    $lines = $data['lines'] ?? [];
    
    $totalDebit = 0; $totalCredit = 0;
    foreach ($lines as $line) {
        $totalDebit += (float)$line['debit'];
        $totalCredit += (float)$line['credit'];
    }
    
    if (abs($totalDebit - $totalCredit) > 0.001) {
        http_response_code(400);
        sendResponse(['error' => "Debits ($totalDebit) and Credits ($totalCredit) must balance."]);
    }
    
    $pdo->beginTransaction();
    try {
        $entryId = generate_uuid();
        $stmt = $pdo->prepare("INSERT INTO journal_entries (id, company_id, date, description, reference, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())");
        $stmt->execute([$entryId, $companyId, $data['date'], $data['description'], $data['reference'] ?? null, $data['status'] ?? 'POSTED']);
        
        $lineStmt = $pdo->prepare("INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit, created_at) VALUES (UUID(), ?, ?, ?, ?, NOW())");
        foreach ($lines as $line) {
            $lineStmt->execute([$entryId, $line['accountId'], $line['debit'], $line['credit']]);
        }
        $pdo->commit();
        sendResponse(['ok' => true, 'entryId' => $entryId]);
    } catch (\Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        sendResponse(['error' => $e->getMessage()]);
    }
}
elseif ($action === 'listJournalEntries' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM journal_entries WHERE company_id = ? ORDER BY date DESC");
    $stmt->execute([$companyId]);
    $entries = $stmt->fetchAll();
    
    $lineStmt = $pdo->prepare("SELECT jl.*, a.name, a.code, a.type, a.opening_balance FROM journal_lines jl JOIN accounts a ON jl.account_id = a.id WHERE jl.journal_entry_id = ?");
    
    foreach ($entries as &$entry) {
        $lineStmt->execute([$entry['id']]);
        $lines = $lineStmt->fetchAll();
        foreach ($lines as &$line) {
            $line['debit'] = (float)$line['debit'];
            $line['credit'] = (float)$line['credit'];
            $line['accountId'] = $line['account_id'];
            $line['account'] = [
                'id' => $line['account_id'],
                'name' => $line['name'],
                'code' => $line['code'],
                'type' => $line['type'],
                'openingBalance' => (float)$line['opening_balance']
            ];
        }
        $entry['lines'] = $lines;
        $entry['companyId'] = $entry['company_id'];
    }
    sendResponse($entries);
}
elseif ($action === 'approveJournalEntry' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = $input['data'] ?? [];
    $stmt = $pdo->prepare("UPDATE journal_entries SET status = 'POSTED', updated_at = NOW() WHERE id = ? AND company_id = ?");
    $stmt->execute([$data['id'], $companyId]);
    sendResponse(['ok' => true]);
}
elseif ($action === 'getTrialBalance' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $accStmt = $pdo->prepare("SELECT * FROM accounts WHERE company_id = ?");
    $accStmt->execute([$companyId]);
    $accounts = $accStmt->fetchAll();
    
    $lineStmt = $pdo->prepare("SELECT jl.* FROM journal_lines jl JOIN journal_entries je ON jl.journal_entry_id = je.id WHERE je.company_id = ? AND je.status = 'POSTED'");
    $lineStmt->execute([$companyId]);
    $lines = $lineStmt->fetchAll();
    
    $totalDebit = 0; $totalCredit = 0;
    $balances = [];
    
    foreach ($accounts as $acc) {
        $debits = 0; $credits = 0;
        foreach ($lines as $line) {
            if ($line['account_id'] === $acc['id']) {
                $debits += (float)$line['debit'];
                $credits += (float)$line['credit'];
            }
        }
        
        $balance = (float)$acc['opening_balance'];
        $debitBalance = 0; $creditBalance = 0;
        $isNormalDebit = in_array($acc['type'], ['ASSET', 'EXPENSE']);
        
        if ($isNormalDebit) {
            $balance += $debits - $credits;
            if ($balance >= 0) $debitBalance = $balance; else $creditBalance = abs($balance);
        } else {
            $balance += $credits - $debits;
            if ($balance >= 0) $creditBalance = $balance; else $debitBalance = abs($balance);
        }
        
        $totalDebit += $debitBalance;
        $totalCredit += $creditBalance;
        
        if ($debitBalance !== 0 || $creditBalance !== 0) {
            $balances[] = [
                'id' => $acc['id'], 'name' => $acc['name'], 'code' => $acc['code'],
                'type' => $acc['type'], 'subType' => $acc['sub_type'],
                'debit' => $debitBalance, 'credit' => $creditBalance
            ];
        }
    }
    sendResponse(['balances' => $balances, 'totalDebit' => $totalDebit, 'totalCredit' => $totalCredit]);
}
elseif ($action === 'getFinancialStatements' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    // simplified due to space, mirrors getTrialBalance calculation
    $accStmt = $pdo->prepare("SELECT * FROM accounts WHERE company_id = ?");
    $accStmt->execute([$companyId]);
    $accounts = $accStmt->fetchAll();
    
    $lineStmt = $pdo->prepare("SELECT jl.* FROM journal_lines jl JOIN journal_entries je ON jl.journal_entry_id = je.id WHERE je.company_id = ? AND je.status = 'POSTED'");
    $lineStmt->execute([$companyId]);
    $lines = $lineStmt->fetchAll();
    
    $balances = [];
    foreach ($accounts as $acc) {
        $debits = 0; $credits = 0;
        foreach ($lines as $line) {
            if ($line['account_id'] === $acc['id']) {
                $debits += (float)$line['debit'];
                $credits += (float)$line['credit'];
            }
        }
        $balance = (float)$acc['opening_balance'];
        $isNormalDebit = in_array($acc['type'], ['ASSET', 'EXPENSE']);
        if ($isNormalDebit) $balance += $debits - $credits;
        else $balance += $credits - $debits;
        
        $acc['balance'] = $balance;
        $acc['subType'] = $acc['sub_type'];
        $balances[] = $acc;
    }
    
    $revenue = 0; $cogs = 0; $expenses = 0;
    $incomeStatementAccounts = [];
    foreach ($balances as $acc) {
        if (in_array($acc['type'], ['REVENUE', 'EXPENSE'])) {
            $incomeStatementAccounts[] = $acc;
            if ($acc['type'] === 'REVENUE') $revenue += $acc['balance'];
            elseif ($acc['type'] === 'EXPENSE') {
                if ($acc['subType'] === 'Cost of Goods Sold') $cogs += $acc['balance'];
                else $expenses += $acc['balance'];
            }
        }
    }
    $grossProfit = $revenue - $cogs;
    $netProfit = $grossProfit - $expenses;
    $incomeStatement = ['revenue' => $revenue, 'cogs' => $cogs, 'grossProfit' => $grossProfit, 'expenses' => $expenses, 'netProfit' => $netProfit, 'details' => $incomeStatementAccounts];
    
    $assets = 0; $liabilities = 0; $equity = 0;
    $balanceSheetAccounts = [];
    foreach ($balances as $acc) {
        if (in_array($acc['type'], ['ASSET', 'LIABILITY', 'EQUITY'])) {
            $balanceSheetAccounts[] = $acc;
            if ($acc['type'] === 'ASSET') $assets += $acc['balance'];
            if ($acc['type'] === 'LIABILITY') $liabilities += $acc['balance'];
            if ($acc['type'] === 'EQUITY') $equity += $acc['balance'];
        }
    }
    $equity += $netProfit;
    $balanceSheet = ['assets' => $assets, 'liabilities' => $liabilities, 'equity' => $equity, 'details' => $balanceSheetAccounts];
    
    sendResponse(['incomeStatement' => $incomeStatement, 'balanceSheet' => $balanceSheet]);
}
else {
    http_response_code(404);
    sendResponse(['error' => 'Not found or not implemented yet']);
}
?>
