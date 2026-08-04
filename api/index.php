<?php
/**
 * Ledgerly API Index Page
 * Provides API documentation and test endpoints
 */

header('Content-Type: application/json');

// Simple routing for API documentation
$endpoints = [
    'title' => 'Ledgerly Accounting API',
    'version' => '1.0.0',
    'description' => 'Complete REST API for Ledgerly accounting application',
    'base_url' => '/api/',
    'documentation' => '/api/README.md',
    'endpoints' => [
        'authentication' => [
            'POST /auth/register.php' => 'Register new user',
            'POST /auth/login.php' => 'Login user',
            'POST /auth/reset-password.php' => 'Reset password'
        ],
        'user' => [
            'GET /user/profile.php' => 'Get user profile',
            'PUT /user/profile.php' => 'Update user profile',
            'GET /user/settings.php' => 'Get user settings',
            'PUT /user/settings.php' => 'Update user settings'
        ],
        'bank_accounts' => [
            'POST /accounts/create.php' => 'Create bank account',
            'GET /accounts/list.php' => 'List bank accounts',
            'GET /accounts/get.php?id={id}' => 'Get bank account',
            'PUT /accounts/update.php' => 'Update bank account',
            'DELETE /accounts/delete.php' => 'Delete bank account'
        ],
        'categories' => [
            'GET /categories/list.php' => 'List categories',
            'POST /categories/create.php' => 'Create category',
            'PUT /categories/update.php' => 'Update category',
            'DELETE /categories/delete.php' => 'Delete category'
        ],
        'transactions' => [
            'POST /transactions/create.php' => 'Create transaction',
            'GET /transactions/list.php' => 'List transactions',
            'GET /transactions/get.php?id={id}' => 'Get transaction',
            'PUT /transactions/update.php' => 'Update transaction',
            'DELETE /transactions/delete.php' => 'Delete transaction'
        ],
        'dashboard' => [
            'GET /dashboard/summary.php' => 'Get dashboard summary'
        ],
        'reports' => [
            'GET /reports/profit-loss.php' => 'Generate profit & loss report',
            'GET /reports/balance-sheet.php' => 'Generate balance sheet report'
        ]
    ],
    'status' => [
        'database' => checkDatabase(),
        'api' => 'ready',
        'timestamp' => date('Y-m-d H:i:s')
    ]
];

echo json_encode($endpoints, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

/**
 * Check database connection
 */
function checkDatabase() {
    try {
        require_once 'config/database.php';
        $database = new Database();
        $conn = $database->getConnection();
        
        if ($conn) {
            return [
                'connected' => true,
                'message' => 'Database connection successful'
            ];
        } else {
            return [
                'connected' => false,
                'message' => 'Database connection failed'
            ];
        }
    } catch (Exception $e) {
        return [
            'connected' => false,
            'message' => 'Database error: ' . $e->getMessage()
        ];
    }
}
