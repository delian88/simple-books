<?php
/**
 * User Profile Endpoint
 * GET /api/user/profile.php - Get profile
 * PUT /api/user/profile.php - Update profile
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Response.php';
require_once '../utils/Auth.php';

// Connect to database
$database = new Database();
$db = $database->getConnection();

// Initialize Auth and get authenticated user
$auth = new Auth($db);
$user_id = $auth->getAuthenticatedUser();

if (!$user_id) {
    Response::unauthorized();
}

// GET - Retrieve profile
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $query = "SELECT id, email, first_name, last_name, company_name, phone, status, email_verified, created_at, last_login 
              FROM users WHERE id = :user_id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        Response::error('User not found', 404);
    }
    
    Response::success(['user' => $user]);
}

// PUT - Update profile
elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!$data) {
        Response::error('Invalid JSON data');
    }
    
    // Build update query dynamically
    $update_fields = [];
    $params = [':user_id' => $user_id];
    
    $allowed_fields = ['first_name', 'last_name', 'company_name', 'phone'];
    
    foreach ($allowed_fields as $field) {
        if (isset($data[$field])) {
            $update_fields[] = "$field = :$field";
            $params[":$field"] = $data[$field];
        }
    }
    
    if (empty($update_fields)) {
        Response::error('No fields to update');
    }
    
    $query = "UPDATE users SET " . implode(', ', $update_fields) . " WHERE id = :user_id";
    $stmt = $db->prepare($query);
    
    try {
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();
        
        // Get updated profile
        $get_query = "SELECT id, email, first_name, last_name, company_name, phone, status, email_verified, created_at, last_login 
                      FROM users WHERE id = :user_id";
        $get_stmt = $db->prepare($get_query);
        $get_stmt->bindParam(':user_id', $user_id);
        $get_stmt->execute();
        
        $updated_user = $get_stmt->fetch(PDO::FETCH_ASSOC);
        
        Response::success(['user' => $updated_user], 'Profile updated successfully');
        
    } catch (Exception $e) {
        Response::serverError('Failed to update profile: ' . $e->getMessage());
    }
}

else {
    Response::error('Method not allowed', 405);
}
