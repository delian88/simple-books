<?php
/**
 * Password Reset Endpoint
 * POST /api/auth/reset-password.php
 * 
 * Two-step process:
 * 1. Request reset token (send email param)
 * 2. Reset password (send token and new_password params)
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Response.php';

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

// Step 1: Request reset token
if (isset($data['email']) && !isset($data['token'])) {
    $email = trim($data['email']);
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Response::error('Invalid email address');
    }
    
    // Check if user exists
    $query = "SELECT id FROM users WHERE email = :email AND status = 'active'";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $email);
    $stmt->execute();
    
    if ($stmt->rowCount() == 0) {
        // Return success even if user doesn't exist (security best practice)
        Response::success([], 'If the email exists, a reset link has been sent');
    }
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Generate reset token
    $reset_token = bin2hex(random_bytes(32));
    $reset_expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    // Save reset token
    $update_query = "UPDATE users SET reset_token = :token, reset_token_expiry = :expiry WHERE id = :user_id";
    $update_stmt = $db->prepare($update_query);
    $update_stmt->bindParam(':token', $reset_token);
    $update_stmt->bindParam(':expiry', $reset_expiry);
    $update_stmt->bindParam(':user_id', $user['id']);
    $update_stmt->execute();
    
    // TODO: Send email with reset link
    // For now, return token in response (remove in production)
    Response::success([
        'message' => 'Password reset token generated',
        'reset_token' => $reset_token, // Remove this in production
        'reset_url' => "https://your-domain.com/reset-password?token=$reset_token" // Remove this in production
    ], 'If the email exists, a reset link has been sent');
}

// Step 2: Reset password with token
elseif (isset($data['token']) && isset($data['new_password'])) {
    $token = $data['token'];
    $new_password = $data['new_password'];
    
    // Validate password
    if (strlen($new_password) < 6) {
        Response::error('Password must be at least 6 characters long');
    }
    
    // Find user with valid token
    $query = "SELECT id FROM users 
              WHERE reset_token = :token 
              AND reset_token_expiry > NOW()
              AND status = 'active'";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':token', $token);
    $stmt->execute();
    
    if ($stmt->rowCount() == 0) {
        Response::error('Invalid or expired reset token', 400);
    }
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Hash new password
    $hashed_password = password_hash($new_password, PASSWORD_BCRYPT);
    
    // Update password and clear reset token
    $update_query = "UPDATE users 
                     SET password = :password, 
                         reset_token = NULL, 
                         reset_token_expiry = NULL 
                     WHERE id = :user_id";
    $update_stmt = $db->prepare($update_query);
    $update_stmt->bindParam(':password', $hashed_password);
    $update_stmt->bindParam(':user_id', $user['id']);
    
    try {
        $update_stmt->execute();
        Response::success([], 'Password reset successful. You can now login with your new password');
    } catch (Exception $e) {
        Response::serverError('Failed to reset password: ' . $e->getMessage());
    }
}

else {
    Response::error('Invalid request. Please provide either email (to request reset) or token and new_password (to reset)');
}
