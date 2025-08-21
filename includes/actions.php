<?php
require_once __DIR__ . '/../db/sql.php';
require_once __DIR__ . '/errors.php';

/*
Response codes --
400: Bad Request						(assumes all errors are due to client input)
500: Internal Server Error	(indicates a server-side issue)
*/

/** Handles an insert request for a given table using column metadata.
 *
 * Iterates over the provided column definitions to construct a data array:
 * - Skips auto-increment fields
 * - Auto-fills timestamp fields like 'created_at' and 'sent_at' if type is datetime
 * - Pulls remaining values from $_POST, defaulting to null if missing
 *
 * Calls `insert( $table, $data )` to perform the database insert.
 * Redirects to index.php with the current table preserved in the query string.
 *
 * @param string $table   	Name of the table to insert into
 * @param array  $columns		Column metadata array, each item must include:
 * - 'Field' (column name)
 * - 'Type' (SQL type string)
 * - 'Extra' (e.g. 'auto_increment')
 *
 * @return void
 */
function insertRequest( array $post ): array {
	global $pdo;

	$table = $post[ 'table' ] ?? '';
	$columns = validateTableAndColumns( $table );
	$data = buildDataArray( $columns, $post );
	if( empty( $data ) ) handleError( 400, "No data to insert." );

	// Build and execute the INSERT statement
	$colNames = array_keys( $data );
	$placeholders = array_map( fn( $col ) => ":$col", $colNames );
	$sql = "INSERT INTO `$table` (" . implode( ',', $colNames ) . ") VALUES (" . implode(',', $placeholders ) . ")";

	try {
		// Prepare and execute the statement with bound parameters
		$stmt = $pdo->prepare( $sql );
		foreach( $data as $key => $value ) {
			$stmt->bindValue( ":$key", $value );
		}
		$stmt->execute();

        $id = $pdo->lastInsertId();
        $primary = get_primary_key($table);
        // Fetch the inserted row
        $row = fetch($table, "$primary = :id", ['id' => $id]);
        return $row;

	} catch( PDOException $e ) {
		handleError( 400, parseDbError( $e ) );
	}

	return [];
}

/**
 * Handles an update request for a given table.
 *
 * - Validates the table and primary key
 * - Builds the data array from POST input, and performs the update operation
 * - Redirects to index.php with error handling.
 *
 * @param array $post  Associative array of POST data including 'table' and 'id'.
 */
function updateRequest( array $post ): void {
	$table = $_POST[ 'table' ] ?? '';
	$id    = $_POST[ 'id' ] ?? null;
  if( !$table || !$id ) { handleError( 400, 'Missing table or ID' ); }

	$columns = validateTableAndColumns( $table );
	$primary = get_primary_key( $table );
	if( !$primary ) handleError( 500, 'Primary key not found' );

	$data = buildDataArray( $columns, $post, [$primary] ); // build data array, skipping primary key column
	if( empty( $data ) ) handleError( 400,'No updatable fields provided' );

	// Build WHERE clause and parameters for the update
	$where       = quote_ident( $primary ) . ' = :' . $primary;
	$whereParams = [ $primary => $id ];

	try {
		$ok = update( $table, $data, $where, $whereParams ); // perform the update operation
		if( !$ok ) handleError( 500, 'Update failed' );

	} catch( Exception $e ) {
		handleError( 500, $e->getMessage() );
	}
}

// Validates the table name and retrieves its columns, handling errors as needed.
function validateTableAndColumns( string $table ): array {
  if( !$table ) handleError( 400, "Invalid table." );
  $columns = get_columns( $table );
  if( !$columns ) handleError( 400, "Table has no columns." );
  return $columns;
}

// Builds a data array from input, skipping a specified column if needed.
function buildDataArray( array $columns, array $input, array $skip = [] ): array {
	$data = [];

	foreach( $columns as $col ) {
		$name = $col[ 'Field' ];
		
		if( in_array( $name, $skip, true ) ) continue; // skip specified columns

		if( array_key_exists( $name, $input ) ) { // only include columns present in input
			$value = $input[ $name ];
			$data[ $name ] = ( $value === '' && $col[ 'Null' ] === 'YES' ) ? null : $value;
		}
	}

	return $data;
}


