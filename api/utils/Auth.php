<?php
require_once __DIR__ . '/JWT.php';

/**
 * Authentication Utility
 * Handle user authentication and authorization
 */

class Auth {
    private $db;
    private $secret_key = "your-secret-key-change-this-in-production"; // Change this!
    
    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Register new user
     */
    public function register($data) {
        // Validate required fields
        $required = ['email', 'password', 'first_name', 'last_name'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return ['success' => false, 'message' => ucfirst($field) . ' is required'];
            }
        }

        // Validate email
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'message' => 'Invalid email format'];
        }

        // Check if user exists
        $query = "SELECT id FROM users WHERE email = :email";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':email', $data['email']);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            return ['success' => false, 'message' => 'Email already registered'];
        }

        // Hash password
        $hashed_password = password_hash($data['password'], PASSWORD_BCRYPT);

        // Generate verification token
        $verification_token = bin2hex(random_bytes(32));

        // Insert user
        $query = "INSERT INTO users (email, password, first_name, last_name, company_name, phone, verification_token) 
                  VALUES (:email, :password, :first_name, :last_name, :company_name, :phone, :verification_token)";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':password', $hashed_password);
        $stmt->bindParam(':first_name', $data['first_name']);
        $stmt->bindParam(':last_name', $data['last_name']);
        $stmt->bindParam(':company_name', $data['company_name']);
        $stmt->bindParam(':phone', $data['phone']);
        $stmt->bindParam(':verification_token', $verification_token);

        if ($stmt->execute()) {
            $user_id = $this->db->lastInsertId();
            
            // Create default settings
            $this->createDefaultSettings($user_id);
            
            return [
                'success' => true,
                'message' => 'Registration successful',
                'user_id' => $user_id,
                'verification_token' => $verification_token
            ];
        }

        return ['success' => false, 'message' => 'Registration failed'];
    }

    /**
     * Login user
     */
    public function login($email, $password) {
        $query = "SELECT id, email, password, first_name, last_name, company_name, status, email_verified 
                  FROM users WHERE email = :email";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        if ($stmt->rowCount() == 0) {
            return ['success' => false, 'message' => 'Invalid credentials'];
        }

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Check password
        if (!password_verify($password, $user['password'])) {
            return ['success' => false, 'message' => 'Invalid credentials'];
        }

        // Check user status
        if ($user['status'] !== 'active') {
            return ['success' => false, 'message' => 'Account is ' . $user['status']];
        }

        // Update last login
        $update_query = "UPDATE users SET last_login = NOW() WHERE id = :id";
        $update_stmt = $this->db->prepare($update_query);
        $update_stmt->bindParam(':id', $user['id']);
        $update_stmt->execute();

        // Generate JWT token
        $token = JWT::encode([
            'user_id' => $user['id'],
            'email' => $user['email'],
            'exp' => time() + (86400 * 7) // 7 days
        ], $this->secret_key);

        unset($user['password']);

        return [
            'success' => true,
            'message' => 'Login successful',
            'token' => $token,
            'user' => $user
        ];
    }

    /**
     * Verify JWT token
     */
    public function verifyToken($token) {
        try {
            $decoded = JWT::decode($token, $this->secret_key);
            
            // Check if token is expired
            if ($decoded->exp < time()) {
                return ['success' => false, 'message' => 'Token expired'];
            }

            return [
                'success' => true,
                'user_id' => $decoded->user_id,
                'email' => $decoded->email
            ];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Invalid token'];
        }
    }

    /**
     * Get authenticated user
     */
    public function getAuthenticatedUser() {
        $headers = getallheaders();
        $token = null;

        if (isset($headers['Authorization'])) {
            $matches = [];
            preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches);
            if (isset($matches[1])) {
                $token = $matches[1];
            }
        }

        if (!$token) {
            return null;
        }

        $result = $this->verifyToken($token);
        return $result['success'] ? $result['user_id'] : null;
    }

    /**
     * Create default settings for new user
     */
    private function createDefaultSettings($user_id) {
        $query = "INSERT INTO user_settings (user_id) VALUES (:user_id)";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
    }

    /**
     * Request password reset
     */
    public function requestPasswordReset($email) {
        $query = "SELECT id FROM users WHERE email = :email";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        if ($stmt->rowCount() == 0) {
            return ['success' => false, 'message' => 'Email not found'];
        }

        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        $reset_token = bin2hex(random_bytes(32));
        $expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));

        $update_query = "UPDATE users SET reset_token = :token, reset_token_expiry = :expiry WHERE id = :id";
        $update_stmt = $this->db->prepare($update_query);
        $update_stmt->bindParam(':token', $reset_token);
        $update_stmt->bindParam(':expiry', $expiry);
        $update_stmt->bindParam(':id', $user['id']);
        $update_stmt->execute();

        return [
            'success' => true,
            'message' => 'Password reset email sent',
            'reset_token' => $reset_token
        ];
    }

    /**
     * Reset password
     */
    public function resetPassword($token, $new_password) {
        $query = "SELECT id FROM users WHERE reset_token = :token AND reset_token_expiry > NOW()";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':token', $token);
        $stmt->execute();

        if ($stmt->rowCount() == 0) {
            return ['success' => false, 'message' => 'Invalid or expired reset token'];
        }

        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        $hashed_password = password_hash($new_password, PASSWORD_BCRYPT);

        $update_query = "UPDATE users SET password = :password, reset_token = NULL, reset_token_expiry = NULL WHERE id = :id";
        $update_stmt = $this->db->prepare($update_query);
        $update_stmt->bindParam(':password', $hashed_password);
        $update_stmt->bindParam(':id', $user['id']);
        $update_stmt->execute();

        return ['success' => true, 'message' => 'Password reset successful'];
    }
}
