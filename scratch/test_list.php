<?php
require 'api/db.php';
$stmt = $pdo->prepare("SELECT `value` FROM system_settings WHERE `key` = 'payment_methods'");
$stmt->execute();
$row = $stmt->fetch();
print_r($row);
?>
