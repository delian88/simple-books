<?php
/**
 * Get Single Transaction Endpoint
 * GET /api/transactions/get.php?id=1
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Response.php';
require_once '../utils/Auth.php';

// Only accept GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

// Get transaction ID
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    Response::error('Transaction ID is required');
}

$transaction_id = (int)$_GET['id'];

// Connect to database
$database = new Database();
$db = $database->getConnection();

// Initialize Auth and get authenticated user
$auth = new Auth($db);
$user_id = $auth->getAuthenticatedUser();

if (!$user_id) {
    Response::unauthorized();
}

// Get transaction
$query = "SELECT 
            t.*,
            c.name as category_name,
            c.color as category_color,
            c.type as category_type,
            b.account_name as bank_account_name,
            b.bank_name,
            b.account_type
          FROM transactions t
          LEFT JOIN categories c ON t.category_id = c.id
          LEFT JOIN bank_accounts b ON t.bank_account_id = b.id
          WHERE t.id = :id AND t.user_id = :user_id";

$stmt = $db->prepare($query);
$stmt->bindParam(':id', $transaction_id);
$stmt->bindParam(':user_id', $user_id);
$stmt->execute();

if ($stmt->rowCount() == 0) {
    Response::error('Transaction not found', 404);
}

$transaction = $stmt->fetch(PDO::FETCH_ASSOC);

Response::success(['transaction' => $transaction]);
