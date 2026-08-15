<?php
// api/accounts.php
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

if ($action === 'listAccounts' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $payload = require_auth();
    $companyId = getActiveCompanyId($payload['userId'], $pdo);
    
    $stmt = $pdo->prepare("SELECT * FROM accounts WHERE company_id = ? AND is_archived = 0 ORDER BY code ASC, name ASC");
    $stmt->execute([$companyId]);
    $data = $stmt->fetchAll();
    
    foreach ($data as &$row) {
        $row['openingBalance'] = (float)$row['opening_balance'];
        $row['companyId'] = $row['company_id'];
        $row['subType'] = $row['sub_type'];
        $row['parentId'] = $row['parent_id'];
    }
    
    sendResponse($data);
}
elseif ($action === 'addAccount' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = require_auth();
    $companyId = getActiveCompanyId($payload['userId'], $pdo);
    $data = $input['data'] ?? [];
    
    $accountId = generate_uuid();
    $stmt = $pdo->prepare("INSERT INTO accounts (id, company_id, name, code, type, sub_type, parent_id, opening_balance, created_at, updated_at) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
    $stmt->execute([
        $accountId,
        $companyId,
        $data['name'] ?? '',
        $data['code'] ?? null,
        $data['type'] ?? 'ASSET',
        $data['subType'] ?? null,
        $data['parentId'] ?? null,
        $data['openingBalance'] ?? 0
    ]);
    
    sendResponse(['ok' => true, 'accountId' => $accountId]);
}
elseif ($action === 'updateAccount' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = require_auth();
    $companyId = getActiveCompanyId($payload['userId'], $pdo);
    $data = $input['data'] ?? [];
    
    $stmt = $pdo->prepare("UPDATE accounts SET name = ?, code = ?, type = ?, sub_type = ?, parent_id = ?, updated_at = NOW() WHERE id = ? AND company_id = ?");
    $stmt->execute([
        $data['name'] ?? '',
        $data['code'] ?? null,
        $data['type'] ?? 'ASSET',
        $data['subType'] ?? null,
        $data['parentId'] ?? null,
        $data['id'],
        $companyId
    ]);
    
    sendResponse(['ok' => true]);
}
elseif ($action === 'deleteAccount' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = require_auth();
    $companyId = getActiveCompanyId($payload['userId'], $pdo);
    $data = $input['data'] ?? [];
    
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM journal_lines jl JOIN accounts a ON jl.account_id = a.id WHERE a.id = ? AND a.company_id = ?");
    $stmt->execute([$data['id'], $companyId]);
    $linesCount = $stmt->fetchColumn();
    
    if ($linesCount > 0) {
        $updateStmt = $pdo->prepare("UPDATE accounts SET is_archived = 1 WHERE id = ? AND company_id = ?");
        $updateStmt->execute([$data['id'], $companyId]);
        sendResponse(['ok' => true, 'archived' => true]);
    } else {
        $deleteStmt = $pdo->prepare("DELETE FROM accounts WHERE id = ? AND company_id = ?");
        $deleteStmt->execute([$data['id'], $companyId]);
        sendResponse(['ok' => true, 'deleted' => true]);
    }
}
else {
    http_response_code(404);
    sendResponse(['error' => 'Not found']);
}
?>
