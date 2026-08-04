<?php
/**
 * Delete Bank Account Endpoint
 * DELETE /api/accounts/delete.php
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

// Check if account has transactions
$trans_query = "SELECT COUNT(*) as count FROM transactions WHERE bank_account_id = :account_id";
$trans_stmt = $db->prepare($trans_query);
$trans_stmt->bindParam(':account_id', $account_id);
$trans_stmt->execute();
$trans_count = $trans_stmt->fetch(PDO::FETCH_ASSOC)['count'];

if ($trans_count > 0) {
    Response::error('Cannot delete account with existing transactions. Please delete all transactions first or deactivate the account.', 422);
}

// Delete account
$delete_query = "DELETE FROM bank_accounts WHERE id = :id AND user_id = :user_id";
$delete_stmt = $db->prepare($delete_query);
$delete_stmt->bindParam(':id', $account_id);
$delete_stmt->bindParam(':user_id', $user_id);

try {
    $delete_stmt->execute();
    Response::success(['deleted_id' => $account_id], 'Bank account deleted successfully');
} catch (Exception $e) {
    Response::serverError('Failed to delete bank account: ' . $e->getMessage());
}
