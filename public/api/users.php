<?php
// users.php
require_once 'db.php';
require_once 'auth.php';

$userId = requireAuth();

// requireAdmin logic
$stmt = $pdo->prepare("SELECT role FROM User WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch();
if (!$user || $user['role'] !== 'admin') {
    jsonResponse(array("error" => "Forbidden"), 403);
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'listUsers':
        $stmt = $pdo->prepare("SELECT u.*, p.firstName, p.lastName, p.avatarUrl FROM User u LEFT JOIN UserProfile p ON u.id = p.userId ORDER BY u.createdAt DESC");
        $stmt->execute();
        $users = $stmt->fetchAll();
        jsonResponse($users);
        break;

    case 'listActivities':
        $data = json_decode(file_get_contents('php://input'), true);
        $filterUserId = $data['userId'] ?? null;
        
        $sql = "SELECT a.*, u.email, u.role FROM ActivityLog a LEFT JOIN User u ON a.userId = u.id";
        $params = [];
        if ($filterUserId) {
            $sql .= " WHERE a.userId = ?";
            $params[] = $filterUserId;
        }
        $sql .= " ORDER BY a.createdAt DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $activities = $stmt->fetchAll();
        jsonResponse($activities);
        break;

    default:
        jsonResponse(array("error" => "Unknown action"), 400);
}
?>
