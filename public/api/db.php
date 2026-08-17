<?php
// db.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database configuration
// Checks for DATABASE_URL environment variable (e.g. from local .env / filess.io)
// Defaults to Namecheap hosting credentials in production.
$dbUrl = getenv('DATABASE_URL') ?: (file_exists(__DIR__ . '/../../.env') ? parse_ini_file(__DIR__ . '/../../.env')['DATABASE_URL'] ?? null : null);

if ($dbUrl) {
    $dbParts  = parse_url($dbUrl);
    $host     = $dbParts['host'] ?? 'localhost';
    $port     = $dbParts['port'] ?? 3306;
    $db_name  = ltrim($dbParts['path'] ?? '', '/');
    $username = $dbParts['user'] ?? '';
    $password = $dbParts['pass'] ?? '';
    $dsn      = "mysql:host={$host};port={$port};dbname={$db_name};charset=utf8";
} else {
    $host     = "localhost";
    $db_name  = "mykornwi_bookz";
    $username = "mykornwi_bookzuser";
    $password = "bookzuser$1";
    $dsn      = "mysql:host={$host};dbname={$db_name};charset=utf8";
}

try {
    $pdo = new PDO($dsn, $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $exception) {
    http_response_code(500);
    echo json_encode(array("error" => "Connection error: " . $exception->getMessage()));
    exit();
}

// Helper function to return JSON response
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

// Start session for authentication if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
?>
