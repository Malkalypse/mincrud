<?php
require_once __DIR__ . '/config.php';

// Data Source Name (DSN) for PDO connection
$dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET; 

// Options for PDO connection
$options = [
  PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

// Create a new PDO instance
try {
  $pdo = new PDO( $dsn, DB_USER, DB_PASS, $options );
} catch( PDOException $e ) {
  exit( 'PDO connection failed: ' . $e->getMessage() );
}