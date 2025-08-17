<?php
function handleInsertRequest( string $table, array $columns ): void {

  $data = [];

  foreach( $columns as $col ) {
    $name = $col['Field'];
    $type = strtolower( $col['Type'] );

    // Auto-increment columns are handled by the database
    if( $col['Extra'] === 'auto_increment' ) continue;

    // Auto-fill timestamp columns
    if( in_array( $name, [ 'created_at', 'sent_at' ] ) && str_contains( $type, 'datetime' ) ) {
      $data[$name] = date( 'Y-m-d H:i:s' );
    } else {
      $data[$name] = $_POST[$name] ?? null;
    }
  }

  insert( $table, $data );

  // Redirect to index.php with current table preserved in query
  header( "Location: index.php?table=" . urlencode( $table ) );
  
  exit;
}