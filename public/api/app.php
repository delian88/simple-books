<?php
// app.php - Public settings (no auth required)
require_once 'db.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'getPublicSettings':
        $stmt = $pdo->query("SELECT `key`, `value` FROM system_settings");
        $map  = [];
        foreach ($stmt->fetchAll() as $row) {
            $map[$row['key']] = $row['value'];
        }
        jsonResponse([
            'appName'    => $map['app_name']    ?? 'KoboBooks',
            'appLogo'    => $map['app_logo']    ?? null,
            'appTagline' => $map['app_tagline'] ?? 'Simple Accounting for Small Businesses',
        ]);
        break;

    default:
        jsonResponse(['error' => 'Unknown action'], 400);
}
?>
