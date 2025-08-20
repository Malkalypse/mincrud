<?php
require 'sql.php';

if( $_SERVER[ 'REQUEST_METHOD' ] !== 'POST' ) {
  exit( 'Invalid request method' );
}

$table = $_POST[ 'table' ] ?? null;
$id    = $_POST[ 'id' ]    ?? null;

if( !$table || !$id ) die( "Missing table or ID" );

$pk = get_primary_key( $table );

delete( $table, "$pk = :id", [ 'id' => $id ] );
header( "Location: ../index.php?table=" . urlencode( $table ) );
exit;