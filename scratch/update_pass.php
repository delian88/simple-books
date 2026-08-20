<?php
require 'public/api/db.php';
$stmt = $pdo->prepare("UPDATE users SET password = ? WHERE email = ?");
$stmt->execute([password_hash('Admin@nutech$1', PASSWORD_BCRYPT), 'nutech2025@gmail.com']);
echo "Password updated to Admin@nutech$1\n";
