<?php require 'public/api/db.php'; print_r($pdo->query('SELECT email, role FROM users')->fetchAll(PDO::FETCH_ASSOC));
