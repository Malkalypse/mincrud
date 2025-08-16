<?php
require 'core/functions.php';

$table = $_GET['table'] ?? null;
$tables = get_table_names();
$columns = $table ? get_columns( $table ) : [];
$primary = $table ? get_primary_key( $table ) : null;

// Handle insert
if( $_SERVER['REQUEST_METHOD'] === 'POST' && $table ) {
	$data = [];

	foreach( $columns as $col ) {
		$name = $col['Field'];
		$type = strtolower( $col['Type'] );

		if( $col['Extra'] === 'auto_increment' ) continue;

		// Auto-fill timestamp columns
		if( in_array( $name, [ 'created_at', 'sent_at' ] ) && str_contains( $type, 'datetime' ) ) {
			$data[$name] = date( 'Y-m-d H:i:s' );
		} else {
			$data[$name] = $_POST[$name] ?? null;
		}
	}

	insert( $table, $data );
	header( "Location: index.php?table=" . urlencode( $table ) );
	exit;
}

?>

<link rel="stylesheet" href="style.css">

<form method="get">
	<select name="table" onchange="this.form.submit()">
		<option value="">-- Select a table --</option>
		<?php foreach( $tables as $t ): ?>
			<option value="<?= htmlspecialchars( $t ) ?>" <?= $t === $table ? 'selected' : '' ?>>
				<?= htmlspecialchars( $t ) ?>
			</option>
		<?php endforeach; ?>
	</select>
</form>

<?php if( $table ): ?>

	<h2>Table: <?= htmlspecialchars( $table ) ?></h2>

	<table border="1" cellpadding="5">
		<tr>
			<?php foreach( $columns as $col ): ?>
				<th><?= htmlspecialchars( $col['Field'] ) ?></th>
			<?php endforeach; ?>
			<th>Actions</th>
		</tr>

		<!-- Add Row Form FIRST -->
		<tr>
			<form method="post">
				<?php foreach( $columns as $col ): ?>
					<?php
						$name = $col['Field'];
						$type = strtolower( $col['Type'] );
						$is_auto = $col['Extra'] === 'auto_increment';
						$is_timestamp = in_array( $name, [ 'created_at', 'sent_at' ] ) && str_contains( $type, 'datetime' );
					?>
					<td>
						<?php if( $is_auto || $is_timestamp ): ?>
							—
						<?php else: ?>
							<input name="<?= htmlspecialchars( $name ) ?>" />
						<?php endif; ?>
					</td>
				<?php endforeach; ?>
				<td><button type="submit">Add</button></td>
			</form>
		</tr>

		<!-- Existing Rows -->
		<?php
		$rows = fetch_all( $table );
		if( $rows ):
			foreach( $rows as $row ):
		?>
			<tr data-id="<?= htmlspecialchars( $row[$primary] ) ?>">
				<?php
						foreach( $columns as $col ): 
						$value = strval( $row[ $col['Field'] ] ?? '' );
						$escaped = htmlspecialchars( $value );
				?>
				<td data-field="<?= htmlspecialchars( $col['Field'] ) ?>">
						<span class="display-text"><?= $escaped ?></span>
						<input class="edit-input" type="text" value="<?= $escaped ?>" />
				</td>

				<?php endforeach; ?>
				<td>
					<?php if( $primary && isset( $row[$primary] ) ): ?>
						<button class="edit-btn">Edit</button>
						<a href="delete.php?table=<?= urlencode( $table ) ?>&id=<?= urlencode( $row[$primary] ) ?>" onclick="return confirm('Delete this row?')">Delete</a>
					<?php endif; ?>
				</td>
			</tr>
		<?php endforeach; endif; ?>

	</table>

<?php endif; ?>

<script>
	document.querySelectorAll( 'table' ).forEach( function( table ) {
		table.addEventListener( 'click', function( event ) {
			const button = event.target;

			if( button.classList.contains( 'edit-btn' ) ) {
				const row = button.closest( 'tr' );
				row.classList.add( 'editing' );

				row.querySelectorAll( '[data-field]' ).forEach( function( cell ) {
					const span = cell.querySelector( '.display-text' );
					const input = cell.querySelector( '.edit-input' );

					//const width = measureSpanWidth( span.textContent, cell );
					//input.style.width = width + 'px';

					input.value = span.textContent;
					autoSizeInput( input );

					input.value = span.textContent;
				} );

				button.textContent = 'Save';
				button.classList.remove( 'edit-btn' );
				button.classList.add( 'save-btn' );
			}
			else if( button.classList.contains( 'save-btn' ) ) {
				const row = button.closest( 'tr' );
				row.classList.remove( 'editing' );

				row.querySelectorAll( '[data-field]' ).forEach( function( cell ) {
					const input = cell.querySelector( '.edit-input' );
					const span = cell.querySelector( '.display-text' );
					span.textContent = input.value;
				} );

				button.textContent = 'Edit';
				button.classList.remove( 'save-btn' );
				button.classList.add( 'edit-btn' );

				// Optional: send updated data to server via fetch or form
				const tableName = new URLSearchParams( location.search ).get( 'table' );
				const primaryKey = row.dataset.id;

				const payload = {
					table: tableName,
					id: primaryKey
				};

				row.querySelectorAll( '[data-field]' ).forEach( function( cell ) {
					const field = cell.dataset.field;
					const input = cell.querySelector( '.edit-input' );
					payload[ field ] = input.value;
				} );

				fetch( 'update.php', {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: new URLSearchParams( payload )
				} ).then( r => r.text() ).then( text => {
					if( text !== 'OK' ) alert( 'Update failed: ' + text );
				} );
			}

		} );
	} );

  // Attach live width sync to input based on its text content
  function autoSizeInput( input ) {

    // Measure width using hidden span with matched font
    function updateWidth() {
      const width = measureSpanWidth( input.value, input );
      input.style.width = width + 'px';
    }

    // Sync width on input and initialize
    input.addEventListener( 'input', updateWidth );
    updateWidth();
  }

	function measureSpanWidth( text, referenceCell ) {
		const span = document.createElement( 'span' );
		span.textContent = text;
		span.style.visibility = 'hidden';
		span.style.whiteSpace = 'nowrap';

		const style = getComputedStyle( referenceCell );
		span.style.font = style.font;
		span.style.fontSize = style.fontSize;
		span.style.fontFamily = style.fontFamily;
		span.style.letterSpacing = style.letterSpacing;

		document.body.appendChild( span );
		const width = span.getBoundingClientRect().width;
		document.body.removeChild( span );

		return width;
	}
</script>
