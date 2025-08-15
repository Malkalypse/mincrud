<?php
require 'core/functions.php';

$table = $_GET['table'] ?? null;
$id    = $_GET['id'] ?? null;

if( !$table || !$id ) die("Missing table or ID");

$columns  = get_columns( $table );
$pk       = get_primary_key( $table );
$row      = fetch( $table, "$pk = :id", [ 'id' => $id ] );

if( !$row ) die("Row not found");

if( $_SERVER['REQUEST_METHOD'] === 'POST' ) {
	$data = [];

	foreach( $columns as $col ) {
		$name = $col['Field'];
		$type = strtolower( $col['Type'] );
		$is_auto = $col['Extra'] === 'auto_increment';
		$is_timestamp = in_array( $name, [ 'created_at', 'sent_at' ] ) && str_contains( $type, 'datetime' );

		if( $is_auto || $is_timestamp ) continue;

		$data[$name] = $_POST[$name] ?? null;
	}

	update( $table, $data, "$pk = :id", [ 'id' => $id ] );
	header( "Location: index.php?table=" . urlencode( $table ) );
	exit;
}
?>

<h2>Edit Row</h2>

<form method="post">
	<table border="1" cellpadding="6" cellspacing="0">
		<tr>
			<?php foreach( $columns as $col ): ?>
				<?php
					$name = $col['Field'];
					$type = strtolower( $col['Type'] );
					$is_auto = $col['Extra'] === 'auto_increment';
					$is_timestamp = in_array( $name, [ 'created_at', 'sent_at' ] ) && str_contains( $type, 'datetime' );
					if( $is_auto || $is_timestamp ) continue;
				?>
				<th><?= htmlspecialchars( $name ) ?></th>
			<?php endforeach; ?>
		</tr>
		<tr>
			<?php foreach( $columns as $col ): ?>
				<?php
					$name = $col['Field'];
					$type = strtolower( $col['Type'] );
					$is_auto = $col['Extra'] === 'auto_increment';
					$is_timestamp = in_array( $name, [ 'created_at', 'sent_at' ] ) && str_contains( $type, 'datetime' );
					if( $is_auto || $is_timestamp ) continue;
				?>
				<td>
					<input name="<?= htmlspecialchars( $name ) ?>"
					  value="<?= htmlspecialchars( $row[$name] ?? '' ) ?>"
					  style="width: 100%;"
          />
				</td>
			<?php endforeach; ?>
		</tr>
	</table>
	<button type="submit" style="margin-top: 12px;">Save</button>
</form>