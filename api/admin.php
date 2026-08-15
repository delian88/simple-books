<?php
// api/admin.php
require_once 'config.php';

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

if ($action === 'getSettings' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    require_admin();
    
    $stmt = $pdo->query("SELECT `key`, `value` FROM system_settings");
    $settings = $stmt->fetchAll();
    
    $result = [];
    foreach ($settings as $setting) {
        $result[$setting['key']] = $setting['value'];
    }
    
    sendResponse($result);
}
elseif ($action === 'updateSettings' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    require_admin();
    
    $data = $input['data'] ?? [];
    if (empty($data) || !is_array($data)) {
        http_response_code(400);
        sendResponse(['error' => 'Invalid data']);
    }
    
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("INSERT INTO system_settings (`id`, `key`, `value`, `created_at`, `updated_at`) 
                               VALUES (UUID(), ?, ?, NOW(), NOW()) 
                               ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `updated_at` = NOW()");
                               
        foreach ($data as $key => $value) {
            $stmt->execute([$key, $value]);
        }
        
        $pdo->commit();
        sendResponse(['ok' => true]);
    } catch (\Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        sendResponse(['error' => 'Database error', 'details' => $e->getMessage()]);
    }
}
else {
    http_response_code(404);
    sendResponse(['error' => 'Not found']);
}
?>
