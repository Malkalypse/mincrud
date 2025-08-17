<?php
require_once 'db/sql.php';
require_once 'db/actions.php';
require_once 'render.php';

$table = $_GET['table'] ?? '';
$tables = get_table_names();
$columns = $table ? get_columns( $table ) : [];
$primary = $table ? get_primary_key( $table ) : null;
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>

<?php
  renderTableDropdown( $tables, $table );

  if( isset($_GET['error']) ) {
      echo '<div class="error" style="color: red; margin: 1em 0;">'
      . htmlspecialchars($_GET['error']) . '</div>';
  }

  renderTable( $table, $columns, $primary )
?>

<script type="module" src="js/script.js"></script>

</body>
</html>