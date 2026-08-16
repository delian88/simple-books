<?php
// accounts.php
require_once 'db.php';
require_once 'auth.php';

$userId = requireAuth();
$companyId = getActiveCompanyId($pdo, $userId);

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'listAccounts':
        $stmt = $pdo->prepare("SELECT * FROM Account WHERE companyId = ? ORDER BY type, name");
        $stmt->execute([$companyId]);
        jsonResponse($stmt->fetchAll());
        break;

    case 'addAccount':
        $data = json_decode(file_get_contents('php://input'), true)['data'] ?? [];
        $id = uniqid();
        $stmt = $pdo->prepare("INSERT INTO Account (id, companyId, name, type, subType, openingBalance, code, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
        $stmt->execute([$id, $companyId, $data['name'], $data['type'], $data['subType'], $data['openingBalance'] ?? 0, $data['code'] ?? null]);
        jsonResponse(["id" => $id]);
        break;

    case 'updateAccount':
        $data = json_decode(file_get_contents('php://input'), true)['data'] ?? [];
        $stmt = $pdo->prepare("UPDATE Account SET name=?, type=?, subType=?, code=?, updatedAt=NOW() WHERE id=? AND companyId=?");
        $stmt->execute([$data['name'], $data['type'], $data['subType'], $data['code'] ?? null, $data['id'], $companyId]);
        jsonResponse(["ok" => true]);
        break;

    case 'deleteAccount':
        $data = json_decode(file_get_contents('php://input'), true)['data'] ?? [];
        $stmt = $pdo->prepare("DELETE FROM Account WHERE id = ? AND companyId = ?");
        $stmt->execute([$data['id'], $companyId]);
        jsonResponse(["ok" => true]);
        break;

    default:
        jsonResponse(["error" => "Unknown action"], 400);
}
?>
