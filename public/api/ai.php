<?php
// ai.php
require_once 'db.php';
define('AUTH_AS_LIB', true);
require_once 'auth.php';

$userId = requireAuth();
$companyId = getActiveCompanyId($pdo, $userId);

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'processReceiptBase64':
        // Mocking OCR & AI extraction for shared hosting (Namecheap)
        $data = json_decode(file_get_contents('php://input'), true);
        
        $base64Data = $data['base64Data'] ?? '';
        $filename = $data['filename'] ?? 'receipt.jpg';
        $mimeType = $data['mimeType'] ?? 'image/jpeg';
        
        $base64Clean = preg_replace('/^data:image\/\w+;base64,/', '', $base64Data);
        $buffer = base64_decode($base64Clean);
        
        // Save document
        $docId = uniqid();
        $stmt = $pdo->prepare("INSERT INTO Document (id, companyId, filename, mimeType, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())");
        $stmt->execute([$docId, $companyId, $filename, $mimeType, $buffer]);

        // Mocked response
        jsonResponse([
            "documentId" => $docId,
            "vendor" => "Example Vendor",
            "amount" => 5000,
            "date" => date("Y-m-d"),
            "category" => "Meals",
            "description" => "Mocked receipt scan from $filename",
            "rawText" => "MOCKED OCR TEXT\nTOTAL 5000"
        ]);
        break;

    case 'saveAIExpense':
        $data = json_decode(file_get_contents('php://input'), true);
        
        $id = $data['id'] ?? null;
        $vendor = $data['vendor'];
        $amount = $data['amount'];
        $date = $data['date'];
        $category = $data['category'];
        $description = $data['description'] ?? null;
        $documentId = $data['documentId'] ?? null;

        // Simplified Anomaly Detection
        $isFlagged = false;
        $flagReason = null;

        if ($id) {
            $stmt = $pdo->prepare("UPDATE Expense SET vendor=?, description=?, amount=?, date=?, category=?, isFlagged=?, flagReason=?, updatedAt=NOW() WHERE id=?");
            $stmt->execute([$vendor, $description, $amount, $date, $category, $isFlagged ? 1 : 0, $flagReason, $id]);
            jsonResponse(["ok" => true, "expenseId" => $id, "isFlagged" => $isFlagged, "flagReason" => $flagReason]);
        } else {
            $id = uniqid();
            $stmt = $pdo->prepare("INSERT INTO Expense (id, companyId, documentId, vendor, description, amount, date, category, isFlagged, flagReason, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
            $stmt->execute([$id, $companyId, $documentId, $vendor, $description, $amount, $date, $category, $isFlagged ? 1 : 0, $flagReason]);
            jsonResponse(["ok" => true, "expenseId" => $id, "isFlagged" => $isFlagged, "flagReason" => $flagReason]);
        }
        break;

    case 'listExpenses':
        $stmt = $pdo->prepare("SELECT e.*, d.id as doc_id, d.filename, d.mimeType FROM Expense e LEFT JOIN Document d ON e.documentId = d.id WHERE e.companyId = ? ORDER BY e.date DESC");
        $stmt->execute([$companyId]);
        $expenses = $stmt->fetchAll();
        $result = [];
        foreach ($expenses as $exp) {
            $result[] = [
                "id" => $exp['id'],
                "vendor" => $exp['vendor'],
                "amount" => (float)$exp['amount'],
                "date" => substr($exp['date'], 0, 10),
                "category" => $exp['category'],
                "description" => $exp['description'],
                "isFlagged" => (bool)$exp['isFlagged'],
                "flagReason" => $exp['flagReason'],
                "document" => $exp['doc_id'] ? [
                    "id" => $exp['doc_id'],
                    "filename" => $exp['filename'],
                    "mimeType" => $exp['mimeType']
                ] : null
            ];
        }
        jsonResponse($result);
        break;

    case 'deleteAIExpense':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("DELETE FROM Expense WHERE id = ? AND companyId = ?");
        $stmt->execute([$data['id'], $companyId]);
        jsonResponse(["ok" => true]);
        break;

    case 'getExpenseDocument':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("SELECT filename, mimeType, content FROM Document WHERE id = ? AND companyId = ? LIMIT 1");
        $stmt->execute([$data['documentId'], $companyId]);
        $doc = $stmt->fetch();
        if (!$doc) jsonResponse(["error" => "Not found"], 404);
        
        $base64 = base64_encode($doc['content']);
        jsonResponse([
            "filename" => $doc['filename'],
            "mimeType" => $doc['mimeType'],
            "dataUrl" => "data:" . $doc['mimeType'] . ";base64," . $base64
        ]);
        break;

    case 'aiChatQuery':
        jsonResponse(["response" => "Mocked AI Chat Response for PHP prototype."]);
        break;

    case 'generateFinancialInsights':
        jsonResponse([
            "insights" => ["Revenue looks steady.", "Keep an eye on categorizing your expenses.", "Upload more receipts to get better insights!"],
            "prediction" => "Cash flow should remain stable over the next 30 days."
        ]);
        break;
        
    case 'processVoiceExpense':
        jsonResponse([
            "vendor" => "Voice Entry",
            "amount" => 1500,
            "date" => date("Y-m-d"),
            "category" => "Other"
        ]);
        break;

    default:
        jsonResponse(["error" => "Unknown action"], 400);
}
?>
