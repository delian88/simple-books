<?php
// api/config.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = 'localhost'; // Fallback
$db   = 'mykornwi_bookz';
$user = 'mykornwi_bookzuser';
$pass = 'bookzuser$1';
$port = 3306;

// Load from .env.local or .env
$env_path_local = dirname(__DIR__) . '/.env.local';
$env_path = dirname(__DIR__) . '/.env';
$active_env_path = file_exists($env_path_local) ? $env_path_local : (file_exists($env_path) ? $env_path : null);

if ($active_env_path) {
    $env = parse_ini_file($active_env_path);
    if ($env && isset($env['DATABASE_URL'])) {
        $parsed = parse_url($env['DATABASE_URL']);
        if ($parsed) {
            $host = $parsed['host'] ?? $host;
            $user = $parsed['user'] ?? $user;
            $pass = $parsed['pass'] ?? $pass;
            $db   = isset($parsed['path']) ? ltrim($parsed['path'], '/') : $db;
            $port = $parsed['port'] ?? $port;
        }
    }
}

$charset = 'utf8mb4';

$dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

// JWT Helpers
$secret_key = getenv('APP_JWT_SECRET') ?: 'ledgerly_default_secret_change_in_production';

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
    return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', 3 - (3 + strlen($data)) % 4));
}

function generate_jwt($payload) {
    global $secret_key;
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode($payload);
    $base64UrlHeader = base64url_encode($header);
    $base64UrlPayload = base64url_encode($payload);
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret_key, true);
    $base64UrlSignature = base64url_encode($signature);
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function verify_jwt($jwt) {
    global $secret_key;
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) return false;
    $header = $parts[0];
    $payload = $parts[1];
    $signature = $parts[2];
    
    $valid_sig = base64url_encode(hash_hmac('sha256', $header . "." . $payload, $secret_key, true));
    if (hash_equals($valid_sig, $signature)) {
        return json_decode(base64url_decode($payload), true);
    }
    return false;
}

function generate_uuid() {
    return sprintf( '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ),
        mt_rand( 0, 0xffff ),
        mt_rand( 0, 0x0fff ) | 0x4000,
        mt_rand( 0, 0x3fff ) | 0x8000,
        mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff )
    );
}

function get_bearer_token() {
    $headers = apache_request_headers();
    if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    // Fallback if apache_request_headers is not available
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        if (preg_match('/Bearer\s(\S+)/', $_SERVER['HTTP_AUTHORIZATION'], $matches)) {
            return $matches[1];
        }
    }
    return null;
}

function require_auth() {
    $token = $_COOKIE['ledgerly_auth'] ?? get_bearer_token();
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit();
    }
    
    $payload = verify_jwt($token);
    if (!$payload || $payload['exp'] < time()) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit();
    }
    return $payload;
}

function require_admin() {
    $token = $_COOKIE['ledgerly_auth'] ?? get_bearer_token();
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit();
    }
    
    $payload = verify_jwt($token);
    if (!$payload || $payload['exp'] < time() || $payload['role'] !== 'Admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit();
    }
    return $payload;
}

function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}
?>
