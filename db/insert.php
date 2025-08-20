<?php
require_once 'sql.php';
require_once 'actions.php';

// Ensure this script is only accessed via POST.
if( $_SERVER[ 'REQUEST_METHOD' ] !== 'POST' ) {
	http_response_code( 405 ); // Method Not Allowed	(assumes this script should only be accessed via POST)
	exit;
}

insertRequest( $_POST ); // process the insert request

exit;