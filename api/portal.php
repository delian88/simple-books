<?php
// portal.php - PUBLIC read-only customer portal. Access is by signed token (no login).
// GET /api/portal.php?token=...  (token is created by modules.php?action=portalLink)
require_once 'db.php';
define('AUTH_AS_LIB', true);
require_once 'auth.php';

$token = $_GET['token'] ?? '';
$parts = explode('.', $token);
if (count($parts) !== 2) jsonResponse(['error' => 'Invalid link'], 400);
$expected = b64url_encode(hash_hmac('sha256', $parts[0], JWT_SECRET, true));
if (!hash_equals($expected, $parts[1])) jsonResponse(['error' => 'Invalid link'], 403);

$decoded = explode('|', b64url_decode($parts[0]));
if (count($decoded) !== 2) jsonResponse(['error' => 'Invalid link'], 400);
[$companyId, $customerId] = $decoded;

$c = $pdo->prepare("SELECT c.name, c.email, co.name AS company_name FROM customers c JOIN companies co ON co.id = c.company_id WHERE c.id = ? AND c.company_id = ?");
$c->execute([$customerId, $companyId]);
$customer = $c->fetch();
if (!$customer) jsonResponse(['error' => 'Customer not found'], 404);

$i = $pdo->prepare("SELECT id, invoice_number, issue_date, due_date, status, subtotal, tax_amount, total_amount FROM sales_invoices WHERE company_id = ? AND customer_id = ? AND status <> 'CANCELLED' ORDER BY issue_date DESC");
$i->execute([$companyId, $customerId]);
$invoices = $i->fetchAll();
foreach ($invoices as &$inv) {
    $l = $pdo->prepare("SELECT description, quantity, unit_price, amount, tax_rate FROM sales_invoice_lines WHERE invoice_id = ?");
    $l->execute([$inv['id']]);
    $inv['lines'] = $l->fetchAll();
    unset($inv['id']);
}
unset($inv);

jsonResponse(['customer' => ['name' => $customer['name'], 'email' => $customer['email']],
              'company' => $customer['company_name'], 'invoices' => $invoices]);
?>
