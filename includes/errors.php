<?php
require_once __DIR__ . '/../db/sql.php';

// Send a JSON response and exit.
function send_json( array $data, int $code = 200 ): void {
  http_response_code( $code );
  header( 'Content-Type: application/json' ); // Set content type to JSON
  echo json_encode( $data );
  exit;
}

// Ensure the request method matches, or send a 405 error.
function require_method( string $method ): void {
  if( $_SERVER['REQUEST_METHOD'] !== $method ) {
    send_json( [ 'error' => 'Method Not Allowed' ], 405 );
  }
}

// Handle errors by setting HTTP response code and redirecting or echoing.
function handleError( int $code, string $message ): void {
  http_response_code( $code );
	echo json_encode( [ 'error' => $message ] );
  exit;
}

// Parse PDOException messages to return user-friendly error descriptions.
function parseDbError( PDOException $e ): string {
	$msg = $e->getMessage();

	if( str_contains( $msg, 'Integrity constraint violation' ) ) {
		return "Insert failed: Invalid or missing data.";
	}
	if( str_contains( $msg, 'cannot be null' ) ) {
		return "Insert failed: Required field missing.";
	}
	if( str_contains( $msg, 'Duplicate entry' ) ) {
		return "Insert failed: Duplicate value.";
	}

	return "Insert failed: Database error.";
}