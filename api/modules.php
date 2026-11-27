<?php
// modules.php - Comprehensive ProfitBooks application modules and workflow engine.
// Document store (pb_records) + accounting integration for:
//   Income: estimates, sales orders, recurring invoices, receipts, credit notes
//   Expenses: purchase orders, stock purchases, vendor payments, vendors
//   Banking: bank accounts, bank statement lines, bank rules
//   Accounting: taxes, simple double-entry accounting, reimbursements, projects, audit trail
//   Items: products, warehouses, stock adjustments & movements
//   Employees: employees, payroll runs, leave requests
//   Reports: specialized sales, expense, inventory, transaction and payroll analytics
require_once 'db.php';
define('AUTH_AS_LIB', true);
require_once 'auth.php';

$userId    = requireAuth();
$companyId = getActiveCompanyId($pdo, $userId);
$action    = $_GET['action'] ?? '';

// Create the table on first use (cheap probe on every later request)
try {
    $pdo->query("SELECT 1 FROM pb_records LIMIT 1");
} catch (Exception $e) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS pb_records (
        id VARCHAR(32) PRIMARY KEY,
        company_id VARCHAR(64) NOT NULL,
        type VARCHAR(32) NOT NULL,
        data LONGTEXT,
        created_by VARCHAR(64),
        created_at DATETIME,
        updated_at DATETIME
    )");
    try { $pdo->exec("CREATE INDEX idx_pb_company_type ON pb_records (company_id, type)"); } catch (Exception $e2) {}
}

const PB_TYPES = [
    'estimate', 'vendor', 'purchase_order', 'product', 'warehouse', 'stock_move',
    'bank_rule', 'bank_line', 'recurring', 'credit_note', 'reminder', 'audit',
    'sales_order', 'receipt', 'stock_purchase', 'vendor_payment', 'bank_account',
    'tax_rate', 'simple_entry', 'reimbursement', 'project', 'employee',
    'payroll_run', 'leave_request'
];

function pbBody() {
    if (isset($GLOBALS['PB_TEST_BODY'])) return $GLOBALS['PB_TEST_BODY'];
    return json_decode(file_get_contents('php://input'), true) ?? [];
}
function pbType($t) {
    if (!in_array($t, PB_TYPES, true)) jsonResponse(['error' => "Invalid type: $t"], 400);
    return $t;
}
function pbId() { return bin2hex(random_bytes(9)); }
function pbAudit($pdo, $companyId, $userId, $text) {
    $now = date('Y-m-d H:i:s');
    $pdo->prepare("INSERT INTO pb_records (id, company_id, type, data, created_by, created_at, updated_at) VALUES (?, ?, 'audit', ?, ?, ?, ?)")
        ->execute([pbId(), $companyId, json_encode(['text' => $text, 'user_id' => $userId]), $userId, $now, $now]);
}
function pbRow($r) {
    $d = json_decode($r['data'] ?? '{}', true) ?: [];
    return array_merge($d, ['id' => $r['id'], 'created_at' => $r['created_at'], 'created_by' => $r['created_by']]);
}
function pbGet($pdo, $companyId, $type, $id) {
    $s = $pdo->prepare("SELECT * FROM pb_records WHERE id = ? AND company_id = ? AND type = ?");
    $s->execute([$id, $companyId, $type]);
    $r = $s->fetch();
    return $r ? pbRow($r) : null;
}
function pbInsert($pdo, $companyId, $userId, $type, $data) {
    $now = date('Y-m-d H:i:s');
    $id  = pbId();
    $pdo->prepare("INSERT INTO pb_records (id, company_id, type, data, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
        ->execute([$id, $companyId, $type, json_encode($data), $userId, $now, $now]);
    return $id;
}
function pbUpdate($pdo, $companyId, $id, $data) {
    unset($data['id'], $data['created_at'], $data['created_by']);
    $pdo->prepare("UPDATE pb_records SET data = ?, updated_at = ? WHERE id = ? AND company_id = ?")
        ->execute([json_encode($data), date('Y-m-d H:i:s'), $id, $companyId]);
}
function pbList($pdo, $companyId, $type) {
    $s = $pdo->prepare("SELECT * FROM pb_records WHERE company_id = ? AND type = ? ORDER BY created_at DESC LIMIT 1000");
    $s->execute([$companyId, $type]);
    return array_map('pbRow', $s->fetchAll());
}
function pbTotals($lines) {
    $sub = 0; $tax = 0;
    foreach ($lines as $l) {
        $amt = isset($l['amount']) ? (float)$l['amount'] : (float)($l['quantity'] ?? 1) * (float)($l['unit_price'] ?? 0);
        $sub += $amt;
        $tax += $amt * ((float)($l['tax_rate'] ?? 0) / 100);
    }
    return [$sub, $tax];
}
function pbPostStock($pdo, $companyId, $userId, $lines, $sign, $kind, $note, $warehouseId = '') {
    if (!$lines) return 0;
    if (!$warehouseId) {
        $ws = pbList($pdo, $companyId, 'warehouse');
        if ($ws) {
            $warehouseId = $ws[0]['id'];
        }
    }
    $posted = 0;
    foreach ($lines as $l) {
        $pid = $l['product_id'] ?? '';
        $qty = abs((float)($l['quantity'] ?? 0));
        if ($pid && $qty > 0) {
            pbInsert($pdo, $companyId, $userId, 'stock_move', [
                'product_id'   => $pid,
                'warehouse_id' => $l['warehouse_id'] ?? $warehouseId,
                'qty'          => $sign * $qty,
                'kind'         => $kind,
                'note'         => $note,
                'date'         => date('Y-m-d'),
            ]);
            $posted++;
        }
    }
    return $posted;
}
function pbCreateInvoice($pdo, $companyId, $customerId, $lines, $issue, $due, $notes, $userId = '') {
    [$sub, $tax] = pbTotals($lines);
    $invId  = pbId();
    $now    = date('Y-m-d H:i:s');
    $number = 'INV-' . strtoupper(bin2hex(random_bytes(3)));
    $pdo->prepare("INSERT INTO sales_invoices (id, company_id, customer_id, invoice_number, issue_date, due_date, status, subtotal, tax_amount, total_amount, notes, terms, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?, ?, ?, ?, ?, ?)")
        ->execute([$invId, $companyId, $customerId, $number, $issue, $due, $sub, $tax, $sub + $tax, $notes, null, $now, $now]);
    foreach ($lines as $l) {
        $q = (float)($l['quantity'] ?? 1); $p = (float)($l['unit_price'] ?? 0);
        $pdo->prepare("INSERT INTO sales_invoice_lines (id, invoice_id, description, quantity, unit_price, amount, tax_rate, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
            ->execute([pbId(), $invId, $l['description'] ?? '', $q, $p, $l['amount'] ?? ($q * $p), $l['tax_rate'] ?? 0, $now]);
    }
    if ($userId) {
        pbPostStock($pdo, $companyId, $userId, $lines, -1, 'sale', "Invoice $number");
    }
    return [$invId, $number];
}
function pbNextDate($date, $freq) {
    $step = ['WEEKLY' => '+1 week', 'MONTHLY' => '+1 month', 'QUARTERLY' => '+3 months', 'YEARLY' => '+1 year'][$freq] ?? '+1 month';
    return date('Y-m-d', strtotime($step, strtotime($date)));
}
function pbPortalToken($companyId, $customerId) {
    $payload = b64url_encode($companyId . '|' . $customerId);
    return $payload . '.' . b64url_encode(hash_hmac('sha256', $payload, JWT_SECRET, true));
}
function pbMemberRole($pdo, $companyId, $userId) {
    $s = $pdo->prepare("SELECT role FROM company_users WHERE user_id = ? AND company_id = ? LIMIT 1");
    $s->execute([$userId, $companyId]);
    $r = $s->fetch();
    return $r['role'] ?? '';
}

$body = pbBody();

switch ($action) {

    // ── generic document store ────────────────────────────────────────────
    case 'list':
        jsonResponse(pbList($pdo, $companyId, pbType($_GET['type'] ?? '')));
        break;

    case 'save':
        $type = pbType($body['type'] ?? '');
        $data = $body['data'] ?? [];
        $id   = $body['id'] ?? '';

        // When a purchase order moves to RECEIVED or BILLED, post stock additions once
        if ($type === 'purchase_order' && in_array($data['status'] ?? '', ['RECEIVED', 'BILLED'], true) && empty($data['stock_posted'])) {
            $posted = pbPostStock($pdo, $companyId, $userId, $data['lines'] ?? [], 1, 'purchase', 'PO ' . ($data['number'] ?? $id));
            if ($posted > 0) $data['stock_posted'] = true;
        }

        // When a stock purchase is created or received, post stock addition
        if ($type === 'stock_purchase' && empty($data['stock_posted']) && !empty($data['lines'])) {
            $posted = pbPostStock($pdo, $companyId, $userId, $data['lines'] ?? [], 1, 'stock_purchase', 'Bill ' . ($data['number'] ?? $id));
            if ($posted > 0) $data['stock_posted'] = true;
        }

        if ($id) {
            pbUpdate($pdo, $companyId, $id, $data);
            if ($type !== 'stock_move') pbAudit($pdo, $companyId, $userId, "Updated $type " . ($data['name'] ?? $data['number'] ?? $id));
        } else {
            $id = pbInsert($pdo, $companyId, $userId, $type, $data);
            pbAudit($pdo, $companyId, $userId, "Created $type " . ($data['name'] ?? $data['number'] ?? $id));
        }
        jsonResponse(['ok' => true, 'id' => $id]);
        break;

    case 'delete':
        $type = pbType($body['type'] ?? '');
        $pdo->prepare("DELETE FROM pb_records WHERE id = ? AND company_id = ? AND type = ?")
            ->execute([$body['id'] ?? '', $companyId, $type]);
        pbAudit($pdo, $companyId, $userId, "Deleted $type " . ($body['id'] ?? ''));
        jsonResponse(['ok' => true]);
        break;

    // ── estimate -> invoice ───────────────────────────────────────────────
    case 'convertEstimate':
        $est = pbGet($pdo, $companyId, 'estimate', $body['id'] ?? '');
        if (!$est) jsonResponse(['error' => 'Estimate not found'], 404);
        if (empty($est['customer_id'])) jsonResponse(['error' => 'Estimate has no customer'], 400);
        [, $number] = pbCreateInvoice($pdo, $companyId, $est['customer_id'], $est['lines'] ?? [], date('Y-m-d'),
            $est['valid_until'] ?: date('Y-m-d', strtotime('+15 days')), $est['notes'] ?? null, $userId);
        $est['status'] = 'CONVERTED';
        $est['invoice_number'] = $number;
        pbUpdate($pdo, $companyId, $est['id'], $est);
        pbAudit($pdo, $companyId, $userId, "Converted estimate " . ($est['number'] ?? '') . " to invoice $number");
        jsonResponse(['ok' => true, 'invoice_number' => $number]);
        break;

    // ── sales order -> invoice ────────────────────────────────────────────
    case 'convertSalesOrder':
        $so = pbGet($pdo, $companyId, 'sales_order', $body['id'] ?? '');
        if (!$so) jsonResponse(['error' => 'Sales Order not found'], 404);
        if (empty($so['customer_id'])) jsonResponse(['error' => 'Sales Order has no customer'], 400);
        [, $number] = pbCreateInvoice($pdo, $companyId, $so['customer_id'], $so['lines'] ?? [], date('Y-m-d'),
            $so['delivery_date'] ?: date('Y-m-d', strtotime('+30 days')), $so['notes'] ?? null, $userId);
        $so['status'] = 'INVOICED';
        $so['invoice_number'] = $number;
        pbUpdate($pdo, $companyId, $so['id'], $so);
        pbAudit($pdo, $companyId, $userId, "Converted sales order " . ($so['number'] ?? '') . " to invoice $number");
        jsonResponse(['ok' => true, 'invoice_number' => $number]);
        break;

    // ── record receipt (customer payment) ──────────────────────────────────
    case 'recordReceipt':
        $data = $body['data'] ?? $body;
        $customerId = $data['customer_id'] ?? '';
        $invoiceId  = $data['invoice_id'] ?? '';
        $amount     = (float)($data['amount'] ?? 0);
        $date       = $data['date'] ?? date('Y-m-d');
        $method     = $data['payment_method'] ?? 'BANK_TRANSFER';
        $reference  = $data['reference'] ?? ('RCP-' . strtoupper(bin2hex(random_bytes(3))));
        $notes      = $data['notes'] ?? '';

        if ($amount <= 0) jsonResponse(['error' => 'Amount must be greater than zero'], 400);

        $now = date('Y-m-d H:i:s');
        $payId = pbId();

        // If linked to an invoice, update invoice status
        if ($invoiceId) {
            $st = $pdo->prepare("SELECT id, total_amount, customer_id FROM sales_invoices WHERE id = ? AND company_id = ?");
            $st->execute([$invoiceId, $companyId]);
            $inv = $st->fetch();
            if ($inv) {
                if (!$customerId) $customerId = $inv['customer_id'];
                // Check past payments
                $pSum = $pdo->prepare("SELECT SUM(amount) FROM customer_payments WHERE company_id = ? AND reference LIKE ?");
                $pSum->execute([$companyId, "%{$inv['id']}%"]);
                $paidSoFar = (float)($pSum->fetchColumn() ?: 0) + $amount;
                $newStatus = ($paidSoFar >= (float)$inv['total_amount'] - 0.01) ? 'PAID' : 'PARTIALLY_PAID';

                $pdo->prepare("UPDATE sales_invoices SET status = ?, updated_at = ? WHERE id = ? AND company_id = ?")
                    ->execute([$newStatus, $now, $invoiceId, $companyId]);
            }
        }

        // Insert customer_payments row
        $pdo->prepare("INSERT INTO customer_payments (id, company_id, customer_id, date, amount, reference, payment_method, status, notes, created_at, updated_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?, ?)")
            ->execute([$payId, $companyId, $customerId ?: null, $date, $amount, $reference, $method, $notes, $now, $now]);

        // Insert double-entry transaction record (Money In)
        $pdo->prepare("INSERT INTO transactions (id, user_id, company_id, created_by, direction, category, category_id, amount, occurred_on, counterparty, note, source, created_at)
                       VALUES (?, ?, ?, ?, 'inflow', 'Sales Receipt', NULL, ?, ?, ?, ?, 'receipt', ?)")
            ->execute([pbId(), $userId, $companyId, $userId, $amount, $date, $data['customer_name'] ?? 'Customer', $reference . ': ' . $notes, $now]);

        // Save in pb_records as receipt
        $rcpId = pbInsert($pdo, $companyId, $userId, 'receipt', [
            'number'         => $reference,
            'customer_id'    => $customerId,
            'customer_name'  => $data['customer_name'] ?? '',
            'invoice_id'     => $invoiceId,
            'amount'         => $amount,
            'date'           => $date,
            'payment_method' => $method,
            'notes'          => $notes,
            'status'         => 'COMPLETED'
        ]);

        pbAudit($pdo, $companyId, $userId, "Recorded receipt $reference for " . number_format($amount, 2));
        jsonResponse(['ok' => true, 'id' => $rcpId, 'reference' => $reference]);
        break;

    // ── record vendor payment ──────────────────────────────────────────────
    case 'recordVendorPayment':
        $data = $body['data'] ?? $body;
        $vendorId = $data['vendor_id'] ?? '';
        $poId     = $data['purchase_order_id'] ?? '';
        $amount   = (float)($data['amount'] ?? 0);
        $date     = $data['date'] ?? date('Y-m-d');
        $method   = $data['payment_method'] ?? 'BANK_TRANSFER';
        $reference = $data['reference'] ?? ('VPAY-' . strtoupper(bin2hex(random_bytes(3))));
        $notes    = $data['notes'] ?? '';

        if ($amount <= 0) jsonResponse(['error' => 'Amount must be greater than zero'], 400);
        $now = date('Y-m-d H:i:s');

        // If linked to a purchase order or stock purchase, update status
        if ($poId) {
            $po = pbGet($pdo, $companyId, 'purchase_order', $poId) ?: pbGet($pdo, $companyId, 'stock_purchase', $poId);
            if ($po) {
                $po['status'] = 'PAID';
                $po['paid_amount'] = $amount;
                pbUpdate($pdo, $companyId, $po['id'], $po);
            }
        }

        // Insert double-entry transaction record (Money Out)
        $pdo->prepare("INSERT INTO transactions (id, user_id, company_id, created_by, direction, category, category_id, amount, occurred_on, counterparty, note, source, created_at)
                       VALUES (?, ?, ?, ?, 'outflow', 'Vendor Payment', NULL, ?, ?, ?, ?, 'vendor_payment', ?)")
            ->execute([pbId(), $userId, $companyId, $userId, $amount, $date, $data['vendor_name'] ?? 'Vendor', $reference . ': ' . $notes, $now]);

        // Save in pb_records as vendor_payment
        $vpId = pbInsert($pdo, $companyId, $userId, 'vendor_payment', [
            'number'            => $reference,
            'vendor_id'         => $vendorId,
            'vendor_name'       => $data['vendor_name'] ?? '',
            'purchase_order_id' => $poId,
            'amount'            => $amount,
            'date'              => $date,
            'payment_method'    => $method,
            'notes'             => $notes,
            'status'            => 'COMPLETED'
        ]);

        pbAudit($pdo, $companyId, $userId, "Recorded vendor payment $reference for " . number_format($amount, 2));
        jsonResponse(['ok' => true, 'id' => $vpId, 'reference' => $reference]);
        break;

    // ── simple double-entry accounting entry ───────────────────────────────
    case 'postSimpleEntry':
        $data = $body['data'] ?? $body;
        $debitAccId  = $data['debit_account_id'] ?? '';
        $creditAccId = $data['credit_account_id'] ?? '';
        $amount      = (float)($data['amount'] ?? 0);
        $date        = $data['date'] ?? date('Y-m-d');
        $desc        = $data['description'] ?? 'Simple entry';
        $ref         = $data['reference'] ?? ('JV-' . strtoupper(bin2hex(random_bytes(3))));

        if ($amount <= 0) jsonResponse(['error' => 'Amount must be greater than zero'], 400);
        if (!$debitAccId || !$creditAccId) jsonResponse(['error' => 'Both Debit and Credit accounts are required'], 400);
        if ($debitAccId === $creditAccId) jsonResponse(['error' => 'Debit and Credit accounts must be different'], 400);

        // Verify accounts belong to company
        $check = $pdo->prepare("SELECT id, name FROM accounts WHERE id IN (?, ?) AND company_id = ?");
        $check->execute([$debitAccId, $creditAccId, $companyId]);
        if (count($check->fetchAll()) < 2) jsonResponse(['error' => 'Selected accounts are invalid or not found'], 400);

        $now  = date('Y-m-d H:i:s');
        $jeId = pbId();

        $pdo->beginTransaction();
        try {
            $pdo->prepare("INSERT INTO journal_entries (id, company_id, date, description, reference, status, created_at, updated_at)
                           VALUES (?, ?, ?, ?, ?, 'POSTED', ?, ?)")
                ->execute([$jeId, $companyId, $date, $desc, $ref, $now, $now]);

            $lStmt = $pdo->prepare("INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit, created_at)
                                    VALUES (?, ?, ?, ?, ?, ?)");
            // Line 1: Debit
            $lStmt->execute([pbId(), $jeId, $debitAccId, $amount, 0, $now]);
            // Line 2: Credit
            $lStmt->execute([pbId(), $jeId, $creditAccId, 0, $amount, $now]);

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Failed to post entry: ' . $e->getMessage()], 500);
        }

        // Save simple_entry record
        pbInsert($pdo, $companyId, $userId, 'simple_entry', [
            'journal_entry_id'  => $jeId,
            'reference'         => $ref,
            'date'              => $date,
            'debit_account_id'  => $debitAccId,
            'credit_account_id' => $creditAccId,
            'amount'            => $amount,
            'description'       => $desc,
        ]);

        pbAudit($pdo, $companyId, $userId, "Posted simple accounting entry $ref for " . number_format($amount, 2));
        jsonResponse(['ok' => true, 'id' => $jeId, 'reference' => $ref]);
        break;

    // ── run payroll ────────────────────────────────────────────────────────
    case 'runPayroll':
        $data  = $body['data'] ?? $body;
        $month = $data['month'] ?? date('Y-m');
        $pDate = $data['payment_date'] ?? date('Y-m-d');
        $notes = $data['notes'] ?? "Payroll for $month";

        $employees = pbList($pdo, $companyId, 'employee');
        if (!$employees) jsonResponse(['error' => 'No employees found. Add employees first.'], 400);

        $items = [];
        $totalBasic = 0; $totalAllowances = 0; $totalDeductions = 0; $totalNet = 0;

        foreach ($employees as $emp) {
            if (($emp['status'] ?? 'ACTIVE') !== 'ACTIVE') continue;
            $basic = (float)($emp['basic_salary'] ?? $emp['salary'] ?? 0);
            $allow = (float)($emp['allowances'] ?? 0);
            $ded   = (float)($emp['deductions'] ?? 0);
            $net   = max(0, $basic + $allow - $ded);

            $items[] = [
                'employee_id'   => $emp['id'],
                'employee_name' => ($emp['first_name'] ?? '') . ' ' . ($emp['last_name'] ?? $emp['name'] ?? ''),
                'department'    => $emp['department'] ?? 'General',
                'bank_name'     => $emp['bank_name'] ?? '',
                'account_no'    => $emp['account_number'] ?? '',
                'basic'         => $basic,
                'allowances'    => $allow,
                'deductions'    => $ded,
                'net'           => $net
            ];

            $totalBasic      += $basic;
            $totalAllowances += $allow;
            $totalDeductions += $ded;
            $totalNet        += $net;
        }

        if (!$items) jsonResponse(['error' => 'No active employees to process'], 400);

        $ref = 'PAY-' . str_replace('-', '', $month) . '-' . strtoupper(bin2hex(random_bytes(2)));
        $now = date('Y-m-d H:i:s');

        // Record Salary Expense Transaction (Money Out)
        if ($totalNet > 0) {
            $pdo->prepare("INSERT INTO transactions (id, user_id, company_id, created_by, direction, category, category_id, amount, occurred_on, counterparty, note, source, created_at)
                           VALUES (?, ?, ?, ?, 'outflow', 'Salaries & Wages', NULL, ?, ?, 'Staff Payroll', ?, 'payroll', ?)")
                ->execute([pbId(), $userId, $companyId, $userId, $totalNet, $pDate, "$notes (Ref: $ref)", $now]);
        }

        $runId = pbInsert($pdo, $companyId, $userId, 'payroll_run', [
            'reference'        => $ref,
            'month'            => $month,
            'payment_date'     => $pDate,
            'employee_count'   => count($items),
            'total_basic'      => $totalBasic,
            'total_allowances' => $totalAllowances,
            'total_deductions' => $totalDeductions,
            'total_net'        => $totalNet,
            'items'            => $items,
            'status'           => 'COMPLETED',
            'notes'            => $notes
        ]);

        pbAudit($pdo, $companyId, $userId, "Processed payroll $ref for " . count($items) . " employee(s) totaling " . number_format($totalNet, 2));
        jsonResponse(['ok' => true, 'id' => $runId, 'reference' => $ref, 'total_net' => $totalNet, 'count' => count($items)]);
        break;

    // ── recurring invoices ────────────────────────────────────────────────
    case 'runRecurring':
        $today = date('Y-m-d');
        $created = [];
        foreach (pbList($pdo, $companyId, 'recurring') as $r) {
            if (($r['status'] ?? 'ACTIVE') !== 'ACTIVE' || empty($r['customer_id']) || empty($r['next_date'])) continue;
            $guard = 0;
            while ($r['next_date'] <= $today && $guard++ < 12) {
                if (!empty($r['end_date']) && $r['next_date'] > $r['end_date']) { $r['status'] = 'ENDED'; break; }
                [, $number] = pbCreateInvoice($pdo, $companyId, $r['customer_id'], $r['lines'] ?? [], $r['next_date'],
                    date('Y-m-d', strtotime('+' . (int)($r['due_days'] ?? 14) . ' days', strtotime($r['next_date']))), $r['notes'] ?? null, $userId);
                $created[] = $number;
                $r['next_date'] = pbNextDate($r['next_date'], $r['frequency'] ?? 'MONTHLY');
                $r['last_invoice'] = $number;
            }
            pbUpdate($pdo, $companyId, $r['id'], $r);
        }
        if ($created) pbAudit($pdo, $companyId, $userId, "Recurring run created " . count($created) . " invoice(s)");
        jsonResponse(['ok' => true, 'created' => count($created), 'invoices' => $created]);
        break;

    // ── bank reconciliation ───────────────────────────────────────────────
    case 'importBankLines':
        $lines = $body['lines'] ?? [];
        $rules = pbList($pdo, $companyId, 'bank_rule');

        $st = $pdo->prepare("SELECT id, invoice_number, total_amount FROM sales_invoices WHERE company_id = ? AND status NOT IN ('PAID','CANCELLED')");
        $st->execute([$companyId]);
        $invoices = $st->fetchAll();
        $pos = array_values(array_filter(pbList($pdo, $companyId, 'purchase_order'),
            fn($p) => in_array($p['status'] ?? '', ['RECEIVED', 'BILLED'], true)));
        $usedInv = []; $usedPo = [];
        $counts = ['matched' => 0, 'categorised' => 0, 'review' => 0];

        foreach ($lines as $ln) {
            $amount = abs((float)($ln['amount'] ?? 0));
            $dir    = ($ln['direction'] ?? '') === 'inflow' ? 'inflow' : 'outflow';
            $narr   = (string)($ln['narration'] ?? '');
            $rec = ['date' => $ln['date'] ?? date('Y-m-d'), 'narration' => $narr, 'amount' => $amount,
                    'direction' => $dir, 'status' => 'review', 'category' => '', 'match_type' => '', 'match_id' => '', 'match_ref' => ''];

            if ($dir === 'inflow') {
                foreach ($invoices as $inv) {
                    if (!isset($usedInv[$inv['id']]) && abs((float)$inv['total_amount'] - $amount) < 0.005) {
                        $usedInv[$inv['id']] = true;
                        $rec['match_type'] = 'invoice'; $rec['match_id'] = $inv['id']; $rec['match_ref'] = 'Payment for ' . $inv['invoice_number'];
                        $rec['status'] = 'matched';
                        break;
                    }
                }
            } else {
                foreach ($pos as $po) {
                    if (!isset($usedPo[$po['id']]) && abs((float)($po['total_amount'] ?? 0) - $amount) < 0.005) {
                        $usedPo[$po['id']] = true;
                        $rec['match_type'] = 'bill'; $rec['match_id'] = $po['id']; $rec['match_ref'] = 'Bill ' . ($po['number'] ?? '');
                        $rec['status'] = 'matched';
                        break;
                    }
                }
            }
            if ($rec['status'] !== 'matched') {
                foreach ($rules as $rule) {
                    if (!empty($rule['contains']) && stripos($narr, $rule['contains']) !== false
                        && (empty($rule['direction']) || $rule['direction'] === $dir)) {
                        $rec['category'] = $rule['category'] ?? '';
                        $rec['status'] = 'categorised';
                        break;
                    }
                }
            }
            $counts[$rec['status']]++;
            pbInsert($pdo, $companyId, $userId, 'bank_line', $rec);
        }
        pbAudit($pdo, $companyId, $userId, "Imported " . count($lines) . " bank statement line(s)");
        jsonResponse(['ok' => true] + $counts);
        break;

    case 'confirmLine':
        $line = pbGet($pdo, $companyId, 'bank_line', $body['id'] ?? '');
        if (!$line) jsonResponse(['error' => 'Line not found'], 404);
        if (($line['status'] ?? '') === 'reconciled') jsonResponse(['ok' => true]);
        $now = date('Y-m-d H:i:s');

        if (($line['match_type'] ?? '') === 'invoice') {
            $s = $pdo->prepare("SELECT customer_id FROM sales_invoices WHERE id = ? AND company_id = ?");
            $s->execute([$line['match_id'], $companyId]);
            $inv = $s->fetch();
            if ($inv) {
                $pdo->prepare("UPDATE sales_invoices SET status = 'PAID', updated_at = ? WHERE id = ? AND company_id = ?")
                    ->execute([$now, $line['match_id'], $companyId]);
                $pdo->prepare("INSERT INTO customer_payments (id, company_id, customer_id, date, amount, reference, payment_method, status, notes, created_at, updated_at)
                               VALUES (?, ?, ?, ?, ?, ?, 'BANK_TRANSFER', 'COMPLETED', ?, ?, ?)")
                    ->execute([pbId(), $companyId, $inv['customer_id'], $line['date'], $line['amount'], $line['match_ref'], 'Reconciled from bank statement', $now, $now]);
            }
        } elseif (($line['match_type'] ?? '') === 'bill') {
            $po = pbGet($pdo, $companyId, 'purchase_order', $line['match_id']) ?: pbGet($pdo, $companyId, 'stock_purchase', $line['match_id']);
            if ($po) { $po['status'] = 'PAID'; pbUpdate($pdo, $companyId, $po['id'], $po); }
        } else {
            $category = trim($body['category'] ?? '') ?: ($line['category'] ?? '');
            if ($category === '') jsonResponse(['error' => 'Choose a category first'], 400);
            $pdo->prepare("INSERT INTO transactions (id, user_id, company_id, created_by, direction, category, category_id, amount, occurred_on, counterparty, note, source, created_at)
                           VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, 'bank', ?)")
                ->execute([pbId(), $userId, $companyId, $userId, $line['direction'], $category, $line['amount'], $line['date'], $line['narration'], 'Bank reconciliation', $now]);
            $line['category'] = $category;
        }
        $line['status'] = 'reconciled';
        pbUpdate($pdo, $companyId, $line['id'], $line);
        pbAudit($pdo, $companyId, $userId, "Reconciled bank line: " . $line['narration']);
        jsonResponse(['ok' => true]);
        break;

    // ── credit / debit notes ──────────────────────────────────────────────
    case 'applyCreditNote':
        $note = pbGet($pdo, $companyId, 'credit_note', $body['id'] ?? '');
        if (!$note) jsonResponse(['error' => 'Note not found'], 404);
        if (($note['status'] ?? '') === 'APPLIED') jsonResponse(['error' => 'Already applied'], 400);
        if (empty($note['invoice_id'])) jsonResponse(['error' => 'Link the note to an invoice first'], 400);
        $s = $pdo->prepare("SELECT total_amount FROM sales_invoices WHERE id = ? AND company_id = ?");
        $s->execute([$note['invoice_id'], $companyId]);
        $inv = $s->fetch();
        if (!$inv) jsonResponse(['error' => 'Invoice not found'], 404);
        $amount = (float)($note['amount'] ?? 0);
        $total  = (float)$inv['total_amount'];
        $total  = ($note['kind'] ?? 'CREDIT') === 'DEBIT' ? $total + $amount : max(0, $total - $amount);
        $pdo->prepare("UPDATE sales_invoices SET total_amount = ?, updated_at = ? WHERE id = ? AND company_id = ?")
            ->execute([$total, date('Y-m-d H:i:s'), $note['invoice_id'], $companyId]);
        $note['status'] = 'APPLIED';
        pbUpdate($pdo, $companyId, $note['id'], $note);
        pbAudit($pdo, $companyId, $userId, "Applied " . strtolower($note['kind'] ?? 'credit') . " note " . ($note['number'] ?? ''));
        jsonResponse(['ok' => true, 'new_total' => $total]);
        break;

    // ── payment reminders ─────────────────────────────────────────────────
    case 'sendReminders':
        $s = $pdo->prepare("SELECT i.id, i.invoice_number, i.total_amount, i.due_date, c.name AS customer_name, c.email
                            FROM sales_invoices i JOIN customers c ON c.id = i.customer_id
                            WHERE i.company_id = ? AND i.status NOT IN ('PAID','CANCELLED') AND i.due_date < ?");
        $s->execute([$companyId, date('Y-m-d')]);
        $overdue = $s->fetchAll();
        $recent = [];
        foreach (pbList($pdo, $companyId, 'reminder') as $r) {
            if (($r['date'] ?? '') >= date('Y-m-d', strtotime('-7 days'))) $recent[$r['invoice_id'] ?? ''] = true;
        }
        $logged = 0; $emailed = 0;
        foreach ($overdue as $inv) {
            if (isset($recent[$inv['id']])) continue;
            $sent = false;
            if (!empty($inv['email']) && filter_var($inv['email'], FILTER_VALIDATE_EMAIL)) {
                $msg = "Hello {$inv['customer_name']},\n\nThis is a friendly reminder that invoice {$inv['invoice_number']} for "
                     . number_format((float)$inv['total_amount'], 2) . " was due on " . substr($inv['due_date'], 0, 10) . ".\n\nThank you.";
                $sent = @mail($inv['email'], "Payment reminder: {$inv['invoice_number']}", $msg);
                if ($sent) $emailed++;
            }
            pbInsert($pdo, $companyId, $userId, 'reminder', [
                'invoice_id' => $inv['id'], 'invoice_number' => $inv['invoice_number'], 'customer' => $inv['customer_name'],
                'email' => $inv['email'] ?? '', 'amount' => (float)$inv['total_amount'], 'emailed' => $sent, 'date' => date('Y-m-d'),
            ]);
            $logged++;
        }
        if ($logged) pbAudit($pdo, $companyId, $userId, "Sent $logged payment reminder(s)");
        jsonResponse(['ok' => true, 'overdue' => count($overdue), 'logged' => $logged, 'emailed' => $emailed]);
        break;

    // ── customer portal link ──────────────────────────────────────────────
    case 'portalLink':
        $cid = $body['customerId'] ?? '';
        $s = $pdo->prepare("SELECT id FROM customers WHERE id = ? AND company_id = ?");
        $s->execute([$cid, $companyId]);
        if (!$s->fetch()) jsonResponse(['error' => 'Customer not found'], 404);
        jsonResponse(['token' => pbPortalToken($companyId, $cid)]);
        break;

    // ── team & access ─────────────────────────────────────────────────────
    case 'listMembers':
        $s = $pdo->prepare("SELECT cu.id, cu.role, cu.status, u.email FROM company_users cu JOIN users u ON u.id = cu.user_id WHERE cu.company_id = ? ORDER BY cu.created_at");
        $s->execute([$companyId]);
        jsonResponse($s->fetchAll());
        break;

    case 'inviteMember':
        if (pbMemberRole($pdo, $companyId, $userId) !== 'OWNER') jsonResponse(['error' => 'Only the owner can invite members'], 403);
        $email = trim($body['email'] ?? '');
        $role  = strtoupper($body['role'] ?? 'ACCOUNTANT');
        $pass  = $body['password'] ?? '';
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonResponse(['error' => 'Invalid email address'], 400);
        if (!in_array($role, ['ACCOUNTANT', 'AUDITOR', 'STAFF'], true)) jsonResponse(['error' => 'Invalid role'], 400);
        if (strlen($pass) < 6) jsonResponse(['error' => 'Temporary password must be at least 6 characters'], 400);
        $c = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
        $c->execute([$email]);
        if ($c->fetch()) jsonResponse(['error' => 'That email already has an account'], 409);
        $now = date('Y-m-d H:i:s');
        $uid = pbId();
        $pdo->prepare("INSERT INTO users (id, email, password, role, created_at, updated_at) VALUES (?, ?, ?, 'Company', ?, ?)")
            ->execute([$uid, $email, password_hash($pass, PASSWORD_BCRYPT), $now, $now]);
        $pdo->prepare("INSERT INTO company_users (id, user_id, company_id, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)")
            ->execute([pbId(), $uid, $companyId, $role, $now, $now]);
        pbAudit($pdo, $companyId, $userId, "Invited $email as $role");
        jsonResponse(['ok' => true]);
        break;

    case 'updateMemberRole':
        if (pbMemberRole($pdo, $companyId, $userId) !== 'OWNER') jsonResponse(['error' => 'Only the owner can change roles'], 403);
        $role = strtoupper($body['role'] ?? '');
        if (!in_array($role, ['ACCOUNTANT', 'AUDITOR', 'STAFF'], true)) jsonResponse(['error' => 'Invalid role'], 400);
        $pdo->prepare("UPDATE company_users SET role = ?, updated_at = ? WHERE id = ? AND company_id = ? AND role <> 'OWNER'")
            ->execute([$role, date('Y-m-d H:i:s'), $body['id'] ?? '', $companyId]);
        pbAudit($pdo, $companyId, $userId, "Changed a member role to $role");
        jsonResponse(['ok' => true]);
        break;

    case 'removeMember':
        if (pbMemberRole($pdo, $companyId, $userId) !== 'OWNER') jsonResponse(['error' => 'Only the owner can remove members'], 403);
        $pdo->prepare("DELETE FROM company_users WHERE id = ? AND company_id = ? AND role <> 'OWNER'")
            ->execute([$body['id'] ?? '', $companyId]);
        pbAudit($pdo, $companyId, $userId, "Removed a team member");
        jsonResponse(['ok' => true]);
        break;

    // ── comprehensive reports data endpoint ───────────────────────────────
    case 'getReportsData':
        // 1. Sales Register & Invoices
        $invStmt = $pdo->prepare("SELECT i.*, c.name as customer_name, c.email as customer_email
                                  FROM sales_invoices i
                                  LEFT JOIN customers c ON c.id = i.customer_id
                                  WHERE i.company_id = ?
                                  ORDER BY i.issue_date DESC");
        $invStmt->execute([$companyId]);
        $invoices = $invStmt->fetchAll(PDO::FETCH_ASSOC);

        // 2. Customer Payments / Receipts
        $payStmt = $pdo->prepare("SELECT cp.*, c.name as customer_name
                                  FROM customer_payments cp
                                  LEFT JOIN customers c ON c.id = cp.customer_id
                                  WHERE cp.company_id = ?
                                  ORDER BY cp.date DESC");
        $payStmt->execute([$companyId]);
        $payments = $payStmt->fetchAll(PDO::FETCH_ASSOC);

        // 3. Purchase Orders & Stock Purchases
        $pos = pbList($pdo, $companyId, 'purchase_order');
        $bills = pbList($pdo, $companyId, 'stock_purchase');
        $vendorPayments = pbList($pdo, $companyId, 'vendor_payment');

        // 4. Products & Inventory Moves
        $products = pbList($pdo, $companyId, 'product');
        $warehouses = pbList($pdo, $companyId, 'warehouse');
        $stockMoves = pbList($pdo, $companyId, 'stock_move');

        // 5. Payroll runs
        $payrollRuns = pbList($pdo, $companyId, 'payroll_run');
        $employees = pbList($pdo, $companyId, 'employee');

        // 6. Expenses
        $expStmt = $pdo->prepare("SELECT * FROM expenses WHERE company_id = ? ORDER BY date DESC");
        $expStmt->execute([$companyId]);
        $expenses = $expStmt->fetchAll(PDO::FETCH_ASSOC);

        // 7. General Transactions (Cash & Bank)
        $txStmt = $pdo->prepare("SELECT * FROM transactions WHERE company_id = ? ORDER BY occurred_on DESC");
        $txStmt->execute([$companyId]);
        $transactions = $txStmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse([
            'invoices'       => $invoices,
            'payments'       => $payments,
            'purchaseOrders' => $pos,
            'bills'          => $bills,
            'vendorPayments' => $vendorPayments,
            'products'       => $products,
            'warehouses'     => $warehouses,
            'stockMoves'     => $stockMoves,
            'payrollRuns'    => $payrollRuns,
            'employees'      => $employees,
            'expenses'       => $expenses,
            'transactions'   => $transactions,
        ]);
        break;

    default:
        jsonResponse(['error' => 'Unknown action'], 400);
}
?>
