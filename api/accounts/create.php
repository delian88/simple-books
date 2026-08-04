<?php
/**
 * Create Bank Account Endpoint
 * POST /api/accounts/create.php
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
$required = ['account_name', 'bank_name', 'account_type'];
$errors = [];

foreach ($required as $field) {
    if (!isset($data[$field]) || $data[$field] === '') {
        $errors[$field] = ucfirst(str_replace('_', ' ', $field)) . ' is required';
    }
}

// Validate account type
if (isset($data['account_type']) && !in_array($data['account_type'], ['checking', 'savings', 'credit', 'business'])) {
    $errors['account_type'] = 'Invalid account type';
}

// Validate opening balance if provided
if (isset($data['opening_balance']) && !is_numeric($data['opening_balance'])) {
    $errors['opening_balance'] = 'Opening balance must be a number';
}

if (!empty($errors)) {
    Response::validationError($errors);
}

// Set defaults
$opening_balance = isset($data['opening_balance']) ? $data['opening_balance'] : 0.00;
$currency = isset($data['currency']) ? $data['currency'] : 'USD';
$account_number = isset($data['account_number']) ? $data['account_number'] : null;

// Insert account
$query = "INSERT INTO bank_accounts 
          (user_id, account_name, account_number, bank_name, account_type, currency, opening_balance, current_balance) 
          VALUES (:user_id, :account_name, :account_number, :bank_name, :account_type, :currency, :opening_balance, :current_balance)";

$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $user_id);
$stmt->bindParam(':account_name', $data['account_name']);
$stmt->bindParam(':account_number', $account_number);
$stmt->bindParam(':bank_name', $data['bank_name']);
$stmt->bindParam(':account_type', $data['account_type']);
$stmt->bindParam(':currency', $currency);
$stmt->bindParam(':opening_balance', $opening_balance);
$stmt->bindParam(':current_balance', $opening_balance);

try {
    $stmt->execute();
    $account_id = $db->lastInsertId();

    Response::success([
        'account_id' => $account_id
    ], 'Bank account created successfully', 201);

} catch (Exception $e) {
    Response::serverError('Failed to create bank account: ' . $e->getMessage());
}
