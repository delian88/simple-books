<?php
// auth.php - Full custom auth using MySQL + signed JWT (no Supabase)
require_once 'db.php';

// ── JWT SECRET ─────────────────────────────────────────────────────────────
// Set this as an environment variable on Namecheap via .htaccess:
//   SetEnv APP_JWT_SECRET your_random_secret_here
// Generate a good secret with: php -r "echo bin2hex(random_bytes(32));"
define('JWT_SECRET', getenv('APP_JWT_SECRET') ?: 'change_this_to_a_random_secret_min_32_chars');
define('TOKEN_EXPIRY_SECONDS', 60 * 60 * 24 * 7); // 7 days

// ── JWT HELPERS ─────────────────────────────────────────────────────────────
function b64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function b64url_decode(string $data): string {
    $remainder = strlen($data) % 4;
    if ($remainder) $data .= str_repeat('=', 4 - $remainder);
    return base64_decode(strtr($data, '-_', '+/'));
}

function createJWT(array $payload): string {
    $header = b64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload['iat'] = time();
    $payload['exp'] = time() + TOKEN_EXPIRY_SECONDS;
    $payloadB64 = b64url_encode(json_encode($payload));
    $sig = b64url_encode(hash_hmac('sha256', "$header.$payloadB64", JWT_SECRET, true));
    return "$header.$payloadB64.$sig";
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
    // Fallback for Nginx
    foreach ($_SERVER as $k => $v) {
        if (strpos($k, 'HTTP_') === 0) {
            $key = str_replace('_', '-', ucwords(strtolower(substr($k, 5)), '_'));
            $headers[$key] = $v;
        }
    }
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (strpos($auth, 'Bearer ') === 0) {
        return verifyJWT(substr($auth, 7));
    }
    return null;
}

function requireAuth(): string {
    $payload = getAuthPayload();
    if (!$payload) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }
    return $payload['sub'];
}

function getActiveCompanyId($pdo, string $userId): string {
    $stmt = $pdo->prepare("SELECT companyId FROM CompanyUser WHERE userId = ? LIMIT 1");
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    if (!$row) jsonResponse(['error' => 'User has no company'], 403);
    return $row['companyId'];
}

// ── ACTIONS ─────────────────────────────────────────────────────────────────
$action = $_GET['action'] ?? '';

switch ($action) {

    case 'signup':
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $email        = trim($body['email'] ?? '');
        $password     = $body['password'] ?? '';
        $businessName = trim($body['businessName'] ?? 'My Business');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonResponse(['error' => 'Invalid email'], 400);
        if (strlen($password) < 6) jsonResponse(['error' => 'Password must be at least 6 characters'], 400);

        // Check duplicate
        $chk = $pdo->prepare("SELECT id FROM User WHERE email = ? LIMIT 1");
        $chk->execute([$email]);
        if ($chk->fetch()) jsonResponse(['error' => 'An account with that email already exists'], 409);

        $userId    = uniqid('u_', true);
        $hash      = password_hash($password, PASSWORD_BCRYPT);
        $now       = date('Y-m-d H:i:s');

        // Insert user
        $pdo->prepare("INSERT INTO User (id, email, password, role, createdAt, updatedAt) VALUES (?, ?, ?, 'user', ?, ?)")
            ->execute([$userId, $email, $hash, $now, $now]);

        // Create company
        $companyId = uniqid('co_', true);
        $pdo->prepare("INSERT INTO Company (id, name, currency, createdAt, updatedAt) VALUES (?, ?, 'NGN', ?, ?)")
            ->execute([$companyId, $businessName, $now, $now]);

        // Link user ↔ company
        $pdo->prepare("INSERT INTO CompanyUser (id, userId, companyId, role, createdAt, updatedAt) VALUES (?, ?, ?, 'OWNER', ?, ?)")
            ->execute([uniqid(), $userId, $companyId, $now, $now]);

        $token = createJWT(['sub' => $userId, 'email' => $email, 'company' => $companyId]);
        jsonResponse(['ok' => true, 'token' => $token, 'user' => ['id' => $userId, 'email' => $email]]);
        break;

    case 'login':
        $body     = json_decode(file_get_contents('php://input'), true) ?? [];
        $email    = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';

        $stmt = $pdo->prepare("SELECT id, password FROM User WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            jsonResponse(['error' => 'Invalid email or password'], 401);
        }

        $companyStmt = $pdo->prepare("SELECT companyId FROM CompanyUser WHERE userId = ? LIMIT 1");
        $companyStmt->execute([$user['id']]);
        $cu = $companyStmt->fetch();

        $token = createJWT(['sub' => $user['id'], 'email' => $email, 'company' => $cu['companyId'] ?? null]);
        jsonResponse(['ok' => true, 'token' => $token, 'user' => ['id' => $user['id'], 'email' => $email]]);
        break;

    case 'logout':
        // Stateless JWT: client just discards the token. Nothing to do server-side.
        jsonResponse(['ok' => true]);
        break;

    case 'session':
        $payload = getAuthPayload();
        if (!$payload) jsonResponse(['error' => 'No session'], 401);
        jsonResponse(['id' => $payload['sub'], 'email' => $payload['email'] ?? null]);
        break;

    default:
        jsonResponse(['error' => 'Unknown action'], 400);
}
?>
