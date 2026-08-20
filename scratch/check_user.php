<?php
require 'public/api/db.php';
$email = 'nutech2025@gmail.com';
$stmt = $pdo->prepare('SELECT id, email, password FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();
echo "User check: " . json_encode($user) . "\n";
