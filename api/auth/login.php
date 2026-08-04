<?php
/**
 * User Login Endpoint
 * POST /api/auth/login.php
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

if (!$data || !isset($data['email']) || !isset($data['password'])) {
    Response::error('Email and password are required');
}

// Connect to database
$database = new Database();
$db = $database->getConnection();

// Initialize Auth
$auth = new Auth($db);

// Login user
$result = $auth->login($data['email'], $data['password']);

if ($result['success']) {
    Response::success([
        'token' => $result['token'],
        'user' => $result['user']
    ], $result['message']);
} else {
    Response::unauthorized($result['message']);
}
