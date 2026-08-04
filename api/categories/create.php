<?php
/**
 * Create Category Endpoint
 * POST /api/categories/create.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Response.php';
require_once '../utils/Auth.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

// Get posted data
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    Response::error('Invalid JSON data');
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

// Validate required fields
$required = ['name', 'type'];
$errors = [];

foreach ($required as $field) {
    if (!isset($data[$field]) || $data[$field] === '') {
        $errors[$field] = ucfirst(str_replace('_', ' ', $field)) . ' is required';
    }
}

// Validate type
if (isset($data['type']) && !in_array($data['type'], ['income', 'expense', 'asset', 'liability', 'equity'])) {
    $errors['type'] = 'Invalid category type';
}

if (!empty($errors)) {
    Response::validationError($errors);
}

// Set defaults
$color = isset($data['color']) ? $data['color'] : '#10b981';
$icon = isset($data['icon']) ? $data['icon'] : null;
$description = isset($data['description']) ? $data['description'] : null;
$parent_id = isset($data['parent_id']) ? $data['parent_id'] : null;

// Insert category
$query = "INSERT INTO categories 
          (user_id, name, type, parent_id, color, icon, description) 
          VALUES (:user_id, :name, :type, :parent_id, :color, :icon, :description)";

$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $user_id);
$stmt->bindParam(':name', $data['name']);
$stmt->bindParam(':type', $data['type']);
$stmt->bindParam(':parent_id', $parent_id);
$stmt->bindParam(':color', $color);
$stmt->bindParam(':icon', $icon);
$stmt->bindParam(':description', $description);

try {
    $stmt->execute();
    $category_id = $db->lastInsertId();

    Response::success([
        'category_id' => $category_id
    ], 'Category created successfully', 201);

} catch (Exception $e) {
    Response::serverError('Failed to create category: ' . $e->getMessage());
}
