<?php
require_once 'errors.php';

require_method( 'POST' );

try {
	$row = insertRequest( $_POST );
	send_json( [ 'status' => 'OK', 'row' => $row ] );
} catch( Exception $e ) {
	send_json( [ 'error' => $e->getMessage() ], 400 );
}