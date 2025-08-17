<?php
require 'sql.php';

$table = $_POST['table'] ?? null;
$id    = $_POST['id'] ?? null;

if( !$table || !$id ) {
	http_response_code(400);
	echo 'Missing table or ID';
	exit;
}

$columns = get_columns( $table );
$primary = get_primary_key( $table );

$data = [];

foreach( $columns as $col ) {
	$name = $col['Field'];
	if( $name === $primary ) continue;
	if( isset( $_POST[$name] ) ) {
		$data[$name] = $_POST[$name];
	}
}

$where = quote_ident( $primary ) . ' = :' . $primary;
$whereParams = [ $primary => $id ];

$ok = update( $table, $data, $where, $whereParams );

echo $ok ? 'OK' : 'FAIL';
