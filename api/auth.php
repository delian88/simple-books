<?php
// api/auth.php
require_once 'config.php';

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $input['data']['email'] ?? '';
    $password = $input['data']['password'] ?? '';
    
    $stmt = $pdo->prepare("SELECT id, password, role FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if ($user && password_verify($password, $user['password'])) {
        // Log activity
        $logStmt = $pdo->prepare("INSERT INTO activity_logs (id, user_id, action, description, created_at) VALUES (UUID(), ?, 'LOGIN', 'User logged in to the platform.', NOW())");
        $logStmt->execute([$user['id']]);
        
        $token = generate_jwt(['userId' => $user['id'], 'role' => $user['role'], 'exp' => time() + 86400]);
        setcookie('ledgerly_auth', $token, time() + 86400, '/');
        sendResponse(['ok' => true]);
    } else {
        http_response_code(400);
        sendResponse(['error' => 'Invalid email or password']);
    }
} 
elseif ($action === 'logout' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    setcookie('ledgerly_auth', '', time() - 3600, '/');
    sendResponse(['ok' => true]);
}
elseif ($action === 'session' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $token = $_COOKIE['ledgerly_auth'] ?? null;
    if (!$token) sendResponse(null);
    
    $payload = verify_jwt($token);
    if (!$payload || $payload['exp'] < time()) sendResponse(null);
    
    $stmt = $pdo->prepare("SELECT id, email, role FROM users WHERE id = ?");
    $stmt->execute([$payload['userId']]);
    $user = $stmt->fetch();
    
    sendResponse($user ?: null);
}
// Signup is omitted for brevity in this step, it requires handling many tables.
else {
    http_response_code(404);
    sendResponse(['error' => 'Not found']);
}
?>
