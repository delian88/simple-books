<?php
/**
 * Ledgerly API Setup Script
 * Helps with initial setup and configuration
 */

header('Content-Type: text/html; charset=utf-8');

echo '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ledgerly API Setup</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
            color: #333;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1, h2, h3 {
            color: #059669;
        }
        .step {
            background: #f8f9fa;
            padding: 20px;
            border-left: 4px solid #059669;
            margin: 20px 0;
            border-radius: 4px;
        }
        .step-number {
            display: inline-block;
            background: #059669;
            color: white;
            padding: 5px 10px;
            border-radius: 3px;
            font-weight: bold;
            margin-right: 10px;
        }
        .success {
            background: #d1fae5;
            color: #065f46;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .error {
            background: #fee2e2;
            color: #7f1d1d;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .warning {
            background: #fef3c7;
            color: #92400e;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
        code {
            background: #f1f5f9;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 0.9em;
        }
        pre {
            background: #1e293b;
            color: #e2e8f0;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            margin: 15px 0;
        }
        .btn {
            display: inline-block;
            background: #059669;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            border: none;
            cursor: pointer;
            font-size: 16px;
            margin: 10px 5px;
        }
        .btn:hover {
            background: #047857;
        }
        .btn-secondary {
            background: #6b7280;
        }
        .btn-secondary:hover {
            background: #4b5563;
        }
        .test-results {
            margin-top: 20px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧾 Ledgerly API Setup</h1>
        <p>Complete setup guide for Ledgerly Accounting API</p>
        
        <div class="step">
            <h3><span class="step-number">1</span> Database Setup</h3>
            
            <?php
            // Check MySQL extension
            if (!extension_loaded('pdo_mysql')) {
                echo '<div class="error">PDO MySQL extension is not enabled</div>';
            } else {
                echo '<div class="success">PDO MySQL extension is enabled</div>';
            }
            
            // Try to connect to database
            $db_config = [
                'host' => 'localhost',
                'name' => 'ledgerly_db',
                'user' => 'root',
                'pass' => ''
            ];
            
            try {
                $dsn = "mysql:host={$db_config['host']};charset=utf8mb4";
                $pdo = new PDO($dsn, $db_config['user'], $db_config['pass'], [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
                ]);
                
                // Check if database exists
                $stmt = $pdo->query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'ledgerly_db'");
                $db_exists = $stmt->fetch();
                
                if ($db_exists) {
                    echo '<div class="success">Database "ledgerly_db" exists</div>';
                } else {
                    echo '<div class="warning">Database "ledgerly_db" does not exist</div>';
                    echo '<p>Create the database using the schema.sql file:</p>';
                    echo '<pre>mysql -u root -p < config/schema.sql</pre>';
                }
                
            } catch (PDOException $e) {
                echo '<div class="error">Database connection failed: ' . htmlspecialchars($e->getMessage()) . '</div>';
            }
            ?>
        </div>
        
        <div class="step">
            <h3><span class="step-number">2</span> File Permissions</h3>
            
            <?php
            // Check file permissions
            $required_dirs = ['uploads', 'logs'];
            $writable_dirs = [];
            
            foreach ($required_dirs as $dir) {
                $path = __DIR__ . '/' . $dir;
                if (!is_dir($path)) {
                    if (@mkdir($path, 0755, true)) {
                        $writable_dirs[] = $dir;
                    }
                } else {
                    if (is_writable($path)) {
                        $writable_dirs[] = $dir;
                    }
                }
            }
            
            if (count($writable_dirs) === count($required_dirs)) {
                echo '<div class="success">All required directories are writable</div>';
            } else {
                echo '<div class="error">Some directories are not writable:</div>';
                echo '<ul>';
                foreach ($required_dirs as $dir) {
                    $path = __DIR__ . '/' . $dir;
                    $status = is_dir($path) ? (is_writable($path) ? '✅ Writable' : '❌ Not writable') : '❌ Does not exist';
                    echo "<li><code>$dir/</code> - $status</li>";
                }
                echo '</ul>';
                echo '<p>Run these commands to fix permissions:</p>';
                echo '<pre>chmod 755 uploads/
chmod 755 logs/</pre>';
            }
            ?>
        </div>
        
        <div class="step">
            <h3><span class="step-number">3</span> Configuration</h3>
            
            <?php
            // Check .env file
            $env_file = __DIR__ . '/.env';
            $env_example = __DIR__ . '/.env.example';
            
            if (file_exists($env_file)) {
                echo '<div class="success">Configuration file (.env) exists</div>';
                
                // Check if it contains required variables
                $env_content = file_get_contents($env_file);
                $required_vars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET'];
                $missing_vars = [];
                
                foreach ($required_vars as $var) {
                    if (!preg_match("/^$var=/m", $env_content)) {
                        $missing_vars[] = $var;
                    }
                }
                
                if (empty($missing_vars)) {
                    echo '<div class="success">All required configuration variables are set</div>';
                } else {
                    echo '<div class="warning">Missing configuration variables: ' . implode(', ', $missing_vars) . '</div>';
                }
                
            } else {
                echo '<div class="warning">Configuration file (.env) does not exist</div>';
                echo '<p>Copy the example file:</p>';
                echo '<pre>cp .env.example .env</pre>';
                echo '<p>Then edit the .env file with your configuration:</p>';
                echo '<pre>DB_HOST=localhost
DB_NAME=ledgerly_db
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your-secret-key-change-this</pre>';
            }
            ?>
        </div>
        
        <div class="step">
            <h3><span class="step-number">4</span> Test API</h3>
            <p>Test the API endpoints:</p>
            
            <a href="index.php" class="btn">View API Documentation</a>
            <a href="README.md" class="btn-secondary">View Full Documentation</a>
            
            <div class="test-results">
                <h4>Quick Tests:</h4>
                
                <?php
                // Test API endpoints
                $tests = [
                    'index.php' => 'API Documentation',
                    'README.md' => 'API Documentation File',
                    'config/database.php' => 'Database Configuration',
                    'utils/Auth.php' => 'Authentication Utilities',
                    'utils/Response.php' => 'Response Utilities'
                ];
                
                echo '<ul>';
                foreach ($tests as $file => $description) {
                    $exists = file_exists(__DIR__ . '/' . $file);
                    $icon = $exists ? '✅' : '❌';
                    echo "<li>$icon <code>$file</code> - $description</li>";
                }
                echo '</ul>';
                ?>
            </div>
        </div>
        
        <div class="step">
            <h3><span class="step-number">5</span> Next Steps</h3>
            
            <ol>
                <li>Import the database schema: <code>mysql -u root -p < config/schema.sql</code></li>
                <li>Configure your web server (Apache/Nginx) to point to this directory</li>
                <li>Set up proper SSL certificates for production use</li>
                <li>Configure email settings in .env for password reset functionality</li>
                <li>Import the Postman collection for testing: <code>api/postman_collection.json</code></li>
                <li>Set up regular database backups</li>
            </ol>
            
            <h4>Production Checklist:</h4>
            <ul>
                <li>✅ Change default JWT secret key</li>
                <li>✅ Use strong database passwords</li>
                <li>✅ Enable HTTPS</li>
                <li>✅ Set up proper file permissions</li>
                <li>✅ Configure backup strategy</li>
                <li>✅ Set up monitoring and logging</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p><strong>Ledgerly Accounting API v1.0.0</strong></p>
            <p>Need help? Check the <a href="README.md">documentation</a> or create an issue on GitHub.</p>
        </div>
    </div>
</body>
</html>';
