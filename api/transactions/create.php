<?php
/**
 * Create Transaction Endpoint
 * POST /api/transactions/create.php
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
$required = ['bank_account_id', 'category_id', 'type', 'amount', 'transaction_date'];
$errors = [];

foreach ($required as $field) {
    if (!isset($data[$field]) || $data[$field] === '') {
        $errors[$field] = ucfirst(str_replace('_', ' ', $field)) . ' is required';
    }
}

// Validate type
if (isset($data['type']) && !in_array($data['type'], ['income', 'expense'])) {
    $errors['type'] = 'Type must be either income or expense';
}

// Validate amount
if (isset($data['amount']) && (!is_numeric($data['amount']) || $data['amount'] <= 0)) {
    $errors['amount'] = 'Amount must be a positive number';
}

if (!empty($errors)) {
    Response::validationError($errors);
}

// Verify bank account belongs to user
$check_query = "SELECT id, current_balance FROM bank_accounts WHERE id = :account_id AND user_id = :user_id";
$check_stmt = $db->prepare($check_query);
$check_stmt->bindParam(':account_id', $data['bank_account_id']);
$check_stmt->bindParam(':user_id', $user_id);
$check_stmt->execute();

if ($check_stmt->rowCount() == 0) {
    Response::error('Bank account not found or access denied', 404);
}

$account = $check_stmt->fetch(PDO::FETCH_ASSOC);

// Begin transaction
$db->beginTransaction();

try {
    // Insert transaction
    $query = "INSERT INTO transactions 
              (user_id, bank_account_id, category_id, type, amount, description, transaction_date, reference_number, notes, receipt_url) 
              VALUES (:user_id, :bank_account_id, :category_id, :type, :amount, :description, :transaction_date, :reference_number, :notes, :receipt_url)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':bank_account_id', $data['bank_account_id']);
    $stmt->bindParam(':category_id', $data['category_id']);
    $stmt->bindParam(':type', $data['type']);
    $stmt->bindParam(':amount', $data['amount']);
    $stmt->bindParam(':description', $data['description']);
    $stmt->bindParam(':transaction_date', $data['transaction_date']);
    $stmt->bindParam(':reference_number', $data['reference_number']);
    $stmt->bindParam(':notes', $data['notes']);
    $stmt->bindParam(':receipt_url', $data['receipt_url']);
    
    $stmt->execute();
    $transaction_id = $db->lastInsertId();

    // Update bank account balance
    $new_balance = $account['current_balance'];
    if ($data['type'] === 'income') {
        $new_balance += $data['amount'];
    } else {
        $new_balance -= $data['amount'];
    }

    $update_query = "UPDATE bank_accounts SET current_balance = :balance WHERE id = :id";
    $update_stmt = $db->prepare($update_query);
    $update_stmt->bindParam(':balance', $new_balance);
    $update_stmt->bindParam(':id', $data['bank_account_id']);
    $update_stmt->execute();

    // Commit transaction
    $db->commit();

    Response::success([
        'transaction_id' => $transaction_id,
        'new_balance' => $new_balance
    ], 'Transaction created successfully', 201);

} catch (Exception $e) {
    $db->rollBack();
    Response::serverError('Failed to create transaction: ' . $e->getMessage());
}
