<?php
/**
 * Profit & Loss Report Endpoint
 * GET /api/reports/profit-loss.php
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
$start_date = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-01');
$end_date = isset($_GET['end_date']) ? $_GET['end_date'] : date('Y-m-t');
$group_by = isset($_GET['group_by']) ? $_GET['group_by'] : 'category'; // category, month, account

// Validate date range
if (!strtotime($start_date) || !strtotime($end_date)) {
    Response::error('Invalid date format. Use YYYY-MM-DD');
}

// Get total income
$income_query = "SELECT 
                   c.name as category_name,
                   c.color,
                   SUM(t.amount) as amount,
                   COUNT(t.id) as count
                 FROM transactions t
                 JOIN categories c ON t.category_id = c.id
                 WHERE t.user_id = :user_id 
                 AND t.type = 'income'
                 AND t.transaction_date BETWEEN :start_date AND :end_date
                 GROUP BY t.category_id, c.name, c.color
                 ORDER BY amount DESC";

$income_stmt = $db->prepare($income_query);
$income_stmt->bindParam(':user_id', $user_id);
$income_stmt->bindParam(':start_date', $start_date);
$income_stmt->bindParam(':end_date', $end_date);
$income_stmt->execute();
$income_by_category = $income_stmt->fetchAll(PDO::FETCH_ASSOC);

// Get total expenses
$expenses_query = "SELECT 
                     c.name as category_name,
                     c.color,
                     SUM(t.amount) as amount,
                     COUNT(t.id) as count
                   FROM transactions t
                   JOIN categories c ON t.category_id = c.id
                   WHERE t.user_id = :user_id 
                   AND t.type = 'expense'
                   AND t.transaction_date BETWEEN :start_date AND :end_date
                   GROUP BY t.category_id, c.name, c.color
                   ORDER BY amount DESC";

$expenses_stmt = $db->prepare($expenses_query);
$expenses_stmt->bindParam(':user_id', $user_id);
$expenses_stmt->bindParam(':start_date', $start_date);
$expenses_stmt->bindParam(':end_date', $end_date);
$expenses_stmt->execute();
$expenses_by_category = $expenses_stmt->fetchAll(PDO::FETCH_ASSOC);

// Calculate totals
$total_income = array_sum(array_column($income_by_category, 'amount'));
$total_expenses = array_sum(array_column($expenses_by_category, 'amount'));
$net_profit = $total_income - $total_expenses;

// Get monthly breakdown if requested
$monthly_data = [];
if ($group_by === 'month') {
    $monthly_query = "SELECT 
                        DATE_FORMAT(transaction_date, '%Y-%m') as month,
                        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
                        (SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - 
                         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END)) as profit
                      FROM transactions
                      WHERE user_id = :user_id
                      AND transaction_date BETWEEN :start_date AND :end_date
                      GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
                      ORDER BY month DESC";

    $monthly_stmt = $db->prepare($monthly_query);
    $monthly_stmt->bindParam(':user_id', $user_id);
    $monthly_stmt->bindParam(':start_date', $start_date);
    $monthly_stmt->bindParam(':end_date', $end_date);
    $monthly_stmt->execute();
    $monthly_data = $monthly_stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Get by bank account if requested
$account_data = [];
if ($group_by === 'account') {
    $account_query = "SELECT 
                        b.account_name,
                        b.bank_name,
                        b.account_type,
                        SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as income,
                        SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as expense
                      FROM transactions t
                      JOIN bank_accounts b ON t.bank_account_id = b.id
                      WHERE t.user_id = :user_id
                      AND t.transaction_date BETWEEN :start_date AND :end_date
                      GROUP BY t.bank_account_id, b.account_name, b.bank_name, b.account_type
                      ORDER BY (income + expense) DESC";

    $account_stmt = $db->prepare($account_query);
    $account_stmt->bindParam(':user_id', $user_id);
    $account_stmt->bindParam(':start_date', $start_date);
    $account_stmt->bindParam(':end_date', $end_date);
    $account_stmt->execute();
    $account_data = $account_stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Save report to reports table
$save_query = "INSERT INTO reports (user_id, name, type, parameters) 
               VALUES (:user_id, :name, :type, :parameters)";
$save_stmt = $db->prepare($save_query);
$report_name = "Profit & Loss Report " . date('Y-m-d H:i:s');
$parameters = json_encode([
    'start_date' => $start_date,
    'end_date' => $end_date,
    'group_by' => $group_by
]);

$save_stmt->bindParam(':user_id', $user_id);
$save_stmt->bindParam(':name', $report_name);
$save_stmt->bindParam(':type', $type = 'profit_loss');
$save_stmt->bindParam(':parameters', $parameters);
$save_stmt->execute();

$report_id = $db->lastInsertId();

Response::success([
    'report_id' => $report_id,
    'period' => [
        'start_date' => $start_date,
        'end_date' => $end_date
    ],
    'summary' => [
        'total_income' => (float)$total_income,
        'total_expenses' => (float)$total_expenses,
        'net_profit' => (float)$net_profit,
        'profit_margin' => $total_income > 0 ? round(($net_profit / $total_income) * 100, 2) : 0
    ],
    'income_by_category' => $income_by_category,
    'expenses_by_category' => $expenses_by_category,
    'monthly_breakdown' => $monthly_data,
    'account_breakdown' => $account_data,
    'group_by' => $group_by
], 'Profit & Loss report generated successfully');
