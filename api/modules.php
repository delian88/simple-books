<?php
// modules.php - ProfitBooks-style modules.
// Document store (pb_records) for estimates, vendors, purchase orders, products, warehouses,
// stock movements, bank rules, bank statement lines, recurring invoices, credit/debit notes,
// reminder log and audit trail, plus workflow actions:
//   convertEstimate, runRecurring, importBankLines, confirmLine, applyCreditNote,
//   sendReminders, portalLink, listMembers/inviteMember/updateMemberRole/removeMember.
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

const PB_TYPES = ['estimate', 'vendor', 'purchase_order', 'product', 'warehouse', 'stock_move',
                  'bank_rule', 'bank_line', 'recurring', 'credit_note', 'reminder', 'audit'];

function pbBody() {
    if (isset($GLOBALS['PB_TEST_BODY'])) return $GLOBALS['PB_TEST_BODY'];
    return json_decode(file_get_contents('php://input'), true) ?? [];
}
function pbType($t) {
    if (!in_array($t, PB_TYPES, true)) jsonResponse(['error' => 'Invalid type'], 400);
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
        if (!$ws) return 0;
        $warehouseId = $ws[0]['id'];
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
            $po = pbGet($pdo, $companyId, 'purchase_order', $line['match_id']);
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

    default:
        jsonResponse(['error' => 'Unknown action'], 400);
}
?>
