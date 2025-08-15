<?php
require 'core/functions.php';

$table = $_GET['table'] ?? null;
$id    = $_GET['id'] ?? null;

if( !$table || !$id ) die("Missing table or ID");

$pk = get_primary_key( $table );

delete( $table, "$pk = :id", [ 'id' => $id ] );
header( "Location: index.php?table=" . urlencode( $table ) );
exit;