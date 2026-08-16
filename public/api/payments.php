<?php
// payments.php
require_once 'db.php';
require_once 'auth.php';

$userId = requireAuth();
$companyId = getActiveCompanyId($pdo, $userId);

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'listPaymentMethods':
        jsonResponse([
            ["id" => "1", "name" => "Cash", "type" => "CASH"],
            ["id" => "2", "name" => "Bank Transfer", "type" => "BANK"]
        ]);
        break;
        
    case 'processPayment':
        jsonResponse(["ok" => true, "status" => "COMPLETED", "transactionId" => uniqid()]);
        break;

    default:
        jsonResponse(["error" => "Unknown action"], 400);
}
?>
