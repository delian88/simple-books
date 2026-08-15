<?php
// api/app.php
require_once 'config.php';

$action = $_GET['action'] ?? '';

if ($action === 'getPublicSettings' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare("SELECT `key`, `value` FROM system_settings WHERE `key` IN ('appName', 'appLogo')");
    $stmt->execute();
    $settings = $stmt->fetchAll();
    
    $result = [
        'appName' => 'Ledgerly',
        'appLogo' => ''
    ];
    
    foreach ($settings as $setting) {
        if (!empty($setting['value'])) {
            $result[$setting['key']] = $setting['value'];
        }
    }
    
    sendResponse($result);
} else {
    http_response_code(404);
    sendResponse(['error' => 'Not found']);
}
?>
