<?php
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($key, $val) = explode('=', $line, 2);
        putenv(trim($key) . '=' . trim($val, '"\' '));
    }
}

$dbUrl = getenv('DATABASE_URL') ?: "mysql://Ledgerly_db_swamtimeif:0c4ea697645ed3d779657d59c26959693e01a3b2@czv80u.h.filess.io:3306/Ledgerly_db_swamtimeif";
echo "Connecting to: " . $dbUrl . "\n";

$p = parse_url($dbUrl);
try {
    $dsn = "mysql:host=" . $p['host'] . ";port=" . ($p['port'] ?? 3306) . ";dbname=" . ltrim($p['path'], '/');
    $pdo = new PDO($dsn, $p['user'], $p['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    echo "PDO Connection Successful!\n";
    
    $stmt = $pdo->prepare("SELECT id, email, password, role FROM users WHERE email = ?");
    $stmt->execute(['nutech2025@gmail.com']);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "User record found:\n";
    print_r($user);

    if ($user) {
        $inputPassword = 'Admin@webmaster$1';
        $hashInDb = $user['password'];
        $normalizedHash = preg_replace('/^\$2b\$/', '$2y$', $hashInDb);
        echo "Hash in DB: " . $hashInDb . "\n";
        echo "Normalized: " . $normalizedHash . "\n";
        $ok = password_verify($inputPassword, $normalizedHash);
        echo "password_verify result: " . ($ok ? "VALID PASS!" : "INVALID PASS!") . "\n";
    }
} catch (Exception $e) {
    echo "Connection or query error: " . $e->getMessage() . "\n";
}
