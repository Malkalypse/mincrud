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
function handleInsertRequest( array $post ): void {
    global $pdo;

    $table = $post['table'] ?? '';
    $data  = $post['data'] ?? [];

    if( !$table || !is_array($data) ) {
        redirectWithError($table, "Invalid form submission.");
    }

    $columns = array_keys($data);
    $placeholders = array_map(fn($col) => ":$col", $columns);
    $sql = "INSERT INTO `$table` (" . implode(',', $columns) . ") VALUES (" . implode(',', $placeholders) . ")";

    try {
        $stmt = $pdo->prepare($sql);
        foreach( $data as $key => $value ) {
            $stmt->bindValue(":$key", $value);
        }
        $stmt->execute();

        header("Location: ../index.php?table=" . urlencode($table));
        exit;
    } catch( PDOException $e ) {
        redirectWithError($table, parseDbError($e));
    }
}

function redirectWithError( string $table, string $message ): void {
    header("Location: ../index.php?table=" . urlencode($table) . "&error=" . urlencode($message));
    exit;
}

function parseDbError( PDOException $e ): string {
    $msg = $e->getMessage();

    if( str_contains($msg, 'Integrity constraint violation') ) {
        return "Insert failed: Invalid or missing data.";
    }
    if( str_contains($msg, 'cannot be null') ) {
        return "Insert failed: Required field missing.";
    }
    if( str_contains($msg, 'Duplicate entry') ) {
        return "Insert failed: Duplicate value.";
    }
    return "Insert failed: Database error.";
}
