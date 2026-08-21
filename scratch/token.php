<?php
require 'api/auth.php';

$userId = bin2hex(random_bytes(9));
$companyId = bin2hex(random_bytes(9));
$token = createJWT(['sub' => $userId, 'email' => 'test@test.com', 'company' => $companyId]);

$pdo->prepare("INSERT INTO users (id, email, password, role) VALUES (?, ?, 'pass', 'Company')")
    ->execute([$userId, 'test@test.com']);
$pdo->prepare("INSERT INTO company_users (id, user_id, company_id, role, status) VALUES (?, ?, ?, 'OWNER', 'ACTIVE')")
    ->execute([bin2hex(random_bytes(9)), $userId, $companyId]);

echo $token;
?>
