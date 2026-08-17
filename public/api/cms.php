<?php
// cms.php
require_once 'db.php';
define('AUTH_AS_LIB', true);
require_once 'auth.php';

$action = $_GET['action'] ?? '';

// Helper for admin
function ensureAdmin($pdo) {
    $userId = requireAuth();
    $stmt = $pdo->prepare("SELECT role FROM User WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    if (!$user || $user['role'] !== 'admin') {
        jsonResponse(array("error" => "Forbidden"), 403);
    }
}

switch ($action) {
    case 'listPages':
        ensureAdmin($pdo);
        $stmt = $pdo->prepare("SELECT * FROM Page ORDER BY createdAt DESC");
        $stmt->execute();
        $pages = $stmt->fetchAll();
        foreach ($pages as &$p) { $p['published'] = (bool)$p['published']; }
        jsonResponse($pages);
        break;

    case 'getPageBySlug':
        // Publicly accessible
        $data = json_decode(file_get_contents('php://input'), true);
        $slug = $_GET['slug'] ?? ($data['slug'] ?? '');
        $stmt = $pdo->prepare("SELECT * FROM Page WHERE slug = ? LIMIT 1");
        $stmt->execute([$slug]);
        $page = $stmt->fetch();
        if ($page) { $page['published'] = (bool)$page['published']; }
        jsonResponse($page);
        break;

    case 'upsertPage':
        ensureAdmin($pdo);
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? null;
        if ($id) {
            $stmt = $pdo->prepare("UPDATE Page SET slug=?, title=?, content=?, published=?, updatedAt=NOW() WHERE id=?");
            $stmt->execute([$data['slug'], $data['title'], $data['content'], $data['published'] ? 1 : 0, $id]);
            jsonResponse(["id" => $id]);
        } else {
            $id = uniqid();
            $stmt = $pdo->prepare("INSERT INTO Page (id, slug, title, content, published, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())");
            $stmt->execute([$id, $data['slug'], $data['title'], $data['content'], $data['published'] ? 1 : 0]);
            jsonResponse(["id" => $id]);
        }
        break;

    case 'deletePage':
        ensureAdmin($pdo);
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("DELETE FROM Page WHERE id = ?");
        $stmt->execute([$data['id']]);
        jsonResponse(["ok" => true]);
        break;

    default:
        jsonResponse(["error" => "Unknown action"], 400);
}
?>
