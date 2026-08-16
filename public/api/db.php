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
// On Namecheap, the database host is usually localhost
$host = "localhost";
$db_name = "mykornwi_bookz";
$username = "mykornwi_bookzuser";
$password = "bookzuser$1";

try {
    $pdo = new PDO("mysql:host=" . $host . ";dbname=" . $db_name . ";charset=utf8", $username, $password);
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
