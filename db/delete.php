<?php
require_once 'errors.php';

require_method( 'POST' );

$table = $_POST['table'] ?? null;
$id    = $_POST['id']    ?? null;

if( !$table || !$id ) {
	send_json( [ 'error' => 'Missing table or ID' ], 400 );
}

$pk = get_primary_key( $table );

try {
	delete( $table, "$pk = :id", [ 'id' => $id ] );
	send_json( [ 'status' => 'OK' ] );
} catch( Exception $e ) {
	send_json( [ 'error' => $e->getMessage() ], 500 );
}