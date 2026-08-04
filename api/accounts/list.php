<?php
/**
 * List Bank Accounts Endpoint
 * GET /api/accounts/list.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Response.php';
require_once '../utils/Auth.php';

// Only accept GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
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

// Get query parameters
$is_active = isset($_GET['is_active']) ? (int)$_GET['is_active'] : null;

// Build query
$query = "SELECT 
            id,
            account_name,
            account_number,
            bank_name,
            account_type,
            currency,
            opening_balance,
            current_balance,
            is_active,
            created_at,
            updated_at
          FROM bank_accounts 
          WHERE user_id = :user_id";

if ($is_active !== null) {
    $query .= " AND is_active = :is_active";
}

$query .= " ORDER BY created_at DESC";

$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $user_id);

if ($is_active !== null) {
    $stmt->bindParam(':is_active', $is_active);
}

$stmt->execute();
$accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Calculate totals
$total_balance = 0;
foreach ($accounts as $account) {
    $total_balance += (float)$account['current_balance'];
}

Response::success([
    'accounts' => $accounts,
    'total_accounts' => count($accounts),
    'total_balance' => $total_balance
]);
