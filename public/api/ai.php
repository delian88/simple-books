<?php
// ai.php — corrected to match snake_case schema
require_once 'db.php';
define('AUTH_AS_LIB', true);
require_once 'auth.php';

$userId    = requireAuth();
$companyId = getActiveCompanyId($pdo, $userId);
$action    = $_GET['action'] ?? '';

switch ($action) {

    // ── Receipt scanning (mocked for shared hosting) ──────────────────────────
    case 'processReceiptBase64':
        $data       = json_decode(file_get_contents('php://input'), true) ?? [];
        $base64Data = $data['base64Data'] ?? '';
        $filename   = $data['filename']   ?? 'receipt.jpg';
        $mimeType   = $data['mimeType']   ?? 'image/jpeg';

        $base64Clean = preg_replace('/^data:image\/\w+;base64,/', '', $base64Data);
        $buffer      = base64_decode($base64Clean);

        // Save document using correct snake_case columns
        $docId = bin2hex(random_bytes(9));
        $now   = date('Y-m-d H:i:s');
        $pdo->prepare("INSERT INTO documents (id, company_id, filename, mime_type, content, created_at)
                       VALUES (?, ?, ?, ?, ?, ?)")
            ->execute([$docId, $companyId, $filename, $mimeType, $buffer, $now]);

        jsonResponse([
            'documentId'  => $docId,
            'vendor'      => 'Example Vendor',
            'amount'      => 5000,
            'date'        => date('Y-m-d'),
            'category'    => 'Meals',
            'description' => "Mocked receipt scan from $filename",
            'rawText'     => "MOCKED OCR TEXT\nTOTAL 5000",
        ]);
        break;

    // ── Save / update an AI-extracted expense ─────────────────────────────────
    case 'saveAIExpense':
        $data        = json_decode(file_get_contents('php://input'), true) ?? [];
        $id          = $data['id']          ?? null;
        $vendor      = $data['vendor']      ?? '';
        $amount      = $data['amount']      ?? 0;
        $date        = $data['date']        ?? date('Y-m-d');
        $category    = $data['category']    ?? 'Other';
        $description = $data['description'] ?? null;
        $documentId  = $data['documentId']  ?? null;
        $isFlagged   = 0;
        $flagReason  = null;
        $now         = date('Y-m-d H:i:s');

        if ($id) {
            $pdo->prepare("UPDATE expenses
                           SET vendor=?, description=?, amount=?, date=?, category=?,
                               is_flagged=?, flag_reason=?, updated_at=?
                           WHERE id=? AND company_id=?")
                ->execute([$vendor, $description, $amount, $date, $category,
                           $isFlagged, $flagReason, $now, $id, $companyId]);
        } else {
            $id = bin2hex(random_bytes(9));
            $pdo->prepare("INSERT INTO expenses
                           (id, company_id, document_id, vendor, description, amount,
                            date, category, is_flagged, flag_reason, created_at, updated_at)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                ->execute([$id, $companyId, $documentId, $vendor, $description,
                           $amount, $date, $category, $isFlagged, $flagReason, $now, $now]);
        }

        jsonResponse(['ok' => true, 'expenseId' => $id,
                      'isFlagged' => (bool)$isFlagged, 'flagReason' => $flagReason]);
        break;

    // ── List expenses ─────────────────────────────────────────────────────────
    case 'listExpenses':
        $stmt = $pdo->prepare("
            SELECT e.*, d.id AS doc_id, d.filename, d.mime_type
            FROM expenses e
            LEFT JOIN documents d ON e.document_id = d.id
            WHERE e.company_id = ?
            ORDER BY e.date DESC
        ");
        $stmt->execute([$companyId]);
        $rows   = $stmt->fetchAll();
        $result = [];
        foreach ($rows as $exp) {
            $result[] = [
                'id'          => $exp['id'],
                'vendor'      => $exp['vendor'],
                'amount'      => (float) $exp['amount'],
                'date'        => substr($exp['date'] ?? '', 0, 10),
                'category'    => $exp['category'],
                'description' => $exp['description'],
                'isFlagged'   => (bool) $exp['is_flagged'],
                'flagReason'  => $exp['flag_reason'],
                'document'    => $exp['doc_id'] ? [
                    'id'       => $exp['doc_id'],
                    'filename' => $exp['filename'],
                    'mimeType' => $exp['mime_type'],
                ] : null,
            ];
        }
        jsonResponse($result);
        break;

    // ── Delete an expense ─────────────────────────────────────────────────────
    case 'deleteAIExpense':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $pdo->prepare("DELETE FROM expenses WHERE id = ? AND company_id = ?")
            ->execute([$data['id'], $companyId]);
        jsonResponse(['ok' => true]);
        break;

    // ── Fetch document binary ─────────────────────────────────────────────────
    case 'getExpenseDocument':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $stmt = $pdo->prepare("SELECT filename, mime_type, content
                               FROM documents WHERE id = ? AND company_id = ? LIMIT 1");
        $stmt->execute([$data['documentId'], $companyId]);
        $doc  = $stmt->fetch();
        if (!$doc) jsonResponse(['error' => 'Not found'], 404);
        jsonResponse([
            'filename' => $doc['filename'],
            'mimeType' => $doc['mime_type'],
            'dataUrl'  => 'data:' . $doc['mime_type'] . ';base64,' . base64_encode($doc['content']),
        ]);
        break;

    // ── Mocked AI helpers ─────────────────────────────────────────────────────
    case 'aiChatQuery':
        jsonResponse(['response' => 'AI chat is not yet configured on this server.']);
        break;

    case 'generateFinancialInsights':
        jsonResponse([
            'insights'   => [
                'Revenue looks steady.',
                'Keep an eye on categorising your expenses.',
                'Upload more receipts to get better insights!',
            ],
            'prediction' => 'Cash flow should remain stable over the next 30 days.',
        ]);
        break;

    case 'processVoiceExpense':
        jsonResponse([
            'vendor'   => 'Voice Entry',
            'amount'   => 1500,
            'date'     => date('Y-m-d'),
            'category' => 'Other',
        ]);
        break;

    default:
        jsonResponse(['error' => 'Unknown action'], 400);
}
?>
