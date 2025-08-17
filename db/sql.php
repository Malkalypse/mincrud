<?php
/**
 * Core data‐access toolkit (PDO edition)
 * Centralized SQL execution and semantic CRUD wrappers.
 *
 * @requires db.php     Defines and configures $pdo
 */

require_once 'db/db.php';


// ─────────────────────────────────────────────
// Table Metadata Functions
// ─────────────────────────────────────────────

// Get a list of tables in the current database
function get_table_names(): array {
	return query( "SHOW TABLES" )->fetchAll( PDO::FETCH_COLUMN );
}

// Get a table's primary column name
function get_primary_key( string $table ): ?string {
	foreach( get_columns( $table ) as $col ) {
		if( $col['Key'] === 'PRI' ) return $col['Field'];
	}
	return null;
}
function get_columns( string $table ): array {
	$rows = query(
		"DESCRIBE " . quote_ident( $table ) // get all table columns and their properties
	)->fetchAll(
		PDO::FETCH_ASSOC // key by column name, not numeric index
	);
	return $rows;
}


// ─────────────────────────────────────────────
// Modify Table Functions
// ─────────────────────────────────────────────

// Insert row
function insert( string $table, array $data ): bool {
	[ 'columns' => $cols, 'placeholders' => $vals ] = build_insert_clause( $data );
	$sql = "INSERT INTO " . quote_ident( $table ) . " ( $cols ) VALUES ( $vals )";

	return modify( $sql, $data );
}
function build_insert_clause( array $data ): array {
	$columns = array_keys( $data );
	$placeholders = array_map(
		fn( $col ) => ":$col", // convert column name into named placeholder
		$columns
	);

	return [
		'columns' => implode( ', ', $columns ),
		'placeholders' => implode( ', ', $placeholders )
	];
}

// Update row(s)
function update( string $table, array $data, string $where, array $whereParams ): bool {
	$set = build_set_clause( $data );
	$sql = "UPDATE " . quote_ident( $table ) . " SET $set WHERE $where";

	return modify( $sql, array_merge( $data, $whereParams ) );
}
function build_set_clause( array $data ): string {
	return implode( ', ',
		array_map(
			fn( $col ) => "`$col` = :$col", // convert column name to parameterized assingment
			array_keys( $data )
		)
	);
}

// Delete row(s)
function delete( string $table, string $where, array $params ): bool {
	$sql = "DELETE FROM " . quote_ident( $table ) . " WHERE $where";
	return modify( $sql, $params );
}

/** Executes a data‐modifying SQL statement and returns success flag.
 *
 * Used by insert(), update(), and delete() to centralize write logic.
 *
 * @param string $sql     SQL with named placeholders
 * @param array  $params  Bind values for placeholders
 * @return bool           True if rowCount() > 0
 */
function modify( string $sql, array $params ): bool {
	return query( $sql, $params )->rowCount() > 0;
}


// ─────────────────────────────────────────────
// Fetch Data Functions
// ─────────────────────────────────────────────

// Fetch single row
function fetch(
	string $table,
	string $where = '',
	array $params = [],
	array $columns = [ '*' ]
): ?array {
	return fetch_rows( $table, $where, $params, $columns, false );
}

// Fetch all rows
function fetch_all(
	string $table,
	string $where = '',
	array $params = [],
	array $columns = [ '*' ]
): array {
	return fetch_rows( $table, $where, $params, $columns, true );
}

// Unified fetch logic
function fetch_rows(
	string $table,
	string $where = '',
	array $params = [],
	array $columns = [ '*' ],
	bool $all = false
): array|null {
	$cols = implode( ', ', $columns );
	$sql = "SELECT $cols FROM " . quote_ident( $table ) . ( $where ? " WHERE $where" : '' );
	$stmt = query( $sql, $params );

	return $all
		? $stmt->fetchAll( PDO::FETCH_ASSOC )
		: ( $stmt->fetch( PDO::FETCH_ASSOC ) ?: null );
}


// ─────────────────────────────────────────────
// Shared Helpers
// ─────────────────────────────────────────────

/** Executes a parameterized SQL query using the global PDO connection.
 *
 * Prepares the given SQL statement, binds parameters, and executes it.
 * Throws an exception if preparation fails.
 * Returns the executed PDOStatement for further inspection or fetching.
 *
 * @param string $sql     The SQL query string with named or positional placeholders.
 * @param array  $params  Parameters to bind to the query (default: empty array).
 *
 * @return PDOStatement   The executed statement, ready for fetch or rowCount.
 * @throws Exception      If the SQL preparation fails.
 *
 * Usage:
 *   $stmt = query( "SELECT * FROM users WHERE id = :id", [ ':id' => $user_id ] );
 */
function query( string $sql, array $params = [] ): PDOStatement {
	global $pdo;

	$stmt = $pdo->prepare( $sql );
	if( !$stmt ) {
		throw new Exception( "Prepare failed: " . implode( ', ', $pdo->errorInfo() ) );
	}

	$stmt->execute( $params );
	return $stmt;
}

// Optional: quote identifiers safely
function quote_ident( string $name ): string {
	return '`' . str_replace( '`', '``', $name ) . '`';
}