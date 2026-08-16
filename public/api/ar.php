<?php
// ar.php
require_once 'db.php';
require_once 'auth.php';

$userId = requireAuth();
$companyId = getActiveCompanyId($pdo, $userId);

$action = $_GET['action'] ?? '';

// Helper
function ensureDefaultAccount($pdo, $companyId, $type, $subType, $name) {
    $stmt = $pdo->prepare("SELECT id FROM Account WHERE companyId = ? AND type = ? AND subType = ? LIMIT 1");
    $stmt->execute([$companyId, $type, $subType]);
    $row = $stmt->fetch();
    if ($row) return $row['id'];
    
    $id = uniqid();
    $stmt = $pdo->prepare("INSERT INTO Account (id, companyId, name, type, subType, openingBalance, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())");
    $stmt->execute([$id, $companyId, $name, $type, $subType]);
    return $id;
}

switch ($action) {
    case 'createCustomer':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = uniqid();
        $stmt = $pdo->prepare("INSERT INTO Customer (id, companyId, name, email, phone, address, currency, isArchived, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())");
        $stmt->execute([$id, $companyId, $data['name'], $data['email'] ?? null, $data['phone'] ?? null, $data['address'] ?? null, $data['currency'] ?? 'NGN']);
        jsonResponse(["ok" => true, "customerId" => $id]);
        break;

    case 'updateCustomer':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE Customer SET name=?, email=?, phone=?, address=?, currency=?, isArchived=? WHERE id=? AND companyId=?");
        $stmt->execute([$data['name'], $data['email'] ?? null, $data['phone'] ?? null, $data['address'] ?? null, $data['currency'] ?? 'NGN', $data['isArchived'] ? 1 : 0, $data['id'], $companyId]);
        jsonResponse(["ok" => true]);
        break;

    case 'listCustomers':
        $stmt = $pdo->prepare("SELECT * FROM Customer WHERE companyId = ? AND isArchived = 0 ORDER BY name ASC");
        $stmt->execute([$companyId]);
        $customers = $stmt->fetchAll();
        foreach ($customers as &$c) { $c['isArchived'] = (bool)$c['isArchived']; }
        jsonResponse($customers);
        break;

    case 'createSalesInvoice':
        $data = json_decode(file_get_contents('php://input'), true);
        $subtotal = 0; $taxAmount = 0;
        foreach ($data['lines'] as $line) {
            $lineAmount = $line['quantity'] * $line['unitPrice'];
            $subtotal += $lineAmount;
            $taxAmount += $lineAmount * ($line['taxRate'] / 100);
        }
        $totalAmount = $subtotal + $taxAmount;
        $id = uniqid();
        
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO SalesInvoice (id, companyId, customerId, invoiceNumber, issueDate, dueDate, notes, terms, subtotal, taxAmount, totalAmount, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', NOW(), NOW())");
            $stmt->execute([$id, $companyId, $data['customerId'], $data['invoiceNumber'], $data['issueDate'], $data['dueDate'], $data['notes'] ?? null, $data['terms'] ?? null, $subtotal, $taxAmount, $totalAmount]);
            
            $lineStmt = $pdo->prepare("INSERT INTO SalesInvoiceLine (id, invoiceId, description, quantity, unitPrice, amount, taxRate) VALUES (UUID(), ?, ?, ?, ?, ?, ?)");
            foreach ($data['lines'] as $line) {
                $lineAmount = $line['quantity'] * $line['unitPrice'];
                $lineStmt->execute([$id, $line['description'], $line['quantity'], $line['unitPrice'], $lineAmount, $line['taxRate']]);
            }
            $pdo->commit();
            jsonResponse(["ok" => true, "invoiceId" => $id]);
        } catch(Exception $e) {
            $pdo->rollBack();
            jsonResponse(["error" => $e->getMessage()], 500);
        }
        break;

    case 'listInvoices':
        $stmt = $pdo->prepare("SELECT i.*, c.name as customer_name, c.email as customer_email FROM SalesInvoice i LEFT JOIN Customer c ON i.customerId = c.id WHERE i.companyId = ? ORDER BY i.issueDate DESC");
        $stmt->execute([$companyId]);
        $invoices = $stmt->fetchAll();
        
        // Fetch lines for all invoices
        $lineStmt = $pdo->prepare("SELECT * FROM SalesInvoiceLine WHERE invoiceId IN (SELECT id FROM SalesInvoice WHERE companyId = ?)");
        $lineStmt->execute([$companyId]);
        $allLines = $lineStmt->fetchAll();
        
        $linesByInvoice = [];
        foreach ($allLines as $line) {
            $line['quantity'] = (float)$line['quantity'];
            $line['unitPrice'] = (float)$line['unitPrice'];
            $line['amount'] = (float)$line['amount'];
            $line['taxRate'] = (float)$line['taxRate'];
            $linesByInvoice[$line['invoiceId']][] = $line;
        }
        
        foreach ($invoices as &$inv) {
            $inv['subtotal'] = (float)$inv['subtotal'];
            $inv['taxAmount'] = (float)$inv['taxAmount'];
            $inv['totalAmount'] = (float)$inv['totalAmount'];
            $inv['issueDate'] = substr($inv['issueDate'], 0, 10);
            $inv['dueDate'] = substr($inv['dueDate'], 0, 10);
            $inv['customer'] = ["id" => $inv['customerId'], "name" => $inv['customer_name'], "email" => $inv['customer_email']];
            $inv['lines'] = $linesByInvoice[$inv['id']] ?? [];
        }
        jsonResponse($invoices);
        break;

    // Remaining endpoints (updateInvoiceStatus, getCustomerStatement, etc) are stubbed for simplicity
    default:
        jsonResponse(["error" => "Action not implemented yet in PHP prototype"], 501);
}
?>
