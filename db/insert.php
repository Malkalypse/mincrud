<?php
require_once 'sql.php';
require_once 'actions.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

try {
    $row = insertRequest($_POST); // Return inserted row as array
    echo json_encode(['status' => 'OK', 'row' => $row]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}
exit;