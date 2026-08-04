<?php
/**
 * Update Transaction Endpoint
 * PUT /api/transactions/update.php
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

// Validate transaction ID
if (!isset($data['id']) || !is_numeric($data['id'])) {
    Response::error('Transaction ID is required');
}

$transaction_id = (int)$data['id'];

// Connect to database
$database = new Database();
$db = $database->getConnection();

// Initialize Auth and get authenticated user
$auth = new Auth($db);
$user_id = $auth->getAuthenticatedUser();

if (!$user_id) {
    Response::unauthorized();
}

// Get existing transaction
$check_query = "SELECT t.*, b.current_balance 
                FROM transactions t
                JOIN bank_accounts b ON t.bank_account_id = b.id
                WHERE t.id = :id AND t.user_id = :user_id";
$check_stmt = $db->prepare($check_query);
$check_stmt->bindParam(':id', $transaction_id);
$check_stmt->bindParam(':user_id', $user_id);
$check_stmt->execute();

if ($check_stmt->rowCount() == 0) {
    Response::error('Transaction not found', 404);
}

$old_transaction = $check_stmt->fetch(PDO::FETCH_ASSOC);

// Validate fields if provided
$errors = [];

if (isset($data['type']) && !in_array($data['type'], ['income', 'expense'])) {
    $errors['type'] = 'Type must be either income or expense';
}

if (isset($data['amount']) && (!is_numeric($data['amount']) || $data['amount'] <= 0)) {
    $errors['amount'] = 'Amount must be a positive number';
}

if (!empty($errors)) {
    Response::validationError($errors);
}

// Begin transaction
$db->beginTransaction();

try {
    // Build update query dynamically
    $update_fields = [];
    $params = [':id' => $transaction_id, ':user_id' => $user_id];

    $allowed_fields = ['bank_account_id', 'category_id', 'type', 'amount', 'description', 
                       'transaction_date', 'reference_number', 'notes', 'receipt_url', 'is_reconciled'];

    foreach ($allowed_fields as $field) {
        if (isset($data[$field])) {
            $update_fields[] = "$field = :$field";
            $params[":$field"] = $data[$field];
        }
    }

    if (empty($update_fields)) {
        Response::error('No fields to update');
    }

    $query = "UPDATE transactions SET " . implode(', ', $update_fields) . " WHERE id = :id AND user_id = :user_id";
    $stmt = $db->prepare($query);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->execute();

    // Update bank account balance if amount or type changed
    if (isset($data['amount']) || isset($data['type'])) {
        $new_amount = isset($data['amount']) ? $data['amount'] : $old_transaction['amount'];
        $new_type = isset($data['type']) ? $data['type'] : $old_transaction['type'];
        
        // Reverse old transaction
        $balance = $old_transaction['current_balance'];
        if ($old_transaction['type'] === 'income') {
            $balance -= $old_transaction['amount'];
        } else {
            $balance += $old_transaction['amount'];
        }
        
        // Apply new transaction
        if ($new_type === 'income') {
            $balance += $new_amount;
        } else {
            $balance -= $new_amount;
        }
        
        $update_balance = "UPDATE bank_accounts SET current_balance = :balance WHERE id = :account_id";
        $balance_stmt = $db->prepare($update_balance);
        $balance_stmt->bindParam(':balance', $balance);
        $balance_stmt->bindParam(':account_id', $old_transaction['bank_account_id']);
        $balance_stmt->execute();
    }

    // Commit transaction
    $db->commit();

    // Get updated transaction
    $get_query = "SELECT t.*, c.name as category_name, b.account_name as bank_account_name
                  FROM transactions t
                  LEFT JOIN categories c ON t.category_id = c.id
                  LEFT JOIN bank_accounts b ON t.bank_account_id = b.id
                  WHERE t.id = :id";
    $get_stmt = $db->prepare($get_query);
    $get_stmt->bindParam(':id', $transaction_id);
    $get_stmt->execute();
    
    $updated_transaction = $get_stmt->fetch(PDO::FETCH_ASSOC);

    Response::success(['transaction' => $updated_transaction], 'Transaction updated successfully');

} catch (Exception $e) {
    $db->rollBack();
    Response::serverError('Failed to update transaction: ' . $e->getMessage());
}
