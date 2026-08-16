<?php
// accounting.php
require_once 'db.php';
require_once 'auth.php';

$userId = requireAuth();
$companyId = getActiveCompanyId($pdo, $userId);

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'getProfile':
        $stmt = $pdo->prepare("SELECT id, name, defaultCurrency FROM Company WHERE id = ?");
        $stmt->execute([$companyId]);
        $company = $stmt->fetch();
        if ($company) {
            jsonResponse(array("id" => $company['id'], "business_name" => $company['name'], "currency" => $company['defaultCurrency']));
        }
        jsonResponse(array("id" => $userId, "business_name" => "My Business", "currency" => "NGN"));
        break;

    case 'updateProfile':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE Company SET name = ?, defaultCurrency = ? WHERE id = ?");
        $stmt->execute([$data['business_name'], $data['currency'], $companyId]);
        jsonResponse(array("ok" => true));
        break;

    case 'listTransactions':
        $stmt = $pdo->prepare("SELECT id, direction, category, amount, occurredOn as occurred_on, counterparty, note, source FROM Transaction WHERE companyId = ? ORDER BY occurredOn DESC, createdAt DESC LIMIT 500");
        $stmt->execute([$companyId]);
        $transactions = $stmt->fetchAll();
        foreach ($transactions as &$t) {
            $t['amount'] = (float)$t['amount'];
            $t['occurred_on'] = substr($t['occurred_on'], 0, 10);
        }
        jsonResponse($transactions);
        break;

    case 'addTransactions':
        $data = json_decode(file_get_contents('php://input'), true);
        $rows = $data['rows'] ?? [];
        
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO Transaction (id, userId, companyId, createdBy, direction, categoryId, category, amount, occurredOn, counterparty, note, source, createdAt, updatedAt) VALUES (UUID(), ?, ?, ?, ?, ?, 'Journal Entry', ?, ?, ?, ?, ?, NOW(), NOW())");
            
            $journalStmt = $pdo->prepare("INSERT INTO JournalEntry (id, companyId, date, description, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'POSTED', NOW(), NOW())");
            $lineStmt = $pdo->prepare("INSERT INTO JournalEntryLine (id, entryId, accountId, debit, credit) VALUES (UUID(), ?, ?, ?, ?)");

            foreach ($rows as $row) {
                $stmt->execute([
                    $userId, $companyId, $userId, 
                    $row['direction'], $row['category'], 
                    $row['amount'], $row['occurred_on'], 
                    $row['counterparty'] ?? null, $row['note'] ?? null, $row['source'] ?? 'manual'
                ]);

                // Auto-post Journal Entries
                $opposingAccountId = $row['category'];
                $bankAccountId = $row['bankAccountId'];
                $debitAccountId = $row['direction'] === "inflow" ? $bankAccountId : $opposingAccountId;
                $creditAccountId = $row['direction'] === "inflow" ? $opposingAccountId : $bankAccountId;

                $entryId = uniqid(); // Or UUID if needed by schema
                $journalStmt->execute([$entryId, $companyId, $row['occurred_on'], $row['note'] ?? 'Auto-posted ' . $row['direction']]);
                
                $lineStmt->execute([$entryId, $debitAccountId, $row['amount'], 0]);
                $lineStmt->execute([$entryId, $creditAccountId, 0, $row['amount']]);
            }
            $pdo->commit();
            jsonResponse(array("inserted" => count($rows)));
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(array("error" => $e->getMessage()), 500);
        }
        break;

    case 'deleteTransaction':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("DELETE FROM Transaction WHERE id = ? AND companyId = ?");
        $stmt->execute([$data['id'], $companyId]);
        jsonResponse(array("ok" => true));
        break;

    case 'listBalanceItems':
        $stmt = $pdo->prepare("SELECT id, side, name, category, amount, asOf as as_of FROM BalanceItem WHERE companyId = ? ORDER BY side ASC, createdAt DESC");
        $stmt->execute([$companyId]);
        $items = $stmt->fetchAll();
        foreach ($items as &$i) {
            $i['amount'] = (float)$i['amount'];
            $i['as_of'] = substr($i['as_of'], 0, 10);
        }
        jsonResponse($items);
        break;

    case 'addBalanceItem':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO BalanceItem (id, userId, companyId, side, name, category, amount, asOf, createdAt, updatedAt) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
        $stmt->execute([
            $userId, $companyId, 
            $data['side'], $data['name'], 
            $data['category'], $data['amount'], 
            $data['as_of']
        ]);
        jsonResponse(array("ok" => true));
        break;

    case 'deleteBalanceItem':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("DELETE FROM BalanceItem WHERE id = ? AND companyId = ?");
        $stmt->execute([$data['id'], $companyId]);
        jsonResponse(array("ok" => true));
        break;

    default:
        jsonResponse(array("error" => "Unknown action"), 400);
}
?>
