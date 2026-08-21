<?php
// accounts.php
require_once 'db.php';
define('AUTH_AS_LIB', true);
require_once 'auth.php';

$userId    = requireAuth();
$companyId = getActiveCompanyId($pdo, $userId);
$action    = $_GET['action'] ?? '';

switch ($action) {
    case 'listAccounts':
        $stmt = $pdo->prepare("SELECT * FROM accounts WHERE company_id = ? AND is_archived = 0 ORDER BY type, name");
        $stmt->execute([$companyId]);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['openingBalance'] = (float)($r['opening_balance'] ?? 0);
            $r['subType']        = $r['sub_type'] ?? null;
        }
        jsonResponse($rows);
        break;

    case 'addAccount':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $id   = bin2hex(random_bytes(9));
        $now  = date('Y-m-d H:i:s');
        $pdo->prepare("INSERT INTO accounts (id, company_id, name, type, sub_type, code, opening_balance, created_at, updated_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
            ->execute([$id, $companyId, $data['name'], $data['type'], $data['subType'] ?? null,
                       $data['code'] ?? null, $data['openingBalance'] ?? 0, $now, $now]);
        jsonResponse(['id' => $id]);
        break;

    case 'updateAccount':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $now  = date('Y-m-d H:i:s');
        $pdo->prepare("UPDATE accounts SET name=?, type=?, sub_type=?, code=?, updated_at=? WHERE id=? AND company_id=?")
            ->execute([$data['name'], $data['type'], $data['subType'] ?? null,
                       $data['code'] ?? null, $now, $data['id'], $companyId]);
        jsonResponse(['ok' => true]);
        break;

    case 'deleteAccount':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $pdo->prepare("UPDATE accounts SET is_archived = 1, updated_at = NOW() WHERE id = ? AND company_id = ?")
            ->execute([$data['id'], $companyId]);
        jsonResponse(['ok' => true]);
        break;

    default:
        jsonResponse(['error' => 'Unknown action'], 400);
}
?>
