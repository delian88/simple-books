<?php
require 'db.php';
require 'auth.php';

$user = authenticate();
$company_id = $user['company_id'];

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'listUsers':
        // Get all users for this company
        $stmt = $pdo->prepare("
            SELECT u.id, u.email, cu.role 
            FROM users u
            JOIN company_users cu ON u.id = cu.user_id
            WHERE cu.company_id = ?
        ");
        $stmt->execute([$company_id]);
        $users = $stmt->fetchAll();
        jsonResponse($users);
        break;

    case 'inviteUser':
        $data = json_decode(file_get_contents('php://input'), true);
        $email = $data['email'] ?? '';
        $role = $data['role'] ?? 'Company';

        if (empty($email)) {
            jsonResponse(["error" => "Email is required"], 400);
        }

        try {
            $pdo->beginTransaction();

            // Check if user exists
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $existingUser = $stmt->fetch();

            if ($existingUser) {
                $user_id = $existingUser['id'];
                
                // Check if already in company
                $check = $pdo->prepare("SELECT user_id FROM company_users WHERE user_id = ? AND company_id = ?");
                $check->execute([$user_id, $company_id]);
                if ($check->fetch()) {
                    $pdo->rollBack();
                    jsonResponse(["error" => "User is already in this company"], 400);
                }
            } else {
                // Create new user dummy account for invite
                $user_id = uniqid();
                $insertUser = $pdo->prepare("INSERT INTO users (id, email, password) VALUES (?, ?, ?)");
                $insertUser->execute([$user_id, $email, password_hash(bin2hex(random_bytes(8)), PASSWORD_DEFAULT)]);
            }

            // Link to company
            $insertCompanyUser = $pdo->prepare("INSERT INTO company_users (user_id, company_id, role) VALUES (?, ?, ?)");
            $insertCompanyUser->execute([$user_id, $company_id, $role]);

            $pdo->commit();
            jsonResponse(["success" => true]);

        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(["error" => "Failed to invite user: " . $e->getMessage()], 500);
        }
        break;

    default:
        jsonResponse(["error" => "Invalid action"], 400);
}
