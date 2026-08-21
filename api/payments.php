<?php
// payments.php
require_once 'db.php';
define('AUTH_AS_LIB', true);
require_once 'auth.php';

$userId = requireAuth();
$companyId = getActiveCompanyId($pdo, $userId);

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'listPaymentMethods':
        $stmt = $pdo->prepare("SELECT `value` FROM system_settings WHERE `key` = 'payment_methods'");
        $stmt->execute();
        $row = $stmt->fetch();
        if ($row) {
            jsonResponse(json_decode($row['value'], true));
        } else {
            // Default methods
            $defaults = [
                ["id" => uniqid(), "name" => "Cash", "type" => "CASH"],
                ["id" => uniqid(), "name" => "Bank Transfer", "type" => "BANK"]
            ];
            $stmt = $pdo->prepare("INSERT INTO system_settings (`id`, `key`, `value`) VALUES (?, 'payment_methods', ?)");
            $stmt->execute([uniqid(), json_encode($defaults)]);
            jsonResponse($defaults);
        }
        break;
        
    case 'addPaymentMethod':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(["error" => "Method not allowed"], 405);
        }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['name']) || !isset($data['type'])) {
            jsonResponse(["error" => "Invalid input"], 400);
        }
        
        $stmt = $pdo->prepare("SELECT `value` FROM system_settings WHERE `key` = 'payment_methods'");
        $stmt->execute();
        $row = $stmt->fetch();
        
        $methods = $row ? json_decode($row['value'], true) : [];
        $newMethod = [
            "id" => uniqid(),
            "name" => $data['name'],
            "type" => $data['type']
        ];
        $methods[] = $newMethod;
        
        if ($row) {
            $update = $pdo->prepare("UPDATE system_settings SET `value` = ? WHERE `key` = 'payment_methods'");
            $update->execute([json_encode($methods)]);
        } else {
            $insert = $pdo->prepare("INSERT INTO system_settings (`id`, `key`, `value`) VALUES (?, 'payment_methods', ?)");
            $insert->execute([uniqid(), json_encode($methods)]);
        }
        
        jsonResponse($newMethod);
        break;
        
    case 'processPayment':
        jsonResponse(["ok" => true, "status" => "COMPLETED", "transactionId" => uniqid()]);
        break;

    default:
        jsonResponse(["error" => "Unknown action"], 400);
}
?>
