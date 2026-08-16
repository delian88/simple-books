<?php
// users.php
require_once 'db.php';
require_once 'auth.php';

$userId    = requireAuth();
$companyId = getActiveCompanyId($pdo, $userId);
$action    = $_GET['action'] ?? '';

switch ($action) {
    case 'listUsers':
        $stmt = $pdo->prepare(
            "SELECT u.id, u.email, u.role, cu.role as company_role, cu.status, u.created_at
             FROM users u
             JOIN company_users cu ON cu.user_id = u.id
             WHERE cu.company_id = ?
             ORDER BY u.created_at DESC"
        );
        $stmt->execute([$companyId]);
        jsonResponse($stmt->fetchAll());
        break;

    case 'listActivities':
        $stmt = $pdo->prepare(
            "SELECT al.*, u.email FROM activity_logs al
             LEFT JOIN users u ON u.id = al.user_id
             WHERE al.company_id = ?
             ORDER BY al.created_at DESC LIMIT 100"
        );
        $stmt->execute([$companyId]);
        jsonResponse($stmt->fetchAll());
        break;

    default:
        jsonResponse(['error' => 'Unknown action'], 400);
}
?>
