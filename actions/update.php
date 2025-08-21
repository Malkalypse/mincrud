<?php
require_once __DIR__ . '/../includes/actions.php';
require_once __DIR__ . '/../includes/errors.php';

require_method( 'POST' );

try {
	updateRequest( $_POST );
	send_json( [ 'status' => 'OK' ] );
} catch( Exception $e ) {
	send_json( [ 'error' => $e->getMessage() ], 400 );
}