<?php
// auth.php - Full custom auth using MySQL users table + signed JWT
require_once 'db.php';

// JWT SECRET — set via .htaccess: SetEnv APP_JWT_SECRET your_secret_here
define('JWT_SECRET', getenv('APP_JWT_SECRET') ?: 'ledgerly_default_secret_change_in_production');
define('TOKEN_EXPIRY_SECONDS', 60 * 60 * 24 * 7); // 7 days

function b64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}
function b64url_decode(string $data): string {
    $pad = strlen($data) % 4;
    if ($pad) $data .= str_repeat('=', 4 - $pad);
    return base64_decode(strtr($data, '-_', '+/'));
}
function createJWT(array $payload): string {
    $h = b64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload['iat'] = time();
    $payload['exp'] = time() + TOKEN_EXPIRY_SECONDS;
    $p = b64url_encode(json_encode($payload));
    $s = b64url_encode(hash_hmac('sha256', "$h.$p", JWT_SECRET, true));
    return "$h.$p.$s";
}
function verifyJWT(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$h, $p, $s] = $parts;
    $expected = b64url_encode(hash_hmac('sha256', "$h.$p", JWT_SECRET, true));
    if (!hash_equals($expected, $s)) return null;
    $payload = json_decode(b64url_decode($p), true);
    if (!$payload || (isset($payload['exp']) && $payload['exp'] < time())) return null;
    return $payload;
}
function getAuthPayload(): ?array {
    $headers = function_exists('apache_request_headers') ? apache_request_headers() : [];
    foreach ($_SERVER as $k => $v) {
        if (strpos($k, 'HTTP_') === 0) {
            $key = str_replace('_', '-', ucwords(strtolower(substr($k, 5)), '_'));
            if (!isset($headers[$key])) $headers[$key] = $v;
        }
    }
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (strpos($auth, 'Bearer ') === 0) {
        return verifyJWT(substr($auth, 7));
    }
    return null;
}

// Returns userId string or sends 401
function requireAuth(): string {
    $payload = getAuthPayload();
    if (!$payload || empty($payload['sub'])) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }
    return $payload['sub'];
}

// Returns company_id string or sends 403
function getActiveCompanyId($pdo, string $userId): string {
    $stmt = $pdo->prepare("SELECT company_id FROM company_users WHERE user_id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    if (!$row) jsonResponse(['error' => 'User has no company'], 403);
    return $row['company_id'];
}

// ── ACTIONS — only run when auth.php is accessed directly ───────────────────
if (!defined('AUTH_AS_LIB')) {
$action = $_GET['action'] ?? '';

switch ($action) {

    case 'signup':
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $email        = trim($body['email'] ?? '');
        $password     = $body['password'] ?? '';
        $businessName = trim($body['businessName'] ?? 'My Business');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL))
            jsonResponse(['error' => 'Invalid email address'], 400);
        if (strlen($password) < 6)
            jsonResponse(['error' => 'Password must be at least 6 characters'], 400);

        $chk = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
        $chk->execute([$email]);
        if ($chk->fetch()) jsonResponse(['error' => 'An account with that email already exists'], 409);

        $userId    = bin2hex(random_bytes(9)); // 18-char unique id
        $hash      = password_hash($password, PASSWORD_BCRYPT);
        $now       = date('Y-m-d H:i:s');

        $pdo->prepare("INSERT INTO users (id, email, password, role, created_at, updated_at) VALUES (?, ?, ?, 'Company', ?, ?)")
            ->execute([$userId, $email, $hash, $now, $now]);

        $companyId = bin2hex(random_bytes(9));
        $pdo->prepare("INSERT INTO companies (id, name, default_currency, created_at, updated_at) VALUES (?, ?, 'NGN', ?, ?)")
            ->execute([$companyId, $businessName, $now, $now]);

        $pdo->prepare("INSERT INTO company_users (id, user_id, company_id, role, status, created_at, updated_at) VALUES (?, ?, ?, 'OWNER', 'ACTIVE', ?, ?)")
            ->execute([bin2hex(random_bytes(9)), $userId, $companyId, $now, $now]);

        $token = createJWT(['sub' => $userId, 'email' => $email, 'company' => $companyId]);
        jsonResponse(['ok' => true, 'token' => $token, 'user' => ['id' => $userId, 'email' => $email]]);
        break;

    case 'login':
        $body     = json_decode(file_get_contents('php://input'), true) ?? [];
        $email    = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';

        if (!$email || !$password) jsonResponse(['error' => 'Email and password are required'], 400);

        $stmt = $pdo->prepare("SELECT id, password FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            jsonResponse(['error' => 'Invalid email or password'], 401);
        }

        $cuStmt = $pdo->prepare("SELECT company_id FROM company_users WHERE user_id = ? LIMIT 1");
        $cuStmt->execute([$user['id']]);
        $cu = $cuStmt->fetch();

        $token = createJWT(['sub' => $user['id'], 'email' => $email, 'company' => $cu['company_id'] ?? null]);
        jsonResponse(['ok' => true, 'token' => $token, 'user' => ['id' => $user['id'], 'email' => $email]]);
        break;

    case 'logout':
        jsonResponse(['ok' => true]);
        break;

    case 'session':
        $payload = getAuthPayload();
        if (!$payload) jsonResponse(['error' => 'No session'], 401);
        $stmt = $pdo->prepare("SELECT u.id, u.email, u.role, p.business_name FROM users u LEFT JOIN profiles p ON p.id = u.id WHERE u.id = ? LIMIT 1");
        $stmt->execute([$payload['sub']]);
        $uData = $stmt->fetch();
        jsonResponse([
            'id' => $payload['sub'],
            'email' => $uData['email'] ?? $payload['email'] ?? null,
            'role' => $uData['role'] ?? 'Company',
            'businessName' => $uData['business_name'] ?? null
        ]);
        break;

    default:
        jsonResponse(['error' => 'Unknown action'], 400);
}
} // end direct-access guard
?>
