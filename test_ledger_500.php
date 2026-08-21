<?php $_GET["action"]="getTrialBalance"; $_SERVER["REQUEST_METHOD"]="GET"; require "api/db.php"; $companyId = $pdo->query("SELECT id FROM companies LIMIT 1")->fetchColumn(); require "api/ledger.php";
