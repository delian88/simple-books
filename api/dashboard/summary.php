<?php
/**
 * Dashboard Summary Endpoint
 * GET /api/dashboard/summary.php
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

// Get date range (default to current month)
$start_date = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-01');
$end_date = isset($_GET['end_date']) ? $_GET['end_date'] : date('Y-m-t');

// Get total income and expenses
$totals_query = "SELECT 
                   SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                   SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
                   COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
                   COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count
                 FROM transactions 
                 WHERE user_id = :user_id 
                 AND transaction_date BETWEEN :start_date AND :end_date";

$totals_stmt = $db->prepare($totals_query);
$totals_stmt->bindParam(':user_id', $user_id);
$totals_stmt->bindParam(':start_date', $start_date);
$totals_stmt->bindParam(':end_date', $end_date);
$totals_stmt->execute();
$totals = $totals_stmt->fetch(PDO::FETCH_ASSOC);

$profit = (float)$totals['total_income'] - (float)$totals['total_expense'];

// Get expenses by category
$category_query = "SELECT 
                     c.name as category_name,
                     c.color,
                     SUM(t.amount) as total,
                     COUNT(t.id) as count
                   FROM transactions t
                   JOIN categories c ON t.category_id = c.id
                   WHERE t.user_id = :user_id 
                   AND t.type = 'expense'
                   AND t.transaction_date BETWEEN :start_date AND :end_date
                   GROUP BY t.category_id, c.name, c.color
                   ORDER BY total DESC
                   LIMIT 10";

$category_stmt = $db->prepare($category_query);
$category_stmt->bindParam(':user_id', $user_id);
$category_stmt->bindParam(':start_date', $start_date);
$category_stmt->bindParam(':end_date', $end_date);
$category_stmt->execute();
$expenses_by_category = $category_stmt->fetchAll(PDO::FETCH_ASSOC);

// Get income by category
$income_query = "SELECT 
                   c.name as category_name,
                   c.color,
                   SUM(t.amount) as total,
                   COUNT(t.id) as count
                 FROM transactions t
                 JOIN categories c ON t.category_id = c.id
                 WHERE t.user_id = :user_id 
                 AND t.type = 'income'
                 AND t.transaction_date BETWEEN :start_date AND :end_date
                 GROUP BY t.category_id, c.name, c.color
                 ORDER BY total DESC";

$income_stmt = $db->prepare($income_query);
$income_stmt->bindParam(':user_id', $user_id);
$income_stmt->bindParam(':start_date', $start_date);
$income_stmt->bindParam(':end_date', $end_date);
$income_stmt->execute();
$income_by_category = $income_stmt->fetchAll(PDO::FETCH_ASSOC);

// Get recent transactions
$recent_query = "SELECT 
                   t.*,
                   c.name as category_name,
                   c.color as category_color,
                   b.account_name
                 FROM transactions t
                 JOIN categories c ON t.category_id = c.id
                 JOIN bank_accounts b ON t.bank_account_id = b.id
                 WHERE t.user_id = :user_id
                 ORDER BY t.transaction_date DESC, t.created_at DESC
                 LIMIT 10";

$recent_stmt = $db->prepare($recent_query);
$recent_stmt->bindParam(':user_id', $user_id);
$recent_stmt->execute();
$recent_transactions = $recent_stmt->fetchAll(PDO::FETCH_ASSOC);

// Get bank accounts summary
$accounts_query = "SELECT 
                     COUNT(*) as total_accounts,
                     SUM(current_balance) as total_balance
                   FROM bank_accounts
                   WHERE user_id = :user_id AND is_active = 1";

$accounts_stmt = $db->prepare($accounts_query);
$accounts_stmt->bindParam(':user_id', $user_id);
$accounts_stmt->execute();
$accounts_summary = $accounts_stmt->fetch(PDO::FETCH_ASSOC);

// Get daily transaction trend for the period
$trend_query = "SELECT 
                  DATE(transaction_date) as date,
                  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
                FROM transactions
                WHERE user_id = :user_id
                AND transaction_date BETWEEN :start_date AND :end_date
                GROUP BY DATE(transaction_date)
                ORDER BY date ASC";

$trend_stmt = $db->prepare($trend_query);
$trend_stmt->bindParam(':user_id', $user_id);
$trend_stmt->bindParam(':start_date', $start_date);
$trend_stmt->bindParam(':end_date', $end_date);
$trend_stmt->execute();
$daily_trend = $trend_stmt->fetchAll(PDO::FETCH_ASSOC);

Response::success([
    'period' => [
        'start_date' => $start_date,
        'end_date' => $end_date
    ],
    'overview' => [
        'total_income' => (float)$totals['total_income'],
        'total_expense' => (float)$totals['total_expense'],
        'profit' => $profit,
        'income_count' => (int)$totals['income_count'],
        'expense_count' => (int)$totals['expense_count'],
        'total_transactions' => (int)$totals['income_count'] + (int)$totals['expense_count']
    ],
    'accounts' => [
        'total_accounts' => (int)$accounts_summary['total_accounts'],
        'total_balance' => (float)$accounts_summary['total_balance']
    ],
    'expenses_by_category' => $expenses_by_category,
    'income_by_category' => $income_by_category,
    'recent_transactions' => $recent_transactions,
    'daily_trend' => $daily_trend
]);
