<?php
// ledger.php
require_once 'db.php';
require_once 'auth.php';

$userId = requireAuth();
$companyId = getActiveCompanyId($pdo, $userId);

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'createJournalEntry':
        $data = json_decode(file_get_contents('php://input'), true)['data'] ?? [];
        $id = uniqid();
        
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO JournalEntry (id, companyId, date, description, reference, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 'POSTED', NOW(), NOW())");
            $stmt->execute([$id, $companyId, $data['date'], $data['description'], $data['reference'] ?? null]);
            
            $lineStmt = $pdo->prepare("INSERT INTO JournalEntryLine (id, entryId, accountId, debit, credit) VALUES (UUID(), ?, ?, ?, ?)");
            foreach ($data['lines'] as $line) {
                $lineStmt->execute([$id, $line['accountId'], $line['debit'] ?? 0, $line['credit'] ?? 0]);
            }
            $pdo->commit();
            jsonResponse(["id" => $id]);
        } catch(Exception $e) {
            $pdo->rollBack();
            jsonResponse(["error" => $e->getMessage()], 500);
        }
        break;

    case 'listJournalEntries':
        $stmt = $pdo->prepare("SELECT * FROM JournalEntry WHERE companyId = ? ORDER BY date DESC, createdAt DESC");
        $stmt->execute([$companyId]);
        $entries = $stmt->fetchAll();
        
        $linesStmt = $pdo->prepare("SELECT l.*, a.name as account_name FROM JournalEntryLine l LEFT JOIN Account a ON l.accountId = a.id WHERE entryId IN (SELECT id FROM JournalEntry WHERE companyId = ?)");
        $linesStmt->execute([$companyId]);
        $lines = $linesStmt->fetchAll();
        
        $linesByEntry = [];
        foreach ($lines as $line) {
            $linesByEntry[$line['entryId']][] = [
                'id' => $line['id'],
                'accountId' => $line['accountId'],
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
