<?php
/**
 * Delete Category Endpoint
 * DELETE /api/categories/delete.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Response.php';
require_once '../utils/Auth.php';

// Only accept DELETE requests
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    Response::error('Method not allowed', 405);
}

// Get posted data
$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['id'])) {
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
    Response::error('Cannot delete system categories', 403);
}

// Check if category has transactions
$trans_query = "SELECT COUNT(*) as count FROM transactions WHERE category_id = :category_id";
$trans_stmt = $db->prepare($trans_query);
$trans_stmt->bindParam(':category_id', $category_id);
$trans_stmt->execute();
$trans_count = $trans_stmt->fetch(PDO::FETCH_ASSOC)['count'];

if ($trans_count > 0) {
    Response::error('Cannot delete category with existing transactions. Please reassign or delete all transactions first.', 422);
}

// Delete category
$delete_query = "DELETE FROM categories WHERE id = :id AND user_id = :user_id";
$delete_stmt = $db->prepare($delete_query);
$delete_stmt->bindParam(':id', $category_id);
$delete_stmt->bindParam(':user_id', $user_id);

try {
    $delete_stmt->execute();
    Response::success(['deleted_id' => $category_id], 'Category deleted successfully');
} catch (Exception $e) {
    Response::serverError('Failed to delete category: ' . $e->getMessage());
}
