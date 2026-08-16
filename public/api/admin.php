<?php
// admin.php
require_once 'db.php';
require_once 'auth.php';

$action = $_GET['action'] ?? '';

// Helper for admin
function ensureAdmin($pdo) {
    $userId = requireAuth();
    $stmt = $pdo->prepare("SELECT role FROM User WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    if (!$user || $user['role'] !== 'admin') {
        jsonResponse(array("error" => "Forbidden"), 403);
    }
}

switch ($action) {
    case 'getSystemStats':
        ensureAdmin($pdo);
        $users = $pdo->query("SELECT COUNT(*) FROM User")->fetchColumn();
        $companies = $pdo->query("SELECT COUNT(*) FROM Company")->fetchColumn();
        jsonResponse(["totalUsers" => $users, "totalCompanies" => $companies]);
        break;

    case 'listAllCompanies':
        ensureAdmin($pdo);
        $stmt = $pdo->query("SELECT * FROM Company ORDER BY createdAt DESC");
        jsonResponse($stmt->fetchAll());
        break;

    default:
        jsonResponse(["error" => "Unknown action"], 400);
}
?>
