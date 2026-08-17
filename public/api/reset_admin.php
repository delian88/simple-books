<?php
// Script to run on Namecheap cPanel phpMyAdmin or via web request to sync admin password
require_once 'db.php';

$email    = 'nutech2025@gmail.com';
$password = 'Admin@webmaster$1';
$hash     = password_hash($password, PASSWORD_BCRYPT);
$now      = date('Y-m-d H:i:s');

// 1. Check if user exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
$stmt->execute([$email]);
$user = $stmt->fetch();

if ($user) {
    $pdo->prepare("UPDATE users SET password = ?, role = 'Admin', updated_at = ? WHERE id = ?")
        ->execute([$hash, $now, $user['id']]);
    jsonResponse(["ok" => true, "message" => "Updated $email password to Admin@webmaster\$1 on Namecheap"]);
} else {
    $userId = bin2hex(random_bytes(9));
    $pdo->prepare("INSERT INTO users (id, email, password, role, created_at, updated_at) VALUES (?, ?, ?, 'Admin', ?, ?)")
        ->execute([$userId, $email, $hash, $now, $now]);
    
    $companyId = bin2hex(random_bytes(9));
    $pdo->prepare("INSERT INTO companies (id, name, default_currency, created_at, updated_at) VALUES (?, 'Nutech Admin', 'NGN', ?, ?)")
        ->execute([$companyId, $now, $now]);

    $pdo->prepare("INSERT INTO company_users (id, user_id, company_id, role, status, created_at, updated_at) VALUES (?, ?, ?, 'OWNER', 'ACTIVE', ?, ?)")
        ->execute([bin2hex(random_bytes(9)), $userId, $companyId, $now, $now]);

    jsonResponse(["ok" => true, "message" => "Created $email on Namecheap with Admin@webmaster\$1"]);
}
