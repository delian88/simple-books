<?php
// admin.php
require_once 'db.php';
define('AUTH_AS_LIB', true);
require_once 'auth.php';

$action = $_GET['action'] ?? '';

// Admin check — user must have role = 'admin' in users table
function ensureAdmin($pdo): string {
    $userId = requireAuth();
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    if (!$user || strtolower($user['role']) !== 'admin') {
        jsonResponse(['error' => 'Forbidden — admin only'], 403);
    }
    return $userId;
}

// Helper: upsert a key/value into system_settings
function upsertSetting($pdo, string $key, string $value): void {
    $now = date('Y-m-d H:i:s');
    $id  = bin2hex(random_bytes(9));
    $pdo->prepare("INSERT INTO system_settings (id, `key`, `value`, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?)
                   ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), updated_at = VALUES(updated_at)")
        ->execute([$id, $key, $value, $now, $now]);
}

switch ($action) {

    case 'getSettings':
        // Public-ish — no strict admin check so the landing page can call it too
        $stmt = $pdo->query("SELECT `key`, `value` FROM system_settings");
        $map  = [];
        foreach ($stmt->fetchAll() as $row) {
            $map[$row['key']] = $row['value'];
        }
        jsonResponse([
            'appName'                  => $map['app_name']                   ?? 'KoboBooks',
            'appLogo'                  => $map['app_logo']                   ?? null,
            'appTagline'               => $map['app_tagline']                ?? '',
            'subscriptionCurrency'     => $map['subscription_currency']      ?? 'NGN',
            'subscriptionPrice'        => $map['subscription_price']         ?? '10',
            'subscriptionPriceYearly'  => $map['subscription_price_yearly']  ?? '100',
            'smtpEnabled'              => $map['smtp_enabled']               ?? 'false',
            'smtpHost'                 => $map['smtp_host']                  ?? '',
            'smtpPort'                 => $map['smtp_port']                  ?? '587',
            'smtpUser'                 => $map['smtp_user']                  ?? '',
            'smtpPass'                 => $map['smtp_pass']                  ?? '',
        ]);
        break;

    case 'updateSettings':
        ensureAdmin($pdo);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $body = $data['data'] ?? $data; // support both wrapped and flat

        $map = [
            'appName'                 => 'app_name',
            'appLogo'                 => 'app_logo',
            'appTagline'              => 'app_tagline',
            'subscriptionCurrency'    => 'subscription_currency',
            'subscriptionPrice'       => 'subscription_price',
            'subscriptionPriceYearly' => 'subscription_price_yearly',
            'smtpEnabled'             => 'smtp_enabled',
            'smtpHost'                => 'smtp_host',
            'smtpPort'                => 'smtp_port',
            'smtpUser'                => 'smtp_user',
            'smtpPass'                => 'smtp_pass',
        ];

        foreach ($map as $jsKey => $dbKey) {
            if (array_key_exists($jsKey, $body)) {
                upsertSetting($pdo, $dbKey, (string) $body[$jsKey]);
            }
        }
        jsonResponse(['ok' => true]);
        break;

    case 'getSystemStats':
        ensureAdmin($pdo);
        $users     = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
        $companies = $pdo->query("SELECT COUNT(*) FROM companies")->fetchColumn();
        jsonResponse(['totalUsers' => $users, 'totalCompanies' => $companies]);
        break;

    case 'listAllCompanies':
        ensureAdmin($pdo);
        $stmt = $pdo->query("SELECT * FROM companies ORDER BY created_at DESC");
        jsonResponse($stmt->fetchAll());
        break;

    case 'uploadLogo':
        ensureAdmin($pdo);
        if (!isset($_FILES['logo']) || $_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
            jsonResponse(['error' => 'No file uploaded or upload error'], 400);
        }
        $file = $_FILES['logo'];
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $allowed = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
        if (!in_array(strtolower($ext), $allowed)) {
            jsonResponse(['error' => 'Invalid file type'], 400);
        }
        if (!is_dir(__DIR__ . '/uploads')) {
            mkdir(__DIR__ . '/uploads', 0755, true);
        }
        $filename = uniqid('logo_') . '.' . $ext;
        $dest = __DIR__ . '/uploads/' . $filename;
        if (move_uploaded_file($file['tmp_name'], $dest)) {
            // Because PHP is serving the root, the path will be /api/uploads/filename
            $url = 'http://127.0.0.1:8000/api/uploads/' . $filename; 
            jsonResponse(['url' => $url]);
        } else {
            jsonResponse(['error' => 'Failed to save file'], 500);
        }
        break;

    default:
        jsonResponse(['error' => 'Unknown action'], 400);
}
?>
