<?php
/**
 * User Settings Endpoint
 * GET /api/user/settings.php - Get settings
 * PUT /api/user/settings.php - Update settings
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

// GET - Retrieve settings
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $query = "SELECT * FROM user_settings WHERE user_id = :user_id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Decode JSON settings field
        if ($settings['settings']) {
            $settings['settings'] = json_decode($settings['settings'], true);
        } else {
            $settings['settings'] = [];
        }
        
        Response::success(['settings' => $settings]);
    } else {
        // Return default settings if none exist
        Response::success(['settings' => $this->getDefaultSettings()]);
    }
}

// PUT - Update settings
elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!$data) {
        Response::error('Invalid JSON data');
    }
    
    // Default allowed settings fields
    $allowed_fields = [
        'currency', 'date_format', 'timezone', 'language', 
        'fiscal_year_start', 'notifications_enabled', 'email_notifications', 'theme'
    ];
    
    // Filter and validate data
    $update_data = [];
    $json_settings = [];
    
    foreach ($allowed_fields as $field) {
        if (isset($data[$field])) {
            $update_data[$field] = $data[$field];
        }
    }
    
    // Handle custom JSON settings
    if (isset($data['settings']) && is_array($data['settings'])) {
        $json_settings = $data['settings'];
    }
    
    if (empty($update_data) && empty($json_settings)) {
        Response::error('No settings to update');
    }
    
    // Check if settings exist for user
    $check_query = "SELECT id FROM user_settings WHERE user_id = :user_id";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(':user_id', $user_id);
    $check_stmt->execute();
    
    try {
        if ($check_stmt->rowCount() > 0) {
            // Update existing settings
            $update_fields = [];
            $params = [':user_id' => $user_id];
            
            foreach ($update_data as $field => $value) {
                $update_fields[] = "$field = :$field";
                $params[":$field"] = $value;
            }
            
            if (!empty($json_settings)) {
                $update_fields[] = "settings = :settings";
                $params[':settings'] = json_encode($json_settings);
            }
            
            $query = "UPDATE user_settings SET " . implode(', ', $update_fields) . " WHERE user_id = :user_id";
        } else {
            // Insert new settings
            $fields = ['user_id'];
            $placeholders = [':user_id'];
            $params = [':user_id' => $user_id];
            
            foreach ($update_data as $field => $value) {
                $fields[] = $field;
                $placeholders[] = ":$field";
                $params[":$field"] = $value;
            }
            
            if (!empty($json_settings)) {
                $fields[] = 'settings';
                $placeholders[] = ':settings';
                $params[':settings'] = json_encode($json_settings);
            }
            
            $query = "INSERT INTO user_settings (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";
        }
        
        $stmt = $db->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();
        
        // Get updated settings
        $get_query = "SELECT * FROM user_settings WHERE user_id = :user_id";
        $get_stmt = $db->prepare($get_query);
        $get_stmt->bindParam(':user_id', $user_id);
        $get_stmt->execute();
        
        $updated_settings = $get_stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($updated_settings['settings']) {
            $updated_settings['settings'] = json_decode($updated_settings['settings'], true);
        } else {
            $updated_settings['settings'] = [];
        }
        
        Response::success(['settings' => $updated_settings], 'Settings updated successfully');
        
    } catch (Exception $e) {
        Response::serverError('Failed to update settings: ' . $e->getMessage());
    }
}

else {
    Response::error('Method not allowed', 405);
}

/**
 * Get default settings
 */
function getDefaultSettings() {
    return [
        'user_id' => null,
        'currency' => 'USD',
        'date_format' => 'Y-m-d',
        'timezone' => 'UTC',
        'language' => 'en',
        'fiscal_year_start' => '01-01',
        'notifications_enabled' => true,
        'email_notifications' => true,
        'theme' => 'light',
        'settings' => []
    ];
}
