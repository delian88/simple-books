<?php
require_once 'config.php';
$stmt = $pdo->query("SHOW TABLES");
$tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
$schema = [];
foreach ($tables as $table) {
    $stmt = $pdo->query("DESCRIBE $table");
    $schema[$table] = $stmt->fetchAll(PDO::FETCH_ASSOC);
}
header('Content-Type: application/json');
echo json_encode($schema, JSON_PRETTY_PRINT);
?>
