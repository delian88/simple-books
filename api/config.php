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

$host = 'localhost'; // Update with Namecheap DB host
$db   = 'mykornwi_bookz'; // Update with Namecheap DB name
$user = 'mykornwi_bookzuser'; // Update with Namecheap DB user
$pass = 'bookzuser$1'; // Update with Namecheap DB password
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
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
$secret_key = "CHANGE_THIS_TO_YOUR_JWT_SECRET";

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

function require_auth() {
    $token = $_COOKIE['ledgerly_auth'] ?? null;
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
    $token = $_COOKIE['ledgerly_auth'] ?? null;
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
