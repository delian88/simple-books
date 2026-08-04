<?php
/**
 * Update Bank Account Endpoint
 * PUT /api/accounts/update.php
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

// Validate account ID
if (!isset($data['id']) || !is_numeric($data['id'])) {
    Response::error('Account ID is required');
}

$account_id = (int)$data['id'];

// Connect to database
$database = new Database();
$db = $database->getConnection();

// Initialize Auth and get authenticated user
$auth = new Auth($db);
$user_id = $auth->getAuthenticatedUser();

if (!$user_id) {
    Response::unauthorized();
}

// Check if account exists
$check_query = "SELECT id FROM bank_accounts WHERE id = :id AND user_id = :user_id";
$check_stmt = $db->prepare($check_query);
$check_stmt->bindParam(':id', $account_id);
$check_stmt->bindParam(':user_id', $user_id);
$check_stmt->execute();

if ($check_stmt->rowCount() == 0) {
    Response::error('Bank account not found', 404);
}

// Validate fields if provided
$errors = [];

if (isset($data['account_type']) && !in_array($data['account_type'], ['checking', 'savings', 'credit', 'business'])) {
    $errors['account_type'] = 'Invalid account type';
}

if (!empty($errors)) {
    Response::validationError($errors);
}

// Build update query dynamically
$update_fields = [];
$params = [':id' => $account_id, ':user_id' => $user_id];

$allowed_fields = ['account_name', 'account_number', 'bank_name', 'account_type', 'currency', 'is_active'];

foreach ($allowed_fields as $field) {
    if (isset($data[$field])) {
        $update_fields[] = "$field = :$field";
        $params[":$field"] = $data[$field];
    }
}

if (empty($update_fields)) {
    Response::error('No fields to update');
}

$query = "UPDATE bank_accounts SET " . implode(', ', $update_fields) . " WHERE id = :id AND user_id = :user_id";
$stmt = $db->prepare($query);

try {
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->execute();

    // Get updated account
    $get_query = "SELECT * FROM bank_accounts WHERE id = :id";
    $get_stmt = $db->prepare($get_query);
    $get_stmt->bindParam(':id', $account_id);
    $get_stmt->execute();
    
    $updated_account = $get_stmt->fetch(PDO::FETCH_ASSOC);

    Response::success(['account' => $updated_account], 'Bank account updated successfully');

} catch (Exception $e) {
    Response::serverError('Failed to update bank account: ' . $e->getMessage());
}
