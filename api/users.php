<?php
require_once 'db.php';
define('AUTH_AS_LIB', true);
require_once 'auth.php';

$userId     = requireAuth();
$company_id = getActiveCompanyId($pdo, $userId);
$action     = $_GET['action'] ?? '';

function getMyCompanyRole($pdo, $companyId, $userId) {
    $s = $pdo->prepare("SELECT role FROM company_users WHERE user_id = ? AND company_id = ? LIMIT 1");
    $s->execute([$userId, $companyId]);
    $r = $s->fetch();
    return $r['role'] ?? '';
}

switch ($action) {
    case 'listUsers':
        $stmt = $pdo->prepare("
            SELECT cu.id, u.id AS user_id, u.email, cu.role, cu.status, cu.created_at
            FROM company_users cu
            JOIN users u ON u.id = cu.user_id
            WHERE cu.company_id = ?
            ORDER BY cu.created_at ASC
        ");
        $stmt->execute([$company_id]);
        jsonResponse($stmt->fetchAll());
        break;

    case 'inviteUser':
        if (!in_array(getMyCompanyRole($pdo, $company_id, $userId), ['OWNER', 'ADMIN'], true)) {
            jsonResponse(['error' => 'Only owners or admins can invite users'], 403);
        }
        $data  = json_decode(file_get_contents('php://input'), true) ?? [];
        $email = trim($data['email'] ?? '');
        $role  = strtoupper(trim($data['role'] ?? 'STAFF'));
        $pass  = $data['password'] ?? bin2hex(random_bytes(8));

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(["error" => "Valid email is required"], 400);
        }
        if (!in_array($role, ['ADMIN', 'ACCOUNTANT', 'AUDITOR', 'STAFF', 'COMPANY'], true)) {
            $role = 'STAFF';
        }

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
            $stmt->execute([$email]);
            $existingUser = $stmt->fetch();

            if ($existingUser) {
                $user_id = $existingUser['id'];
                $check = $pdo->prepare("SELECT id FROM company_users WHERE user_id = ? AND company_id = ?");
                $check->execute([$user_id, $company_id]);
                if ($check->fetch()) {
                    $pdo->rollBack();
                    jsonResponse(["error" => "User is already in this company"], 400);
                }
            } else {
                $user_id = bin2hex(random_bytes(9));
                $now = date('Y-m-d H:i:s');
                $insertUser = $pdo->prepare("INSERT INTO users (id, email, password, role, created_at, updated_at) VALUES (?, ?, ?, 'Company', ?, ?)");
                $insertUser->execute([$user_id, $email, password_hash($pass, PASSWORD_BCRYPT), $now, $now]);
            }

            $now = date('Y-m-d H:i:s');
            $insertCompanyUser = $pdo->prepare("INSERT INTO company_users (id, user_id, company_id, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)");
            $insertCompanyUser->execute([bin2hex(random_bytes(9)), $user_id, $company_id, $role, $now, $now]);

            $pdo->commit();
            jsonResponse(["ok" => true, "success" => true]);
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(["error" => "Failed to invite user: " . $e->getMessage()], 500);
        }
        break;

    case 'updateRole':
        if (!in_array(getMyCompanyRole($pdo, $company_id, $userId), ['OWNER', 'ADMIN'], true)) {
            jsonResponse(['error' => 'Only owners or admins can change roles'], 403);
        }
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $role = strtoupper(trim($data['role'] ?? ''));
        if (!in_array($role, ['ADMIN', 'ACCOUNTANT', 'AUDITOR', 'STAFF'], true)) {
            jsonResponse(['error' => 'Invalid role'], 400);
        }
        $pdo->prepare("UPDATE company_users SET role = ?, updated_at = ? WHERE (id = ? OR user_id = ?) AND company_id = ? AND role <> 'OWNER'")
            ->execute([$role, date('Y-m-d H:i:s'), $data['id'] ?? '', $data['userId'] ?? '', $company_id]);
        jsonResponse(['ok' => true]);
        break;

    case 'removeUser':
        if (!in_array(getMyCompanyRole($pdo, $company_id, $userId), ['OWNER', 'ADMIN'], true)) {
            jsonResponse(['error' => 'Only owners or admins can remove users'], 403);
        }
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $pdo->prepare("DELETE FROM company_users WHERE (id = ? OR user_id = ?) AND company_id = ? AND role <> 'OWNER'")
            ->execute([$data['id'] ?? '', $data['userId'] ?? '', $company_id]);
        jsonResponse(['ok' => true]);
        break;

    default:
        jsonResponse(["error" => "Invalid action"], 400);
}
?>
