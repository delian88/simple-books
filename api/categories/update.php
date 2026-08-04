<?php
/**
 * Update Category Endpoint
 * PUT /api/categories/update.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Response.php';
require_once '../utils/Auth.php';

// Only accept PUT requests
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    Response::error('Method not allowed', 405);
}

// Get posted data
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    Response::error('Invalid JSON data');
}

// Validate category ID
if (!isset($data['id']) || !is_numeric($data['id'])) {
    Response::error('Category ID is required');
}

$category_id = (int)$data['id'];

// Connect to database
$database = new Database();
$db = $database->getConnection();

// Initialize Auth and get authenticated user
$auth = new Auth($db);
$user_id = $auth->getAuthenticatedUser();

if (!$user_id) {
    Response::unauthorized();
}

// Check if category exists and is not a system category
$check_query = "SELECT id, is_system FROM categories WHERE id = :id AND user_id = :user_id";
$check_stmt = $db->prepare($check_query);
$check_stmt->bindParam(':id', $category_id);
$check_stmt->bindParam(':user_id', $user_id);
$check_stmt->execute();

if ($check_stmt->rowCount() == 0) {
    Response::error('Category not found', 404);
}

$category = $check_stmt->fetch(PDO::FETCH_ASSOC);

if ($category['is_system']) {
    Response::error('Cannot modify system categories', 403);
}

// Validate fields if provided
$errors = [];

if (isset($data['type']) && !in_array($data['type'], ['income', 'expense', 'asset', 'liability', 'equity'])) {
    $errors['type'] = 'Invalid category type';
}

if (!empty($errors)) {
    Response::validationError($errors);
}

// Build update query dynamically
$update_fields = [];
$params = [':id' => $category_id, ':user_id' => $user_id];

$allowed_fields = ['name', 'type', 'parent_id', 'color', 'icon', 'description'];

foreach ($allowed_fields as $field) {
    if (isset($data[$field])) {
        $update_fields[] = "$field = :$field";
        $params[":$field"] = $data[$field];
    }
}

if (empty($update_fields)) {
    Response::error('No fields to update');
}

$query = "UPDATE categories SET " . implode(', ', $update_fields) . " WHERE id = :id AND user_id = :user_id";
$stmt = $db->prepare($query);

try {
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->execute();

    // Get updated category
    $get_query = "SELECT * FROM categories WHERE id = :id";
    $get_stmt = $db->prepare($get_query);
    $get_stmt->bindParam(':id', $category_id);
    $get_stmt->execute();
    
    $updated_category = $get_stmt->fetch(PDO::FETCH_ASSOC);

    Response::success(['category' => $updated_category], 'Category updated successfully');

} catch (Exception $e) {
    Response::serverError('Failed to update category: ' . $e->getMessage());
}
