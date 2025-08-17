<?php
require_once 'db/sql.php';
require_once 'actions.php';

if( $_SERVER['REQUEST_METHOD'] !== 'POST' ) {
    http_response_code( 405 );
    exit;
}

$table = $_POST['table'] ?? '';
$columns = get_columns( $table );
handleInsertRequest( $table, $columns );

var_dump( $_POST );

header("Location: index.php?table=" . urlencode( $table ));
exit;