<?php
require_once 'sql.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$table = $_POST['table'] ?? null;
$id    = $_POST['id']    ?? null;

if (!$table || !$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing table or ID']);
    exit;
}

$pk = get_primary_key($table);

try {
    delete($table, "$pk = :id", ['id' => $id]);
    echo json_encode(['status' => 'OK']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
exit;