<?php
require_once 'sql.php';

/**
 * Handles an insert request for a given table using column metadata.
 *
 * Iterates over the provided column definitions to construct a data array:
 * - Skips auto-increment fields
 * - Auto-fills timestamp fields like 'created_at' and 'sent_at' if type is datetime
 * - Pulls remaining values from $_POST, defaulting to null if missing
 *
 * Calls `insert( $table, $data )` to perform the database insert.
 * Redirects to index.php with the current table preserved in the query string.
 *
 * @param string $table   Name of the table to insert into
 * @param array  $columns Column metadata array, each item must include:
 * - 'Field' (column name)
 * - 'Type' (SQL type string)
 * - 'Extra' (e.g. 'auto_increment')
 *
 * @return void
 */
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
	header( "Location: ../index.php?table=" . urlencode( $table ) );
	
	exit;
}