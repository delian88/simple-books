<?php
// cms.php
require_once 'db.php';
define('AUTH_AS_LIB', true);
require_once 'auth.php';
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'listPages':
        $userId = requireAuth();
        $stmt = $pdo->prepare("SELECT id, slug, title, published, created_at, updated_at FROM pages ORDER BY created_at DESC");
        $stmt->execute();
        $pages = $stmt->fetchAll();
        jsonResponse($pages);
        break;

    case 'getPage':
        $userId = requireAuth();
        $id = $_GET['id'] ?? '';
        $stmt = $pdo->prepare("SELECT * FROM pages WHERE id = ?");
        $stmt->execute([$id]);
        $page = $stmt->fetch();
        if (!$page) {
            jsonResponse(["error" => "Page not found"], 404);
        }
        jsonResponse($page);
        break;

    case 'getPageBySlug':
        // Publicly accessible, no auth required
        $slug = $_GET['slug'] ?? '';
        $stmt = $pdo->prepare("SELECT * FROM pages WHERE slug = ? AND published = 1");
        $stmt->execute([$slug]);
        $page = $stmt->fetch();
        if (!$page) {
            jsonResponse(["error" => "Page not found"], 404);
        }
        jsonResponse($page);
        break;

    case 'listPublishedPages':
        // Publicly accessible for SSG generateStaticParams
        $stmt = $pdo->prepare("SELECT slug FROM pages WHERE published = 1");
        $stmt->execute();
        $pages = $stmt->fetchAll();
        jsonResponse($pages);
        break;

    case 'savePage':
        $userId = requireAuth();
        $raw  = json_decode(file_get_contents('php://input'), true) ?? [];
        $data = $raw['data'] ?? $raw;
        $id = $data['id'] ?? null;
        $now = date('Y-m-d H:i:s');
        
        $published = !empty($data['published']) ? 1 : 0;
        
        if ($id) {
            $stmt = $pdo->prepare("UPDATE pages SET title = ?, slug = ?, content = ?, published = ?, updated_at = ? WHERE id = ?");
            $stmt->execute([$data['title'], $data['slug'], $data['content'], $published, $now, $id]);
        } else {
            $id = bin2hex(random_bytes(9));
            $stmt = $pdo->prepare("INSERT INTO pages (id, title, slug, content, published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$id, $data['title'], $data['slug'], $data['content'], $published, $now, $now]);
        }
        jsonResponse(["id" => $id]);
        break;

    case 'deletePage':
        $userId = requireAuth();
        $raw  = json_decode(file_get_contents('php://input'), true) ?? [];
        $data = $raw['data'] ?? $raw;
        $id = $data['id'] ?? null;
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM pages WHERE id = ?");
            $stmt->execute([$id]);
        }
        jsonResponse(["success" => true]);
        break;

    default:
        jsonResponse(["error" => "Unknown action"], 400);
}
?>
