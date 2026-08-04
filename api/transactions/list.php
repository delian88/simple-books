<?php
/**
 * List Transactions Endpoint
 * GET /api/transactions/list.php
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
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
$type = isset($_GET['type']) ? $_GET['type'] : null;
$category_id = isset($_GET['category_id']) ? (int)$_GET['category_id'] : null;
$bank_account_id = isset($_GET['bank_account_id']) ? (int)$_GET['bank_account_id'] : null;
$start_date = isset($_GET['start_date']) ? $_GET['start_date'] : null;
$end_date = isset($_GET['end_date']) ? $_GET['end_date'] : null;
$search = isset($_GET['search']) ? $_GET['search'] : null;

// Calculate offset
$offset = ($page - 1) * $limit;

// Build query
$where_clauses = ['t.user_id = :user_id'];
$params = [':user_id' => $user_id];

if ($type) {
    $where_clauses[] = 't.type = :type';
    $params[':type'] = $type;
}

if ($category_id) {
    $where_clauses[] = 't.category_id = :category_id';
    $params[':category_id'] = $category_id;
}

if ($bank_account_id) {
    $where_clauses[] = 't.bank_account_id = :bank_account_id';
    $params[':bank_account_id'] = $bank_account_id;
}

if ($start_date) {
    $where_clauses[] = 't.transaction_date >= :start_date';
    $params[':start_date'] = $start_date;
}

if ($end_date) {
    $where_clauses[] = 't.transaction_date <= :end_date';
    $params[':end_date'] = $end_date;
}

if ($search) {
    $where_clauses[] = '(t.description LIKE :search OR t.notes LIKE :search OR t.reference_number LIKE :search)';
    $params[':search'] = "%$search%";
}

$where_sql = implode(' AND ', $where_clauses);

// Count total records
$count_query = "SELECT COUNT(*) as total FROM transactions t WHERE $where_sql";
$count_stmt = $db->prepare($count_query);
foreach ($params as $key => $value) {
    $count_stmt->bindValue($key, $value);
}
$count_stmt->execute();
$total = $count_stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Get transactions
$query = "SELECT 
            t.*,
            c.name as category_name,
            c.color as category_color,
            b.account_name as bank_account_name
          FROM transactions t
          LEFT JOIN categories c ON t.category_id = c.id
          LEFT JOIN bank_accounts b ON t.bank_account_id = b.id
          WHERE $where_sql
          ORDER BY t.transaction_date DESC, t.created_at DESC
          LIMIT :limit OFFSET :offset";

$stmt = $db->prepare($query);
foreach ($params as $key => $value) {
    $stmt->bindValue($key, $value);
}
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();

$transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Calculate totals
$totals_query = "SELECT 
                   SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                   SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
                 FROM transactions t
                 WHERE $where_sql";

$totals_stmt = $db->prepare($totals_query);
foreach ($params as $key => $value) {
    $totals_stmt->bindValue($key, $value);
}
$totals_stmt->execute();
$totals = $totals_stmt->fetch(PDO::FETCH_ASSOC);

Response::success([
    'transactions' => $transactions,
    'pagination' => [
        'current_page' => $page,
        'per_page' => $limit,
        'total' => (int)$total,
        'total_pages' => ceil($total / $limit)
    ],
    'totals' => [
        'income' => (float)$totals['total_income'],
        'expense' => (float)$totals['total_expense'],
        'profit' => (float)($totals['total_income'] - $totals['total_expense'])
    ]
]);
