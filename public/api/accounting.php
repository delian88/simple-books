<?php
// accounting.php
require_once 'db.php';
define('AUTH_AS_LIB', true);
require_once 'auth.php';

$userId    = requireAuth();
$companyId = getActiveCompanyId($pdo, $userId);
$action    = $_GET['action'] ?? '';

switch ($action) {

    case 'getProfile':
        // profiles table is keyed by user id
        $stmt = $pdo->prepare("SELECT p.business_name, p.currency FROM profiles p WHERE p.id = ? LIMIT 1");
        $stmt->execute([$userId]);
        $profile = $stmt->fetch();
        if (!$profile) {
            // Auto-create a default profile
            $now = date('Y-m-d H:i:s');
            $pdo->prepare("INSERT IGNORE INTO profiles (id, business_name, currency, created_at) VALUES (?, 'My Business', 'NGN', ?)")
                ->execute([$userId, $now]);
            $profile = ['business_name' => 'My Business', 'currency' => 'NGN'];
        }
        jsonResponse($profile);
        break;

    case 'updateProfile':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $now  = date('Y-m-d H:i:s');
        $pdo->prepare("INSERT INTO profiles (id, business_name, currency, created_at) VALUES (?, ?, ?, ?)
                       ON DUPLICATE KEY UPDATE business_name = VALUES(business_name), currency = VALUES(currency)")
            ->execute([$userId, $data['business_name'] ?? 'My Business', $data['currency'] ?? 'NGN', $now]);
        jsonResponse(['ok' => true]);
        break;

    case 'listTransactions':
        $sql = "
            SELECT id, direction, category, amount, occurred_on, counterparty, note, source 
            FROM transactions 
            WHERE company_id = ?
            
            UNION ALL
            
            SELECT id, 'outflow' as direction, category, amount, date as occurred_on, vendor as counterparty, description as note, 'ai_expense' as source 
            FROM expenses 
            WHERE company_id = ?
            
            UNION ALL
            
            SELECT id, 'inflow' as direction, 'sales' as category, total_amount as amount, issue_date as occurred_on, (SELECT name FROM customers WHERE customers.id = sales_invoices.customer_id) as counterparty, notes as note, 'invoice' as source 
            FROM sales_invoices 
            WHERE company_id = ?
            
            ORDER BY occurred_on DESC LIMIT 500
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$companyId, $companyId, $companyId]);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['amount'] = (float) $r['amount'];
            $r['occurredOn'] = substr($r['occurred_on'] ?? '', 0, 10);
        }
        jsonResponse($rows);
        break;

    case 'addTransactions':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $rows = isset($data[0]) ? $data : [$data]; // accept single or array
        $ids  = [];
        $now  = date('Y-m-d H:i:s');
        foreach ($rows as $row) {
            $id = bin2hex(random_bytes(9));
            $pdo->prepare("INSERT INTO transactions (id, user_id, company_id, created_by, direction, category, category_id, amount, occurred_on, counterparty, note, source, created_at)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                ->execute([
                    $id, $userId, $companyId, $userId,
                    $row['direction'] ?? 'outflow',
                    $row['category'] ?? 'Other',
                    $row['bankAccountId'] ?? null,
                    $row['amount'] ?? 0,
                    $row['occurred_on'] ?? $now,
                    $row['counterparty'] ?? null,
                    $row['note'] ?? null,
                    $row['source'] ?? 'manual',
                    $now
                ]);
            $ids[] = $id;
        }
        jsonResponse(['ok' => true, 'ids' => $ids]);
        break;

    case 'deleteTransaction':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $pdo->prepare("DELETE FROM transactions WHERE id = ? AND company_id = ?")
            ->execute([$data['id'], $companyId]);
        jsonResponse(['ok' => true]);
        break;

    case 'listBalanceItems':
        $stmt = $pdo->prepare("SELECT * FROM balance_items WHERE company_id = ? ORDER BY created_at DESC");
        $stmt->execute([$companyId]);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['amount'] = (float) $r['amount'];
            $r['as_of'] = substr($r['as_of'] ?? '', 0, 10);
        }
        jsonResponse($rows);
        break;

    case 'addBalanceItem':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $id   = bin2hex(random_bytes(9));
        $now  = date('Y-m-d H:i:s');
        $pdo->prepare("INSERT INTO balance_items (id, user_id, company_id, side, name, category, amount, as_of, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
            ->execute([
                $id, $userId, $companyId,
                $data['side'] ?? 'asset',
                $data['name'] ?? '',
                $data['category'] ?? 'Other',
                $data['amount'] ?? 0,
                $data['as_of'] ?? $now,
                $now
            ]);
        jsonResponse(['ok' => true, 'id' => $id]);
        break;

    case 'deleteBalanceItem':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $pdo->prepare("DELETE FROM balance_items WHERE id = ? AND company_id = ?")
            ->execute([$data['id'], $companyId]);
        jsonResponse(['ok' => true]);
        break;

    default:
        jsonResponse(['error' => 'Unknown action'], 400);
}
?>
