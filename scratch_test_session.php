<?php
require_once 'public/api/db.php';
try {
    $stmt = $pdo->prepare("SELECT u.id, u.email, u.role, p.business_name FROM users u LEFT JOIN profiles p ON p.id = u.id WHERE u.id = ? LIMIT 1");
    $stmt->execute(['ea8986f0-4fce-4fa6-afe1-01c41018aedc']);
    $res = $stmt->fetch();
    echo "Session query output:\n";
    print_r($res);
} catch (Exception $e) {
    echo "Session query failed: " . $e->getMessage() . "\n";
}
