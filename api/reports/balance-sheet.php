<?php
/**
 * Balance Sheet Report Endpoint
 * GET /api/reports/balance-sheet.php
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

// Get as of date (default to today)
$as_of_date = isset($_GET['as_of_date']) ? $_GET['as_of_date'] : date('Y-m-d');

// Validate date
if (!strtotime($as_of_date)) {
    Response::error('Invalid date format. Use YYYY-MM-DD');
}

// ASSETS SECTION

// Cash and bank accounts
$assets_cash_query = "SELECT 
                         'Cash and Bank Accounts' as category,
                         SUM(current_balance) as total
                       FROM bank_accounts
                       WHERE user_id = :user_id 
                       AND is_active = 1";
$assets_cash_stmt = $db->prepare($assets_cash_query);
$assets_cash_stmt->bindParam(':user_id', $user_id);
$assets_cash_stmt->execute();
$cash_assets = $assets_cash_stmt->fetch(PDO::FETCH_ASSOC);

// Asset categories (from transactions)
$assets_query = "SELECT 
                   c.name as category_name,
                   c.color,
                   SUM(t.amount) as amount
                 FROM transactions t
                 JOIN categories c ON t.category_id = c.id
                 WHERE t.user_id = :user_id 
                 AND c.type = 'asset'
                 AND t.transaction_date <= :as_of_date
                 GROUP BY t.category_id, c.name, c.color
                 ORDER BY amount DESC";
$assets_stmt = $db->prepare($assets_query);
$assets_stmt->bindParam(':user_id', $user_id);
$assets_stmt->bindParam(':as_of_date', $as_of_date);
$assets_stmt->execute();
$asset_categories = $assets_stmt->fetchAll(PDO::FETCH_ASSOC);

$total_assets = (float)$cash_assets['total'] + array_sum(array_column($asset_categories, 'amount'));

// LIABILITIES SECTION

// Liability categories
$liabilities_query = "SELECT 
                        c.name as category_name,
                        c.color,
                        SUM(t.amount) as amount
                      FROM transactions t
                      JOIN categories c ON t.category_id = c.id
                      WHERE t.user_id = :user_id 
                      AND c.type = 'liability'
                      AND t.transaction_date <= :as_of_date
                      GROUP BY t.category_id, c.name, c.color
                      ORDER BY amount DESC";
$liabilities_stmt = $db->prepare($liabilities_query);
$liabilities_stmt->bindParam(':user_id', $user_id);
$liabilities_stmt->bindParam(':as_of_date', $as_of_date);
$liabilities_stmt->execute();
$liability_categories = $liabilities_stmt->fetchAll(PDO::FETCH_ASSOC);

$total_liabilities = array_sum(array_column($liability_categories, 'amount'));

// EQUITY SECTION

// Equity categories
$equity_query = "SELECT 
                    c.name as category_name,
                    c.color,
                    SUM(t.amount) as amount
                  FROM transactions t
                  JOIN categories c ON t.category_id = c.id
                  WHERE t.user_id = :user_id 
                  AND c.type = 'equity'
                  AND t.transaction_date <= :as_of_date
                  GROUP BY t.category_id, c.name, c.color
                  ORDER BY amount DESC";
$equity_stmt = $db->prepare($equity_query);
$equity_stmt->bindParam(':user_id', $user_id);
$equity_stmt->bindParam(':as_of_date', $as_of_date);
$equity_stmt->execute();
$equity_categories = $equity_stmt->fetchAll(PDO::FETCH_ASSOC);

$total_equity = array_sum(array_column($equity_categories, 'amount'));

// Calculate retained earnings (profit/loss up to date)
$retained_query = "SELECT 
                     SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                     SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
                   FROM transactions
                   WHERE user_id = :user_id
                   AND transaction_date <= :as_of_date";
$retained_stmt = $db->prepare($retained_query);
$retained_stmt->bindParam(':user_id', $user_id);
$retained_stmt->bindParam(':as_of_date', $as_of_date);
$retained_stmt->execute();
$retained_result = $retained_stmt->fetch(PDO::FETCH_ASSOC);

$retained_earnings = (float)$retained_result['total_income'] - (float)$retained_result['total_expense'];

// Balance sheet equation check
$assets_minus_liabilities = $total_assets - $total_liabilities;
$equity_plus_retained = $total_equity + $retained_earnings;

// Save report to reports table
$save_query = "INSERT INTO reports (user_id, name, type, parameters) 
               VALUES (:user_id, :name, :type, :parameters)";
$save_stmt = $db->prepare($save_query);
$report_name = "Balance Sheet as of " . $as_of_date;
$parameters = json_encode([
    'as_of_date' => $as_of_date
]);

$save_stmt->bindParam(':user_id', $user_id);
$save_stmt->bindParam(':name', $report_name);
$save_stmt->bindParam(':type', $type = 'balance_sheet');
$save_stmt->bindParam(':parameters', $parameters);
$save_stmt->execute();

$report_id = $db->lastInsertId();

Response::success([
    'report_id' => $report_id,
    'as_of_date' => $as_of_date,
    'assets' => [
        'cash_and_bank' => [
            'name' => 'Cash and Bank Accounts',
            'amount' => (float)$cash_assets['total']
        ],
        'categories' => $asset_categories,
        'total' => (float)$total_assets
    ],
    'liabilities' => [
        'categories' => $liability_categories,
        'total' => (float)$total_liabilities
    ],
    'equity' => [
        'categories' => $equity_categories,
        'retained_earnings' => (float)$retained_earnings,
        'total' => (float)($total_equity + $retained_earnings)
    ],
    'balance_check' => [
        'assets' => (float)$total_assets,
        'liabilities' => (float)$total_liabilities,
        'equity' => (float)($total_equity + $retained_earnings),
        'equation' => 'Assets = Liabilities + Equity',
        'balanced' => abs($assets_minus_liabilities - $equity_plus_retained) < 0.01,
        'difference' => abs($assets_minus_liabilities - $equity_plus_retained)
    ]
], 'Balance Sheet report generated successfully');
