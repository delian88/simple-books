<?php require "api/db.php"; $companyId = "someid"; 
try { 
  $bals = $pdo->prepare("SELECT l.account_id as id, SUM(l.debit) as debit, SUM(l.credit) as credit, a.name, a.type, a.sub_type 
                               FROM journal_lines l 
                               JOIN journal_entries e ON l.journal_entry_id = e.id 
                               JOIN accounts a ON l.account_id = a.id
                               WHERE e.company_id = ? 
                               GROUP BY l.account_id");
  $bals->execute([$companyId]); echo "Q1 OK\n";
  $siSum = $pdo->prepare("SELECT SUM(total_amount) as sum FROM sales_invoices WHERE company_id = ? AND status != 'DRAFT'");
  $siSum->execute([$companyId]); echo "Q2 OK\n";
  $aiExpSum = $pdo->prepare("SELECT e.category, e.bank_account_id, a.name as bank_name, SUM(e.amount) as sum 
                                   FROM expenses e 
                                   LEFT JOIN accounts a ON e.bank_account_id = a.id 
                                   WHERE e.company_id = ? 
                                   GROUP BY e.category, e.bank_account_id, a.name");
  $aiExpSum->execute([$companyId]); echo "Q3 OK\n";
  $txSum = $pdo->prepare("SELECT t.direction, t.category, t.category_id as bank_account_id, a.name as bank_name, SUM(t.amount) as sum 
                                FROM transactions t 
                                LEFT JOIN accounts a ON t.category_id = a.id 
                                WHERE t.company_id = ? 
                                GROUP BY t.direction, t.category, t.category_id, a.name");
  $txSum->execute([$companyId]); echo "Q4 OK\n";
} catch(Exception $e) { echo $e->getMessage(); } 
