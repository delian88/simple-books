<?php
require 'api/db.php';
try {
    $row = $pdo->query("SELECT * FROM system_settings WHERE `key` = 'payment_methods'")->fetch();
    $methods = $row ? json_decode($row['value'], true) : [];
    $newMethod = [
        "id" => uniqid(),
        "name" => "Test",
        "type" => "CASH"
    ];
    $methods[] = $newMethod;
    
    if ($row) {
        $update = $pdo->prepare("UPDATE system_settings SET `value` = ? WHERE `key` = 'payment_methods'");
        $update->execute([json_encode($methods)]);
        echo "Updated successfully\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
