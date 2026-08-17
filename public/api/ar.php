<?php
// ar.php - Accounts Receivable
require_once 'db.php';
define('AUTH_AS_LIB', true);
require_once 'auth.php';

$userId    = requireAuth();
$companyId = getActiveCompanyId($pdo, $userId);
$action    = $_GET['action'] ?? '';

switch ($action) {

    // â”€â”€ CUSTOMERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    case 'listCustomers':
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE company_id = ? AND is_archived = 0 ORDER BY name");
        $stmt->execute([$companyId]);
        jsonResponse($stmt->fetchAll());
        break;

    case 'createCustomer':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $id   = bin2hex(random_bytes(9));
        $now  = date('Y-m-d H:i:s');
        $pdo->prepare("INSERT INTO customers (id, company_id, name, email, phone, address, currency, created_at, updated_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
            ->execute([$id, $companyId, $data['name'], $data['email'] ?? null, $data['phone'] ?? null,
                       $data['address'] ?? null, $data['currency'] ?? 'NGN', $now, $now]);
        jsonResponse(['id' => $id]);
        break;

    case 'updateCustomer':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $now  = date('Y-m-d H:i:s');
        $pdo->prepare("UPDATE customers SET name=?, email=?, phone=?, address=?, currency=?, updated_at=? WHERE id=? AND company_id=?")
            ->execute([$data['name'], $data['email'] ?? null, $data['phone'] ?? null,
                       $data['address'] ?? null, $data['currency'] ?? 'NGN', $now, $data['id'], $companyId]);
        jsonResponse(['ok' => true]);
        break;

    // â”€â”€ INVOICES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    case 'listInvoices':
        $stmt = $pdo->prepare(
            "SELECT i.*, c.name as customer_name
             FROM sales_invoices i
             LEFT JOIN customers c ON c.id = i.customer_id
             WHERE i.company_id = ?
             ORDER BY i.issue_date DESC LIMIT 200"
        );
        $stmt->execute([$companyId]);
        $invoices = $stmt->fetchAll();
        // Attach lines
        foreach ($invoices as &$inv) {
            $ls = $pdo->prepare("SELECT * FROM sales_invoice_lines WHERE invoice_id = ?");
            $ls->execute([$inv['id']]);
            $inv['lines'] = $ls->fetchAll();
        }
        jsonResponse($invoices);
        break;

    case 'createSalesInvoice':
        $data  = json_decode(file_get_contents('php://input'), true) ?? [];
        $id    = bin2hex(random_bytes(9));
        $now   = date('Y-m-d H:i:s');
        $lines = $data['lines'] ?? [];
        $subtotal = array_sum(array_column($lines, 'amount'));
        $tax      = array_sum(array_map(fn($l) => ($l['amount'] ?? 0) * (($l['tax_rate'] ?? 0) / 100), $lines));
        $total    = $subtotal + $tax;

        $pdo->prepare("INSERT INTO sales_invoices (id, company_id, customer_id, invoice_number, issue_date, due_date, status, subtotal, tax_amount, total_amount, notes, terms, created_at, updated_at)
                       VALUES (?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?, ?, ?, ?, ?, ?)")
            ->execute([$id, $companyId, $data['customer_id'], $data['invoice_number'] ?? ('INV-' . strtoupper(bin2hex(random_bytes(3)))),
                       $data['issue_date'] ?? $now, $data['due_date'] ?? $now,
                       $subtotal, $tax, $total, $data['notes'] ?? null, $data['terms'] ?? null, $now, $now]);

        foreach ($lines as $line) {
            $lid = bin2hex(random_bytes(9));
            $pdo->prepare("INSERT INTO sales_invoice_lines (id, invoice_id, description, quantity, unit_price, amount, tax_rate, created_at)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
                ->execute([$lid, $id, $line['description'], $line['quantity'] ?? 1, $line['unit_price'] ?? 0, $line['amount'] ?? 0, $line['tax_rate'] ?? 0, $now]);
        }
        jsonResponse(['id' => $id]);
        break;

    case 'updateInvoiceStatus':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $now  = date('Y-m-d H:i:s');
        $pdo->prepare("UPDATE sales_invoices SET status=?, updated_at=? WHERE id=? AND company_id=?")
            ->execute([$data['status'], $now, $data['id'], $companyId]);
        jsonResponse(['ok' => true]);
        break;

    // â”€â”€ PAYMENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    case 'recordCustomerPayment':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $id   = bin2hex(random_bytes(9));
        $now  = date('Y-m-d H:i:s');
        $pdo->prepare("INSERT INTO customer_payments (id, company_id, customer_id, date, amount, reference, payment_method, status, notes, created_at, updated_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?, ?)")
            ->execute([$id, $companyId, $data['customer_id'], $data['date'] ?? $now,
                       $data['amount'], $data['reference'] ?? null, $data['payment_method'] ?? 'BANK_TRANSFER',
                       $data['notes'] ?? null, $now, $now]);
        jsonResponse(['id' => $id]);
        break;

    // â”€â”€ REPORTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    case 'getCustomerStatement':
        $data   = json_decode(file_get_contents('php://input'), true) ?? [];
        $custId = $data['customerId'] ?? '';
        $invoices = $pdo->prepare("SELECT * FROM sales_invoices WHERE company_id=? AND customer_id=? ORDER BY issue_date");
        $invoices->execute([$companyId, $custId]);
        $payments = $pdo->prepare("SELECT * FROM customer_payments WHERE company_id=? AND customer_id=? ORDER BY date");
        $payments->execute([$companyId, $custId]);
        jsonResponse(['invoices' => $invoices->fetchAll(), 'payments' => $payments->fetchAll()]);
        break;

    case 'getAgingReport':
        $stmt = $pdo->prepare(
            "SELECT c.name as customer_name, i.invoice_number, i.issue_date, i.due_date,
                    i.total_amount, i.status,
                    DATEDIFF(NOW(), i.due_date) as days_overdue
             FROM sales_invoices i
             JOIN customers c ON c.id = i.customer_id
             WHERE i.company_id = ? AND i.status NOT IN ('PAID','CANCELLED')
             ORDER BY days_overdue DESC"
        );
        $stmt->execute([$companyId]);
        jsonResponse($stmt->fetchAll());
        break;

    default:
        jsonResponse(['error' => 'Unknown action'], 400);
}
?>
