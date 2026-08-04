<?php
/**
 * User Registration Endpoint
 * POST /api/auth/register.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Response.php';
require_once '../utils/Auth.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

// Get posted data
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    Response::error('Invalid JSON data');
}

// Connect to database
$database = new Database();
$db = $database->getConnection();

// Initialize Auth
$auth = new Auth($db);

// Register user
$result = $auth->register($data);

if ($result['success']) {
    Response::success([
        'user_id' => $result['user_id']
    ], $result['message'], 201);
} else {
    Response::error($result['message']);
}
