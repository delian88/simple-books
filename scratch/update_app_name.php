<?php
require 'public/api/db.php';
$now = date('Y-m-d H:i:s');
foreach (['appName', 'app_name'] as $key) {
  $id = bin2hex(random_bytes(9));
  $stmt = $pdo->prepare("INSERT INTO system_settings (id, `key`, `value`, created_at, updated_at) VALUES (?, ?, 'KoboBooks', ?, ?) ON DUPLICATE KEY UPDATE `value` = 'KoboBooks', updated_at = ?");
  $stmt->execute([$id, $key, $now, $now, $now]);
}
echo "Upserted system_settings appName and app_name to 'KoboBooks' successfully.\n";
