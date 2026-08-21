<?php
require 'db.php';
require 'auth.php';

$user = authenticate();
$company_id = $user['company_id'];

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'getConfig':
        // Retrieve config from system_settings
        $stmt = $pdo->prepare("SELECT `value` FROM system_settings WHERE `key` = 'landing_page_config'");
        $stmt->execute();
        $row = $stmt->fetch();
        
        if ($row) {
            jsonResponse(json_decode($row['value'], true));
        } else {
            // default config
            jsonResponse([
                "hero_title" => "Welcome to Our Platform",
                "hero_subtitle" => "The best accounting solution.",
                "features" => [],
                "contact_email" => ""
            ]);
        }
        break;

    case 'updateConfig':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            jsonResponse(["error" => "Invalid input"], 400);
        }

        // Check if config exists
        $stmt = $pdo->prepare("SELECT id FROM system_settings WHERE `key` = 'landing_page_config'");
        $stmt->execute();
        $row = $stmt->fetch();
        
        if ($row) {
            $update = $pdo->prepare("UPDATE system_settings SET `value` = ? WHERE `key` = 'landing_page_config'");
            $update->execute([json_encode($data)]);
        } else {
            $insert = $pdo->prepare("INSERT INTO system_settings (`id`, `key`, `value`) VALUES (?, 'landing_page_config', ?)");
            $insert->execute([uniqid(), json_encode($data)]);
        }

        jsonResponse(["success" => true]);
        break;

    default:
        jsonResponse(["error" => "Invalid action"], 400);
}
