<?php
/**
 * Delete Transaction Endpoint
 * DELETE /api/transactions/delete.php
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

// Get transaction details
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

$transaction = $check_stmt->fetch(PDO::FETCH_ASSOC);

// Begin transaction
$db->beginTransaction();

try {
    // Delete transaction
    $delete_query = "DELETE FROM transactions WHERE id = :id AND user_id = :user_id";
    $delete_stmt = $db->prepare($delete_query);
    $delete_stmt->bindParam(':id', $transaction_id);
    $delete_stmt->bindParam(':user_id', $user_id);
    $delete_stmt->execute();

    // Reverse the transaction from bank account balance
    $new_balance = $transaction['current_balance'];
    if ($transaction['type'] === 'income') {
        $new_balance -= $transaction['amount'];
    } else {
        $new_balance += $transaction['amount'];
    }

    $update_query = "UPDATE bank_accounts SET current_balance = :balance WHERE id = :account_id";
    $update_stmt = $db->prepare($update_query);
    $update_stmt->bindParam(':balance', $new_balance);
    $update_stmt->bindParam(':account_id', $transaction['bank_account_id']);
    $update_stmt->execute();

    // Commit transaction
    $db->commit();

    Response::success([
        'deleted_id' => $transaction_id,
        'new_balance' => $new_balance
    ], 'Transaction deleted successfully');

} catch (Exception $e) {
    $db->rollBack();
    Response::serverError('Failed to delete transaction: ' . $e->getMessage());
}
