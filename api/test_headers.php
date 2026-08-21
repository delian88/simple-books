<?php
require_once 'db.php';
$headers = function_exists('apache_request_headers') ? apache_request_headers() : [];
foreach ($_SERVER as $k => $v) {
    if (strpos($k, 'HTTP_') === 0) {
        $key = str_replace('_', '-', ucwords(strtolower(substr($k, 5)), '_'));
        if (!isset($headers[$key])) $headers[$key] = $v;
    }
}
jsonResponse([
    'headers' => $headers,
    'server' => $_SERVER,
]);
