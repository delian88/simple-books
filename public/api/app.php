<?php
// app.php - Public settings (no auth required)
require_once 'db.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'getPublicSettings':
        // Read from system_settings table
        $stmt = $pdo->query("SELECT `key`, `value` FROM system_settings");
        $settings = [];
        foreach ($stmt->fetchAll() as $row) {
            $settings[$row['key']] = $row['value'];
        }
        // Return structured response with defaults
        jsonResponse([
            'appName'    => $settings['app_name']    ?? 'Ledgerly',
            'appLogo'    => $settings['app_logo']    ?? null,
            'appTagline' => $settings['app_tagline'] ?? 'Simple Accounting for Small Businesses',
        ]);
        break;

    default:
        jsonResponse(['error' => 'Unknown action'], 400);
}
?>
