<?php
require 'api/db.php';
$stmt = $pdo->query('DESCRIBE transactions');
print_r($stmt->fetchAll(PDO::FETCH_COLUMN));
?>
