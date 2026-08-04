<?php
/**
 * List Categories Endpoint
 * GET /api/categories/list.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Response.php';
require_once '../utils/Auth.php';

// Only accept GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

// Connect to database
$database = new Database();
$db = $database->getConnection();

// Initialize Auth and get authenticated user
$auth = new Auth($db);
$user_id = $auth->getAuthenticatedUser();

if (!$user_id) {
    Response::unauthorized();
}

// Get query parameters
$type = isset($_GET['type']) ? $_GET['type'] : null;

// Build query
$query = "SELECT * FROM categories WHERE user_id = :user_id";

if ($type) {
    $query .= " AND type = :type";
}

$query .= " ORDER BY name ASC";

$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $user_id);

if ($type) {
    $stmt->bindParam(':type', $type);
}

$stmt->execute();
$categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Group by type
$grouped = [
    'income' => [],
    'expense' => [],
    'asset' => [],
    'liability' => [],
    'equity' => []
];

foreach ($categories as $category) {
    $grouped[$category['type']][] = $category;
}

Response::success([
    'categories' => $categories,
    'grouped' => $grouped,
    'total' => count($categories)
]);
