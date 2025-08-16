<?php
require_once 'core/sql.php';
require_once 'actions.php';
require_once 'render.php';

$table = $_GET['table'] ?? '';
$tables = get_table_names();
$columns = $table ? get_columns( $table ) : [];
$primary = $table ? get_primary_key( $table ) : null;

if( $_SERVER['REQUEST_METHOD'] === 'POST' && $table ) {
	handleInsertRequest( $table, $columns );
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="style.css">
</head>
<body>

<?php renderTableDropdown( $tables, $table ); ?>
<?php renderTable( $table, $columns, $primary ) ?>

<script type="module" src="script.js"></script>

</body>
</html>