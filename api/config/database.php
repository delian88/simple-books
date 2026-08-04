<?php
/**
 * Database Configuration
 * MySQL connection settings for Ledgerly
 */

class Database {
    // Database credentials - read from environment variables
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $charset = "utf8mb4";
    
    public $conn;

    /**
     * Constructor - load environment variables
     */
    public function __construct() {
        // Try to get from environment variables first
        $this->host = getenv('DB_HOST') ?: "localhost";
        $this->db_name = getenv('DB_NAME') ?: "ledgerly_db";
        $this->username = getenv('DB_USER') ?: "root";
        $this->password = getenv('DB_PASSWORD') ?: "";
        
        // If .env file exists, try to parse it
        $env_file = dirname(__DIR__) . '/.env';
        if (file_exists($env_file)) {
            $this->loadEnv($env_file);
        }
    }

    /**
     * Load environment variables from .env file
     */
    private function loadEnv($file_path) {
        $lines = file($file_path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue; // Skip comments
            
            $parts = explode('=', $line, 2);
            if (count($parts) === 2) {
                $key = trim($parts[0]);
                $value = trim($parts[1]);
                
                // Remove quotes if present
                $value = trim($value, "'\"");
                
                switch ($key) {
                    case 'DB_HOST':
                        $this->host = $value ?: $this->host;
                        break;
                    case 'DB_NAME':
                        $this->db_name = $value ?: $this->db_name;
                        break;
                    case 'DB_USER':
                        $this->username = $value ?: $this->username;
                        break;
                    case 'DB_PASSWORD':
                        $this->password = $value ?: $this->password;
                        break;
                }
            }
        }
    }

    /**
     * Get database connection
     * @return PDO|null
     */
    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=" . $this->charset;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch(PDOException $exception) {
            error_log('Database connection error: ' . $exception->getMessage());
            $this->conn = null;
            
            // For development, return null and let endpoints handle error
            return null;
        }

        return $this->conn;
    }
}
