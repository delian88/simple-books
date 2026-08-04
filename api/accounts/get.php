<?php
/**
 * Get Single Bank Account Endpoint
 * GET /api/accounts/get.php?id=1
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Response.php';
require_once '../utils/Auth.php';

// Only accept GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

// Get account ID
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    Response::error('Account ID is required');
}

$account_id = (int)$_GET['id'];

// Connect to database
$database = new Database();
$db = $database->getConnection();

// Initialize Auth and get authenticated user
$auth = new Auth($db);
$user_id = $auth->getAuthenticatedUser();

if (!$user_id) {
    Response::unauthorized();
}

// Get account
$query = "SELECT * FROM bank_accounts WHERE id = :id AND user_id = :user_id";
$stmt = $db->prepare($query);
$stmt->bindParam(':id', $account_id);
$stmt->bindParam(':user_id', $user_id);
$stmt->execute();

if ($stmt->rowCount() == 0) {
    Response::error('Bank account not found', 404);
}

$account = $stmt->fetch(PDO::FETCH_ASSOC);

// Get transaction count for this account
$count_query = "SELECT COUNT(*) as transaction_count FROM transactions WHERE bank_account_id = :account_id";
$count_stmt = $db->prepare($count_query);
$count_stmt->bindParam(':account_id', $account_id);
$count_stmt->execute();
$count_result = $count_stmt->fetch(PDO::FETCH_ASSOC);

$account['transaction_count'] = (int)$count_result['transaction_count'];

Response::success(['account' => $account]);
