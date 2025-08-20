<?php
require_once 'sql.php';
require_once 'actions.php';

// Ensure this script is only accessed via POST.
if( $_SERVER[ 'REQUEST_METHOD' ] !== 'POST' ) {
	http_response_code( 405 ); // Method Not Allowed
	exit;
}

insertRequest( $_POST );
exit;