<?php

// Renders a GET-based dropdown form for selecting a database table.
function renderTableDropdown(array $tables, string $selectedTable): void {
	?>
	<!-- Begin GET form for table selection -->
	<form method="get">

		<!-- Dropdown triggers form submit on change -->
		<select name="table" onchange="this.form.submit()">

			<option value="">-- Select a table --</option> <!-- default placeholder option -->
			<?php foreach ($tables as $table): ?>

				<!-- Render escaped table name as both value and label -->
				<option value="<?= htmlspecialchars($table) ?>"
					<?= $table === $selectedTable ? 'selected' : '' ?>> <!-- mark selected table -->
					<?= htmlspecialchars($table) ?>
				</option>

			<?php endforeach; ?>

		</select>
	</form>
	<?php
}

/**
 * Renders an HTML table for the given database table name and column metadata.
 *
 * @param string|null	$table		Name of the table to render (if null, nothing is rendered).
 * @param array				$columns	Array of column metadata.
 * @param string|null	$primary	Name of the primary key column (if available).
 */
function renderTable(?string $table, array $columns, ?string $primary): void {
	if (!$table) return;
	?>

	<h2>Table: <?= htmlspecialchars($table) ?></h2>

	<!-- Begin POST form for inserting new rows -->
	<form method="post" id="add-form">
		<input type="hidden" name="table" value="<?= htmlspecialchars($table) ?>" />
	</form>

	<table border="1" cellpadding="5">
		<!-- Render column headers -->
		<tr>
			<?php foreach ($columns as $col): ?>
				<th><?= htmlspecialchars($col['Field']) ?></th>
			<?php endforeach; ?>
			<th>Actions</th>
		</tr>

		<?php
			renderInsertRow( $columns ); // Add row inputs linked to #add-form
			renderTableRows( $table, $columns, $primary ); // Existing data rows
		?>
	</table>
	<?php
}

// Renders a single input row for inserting new data into the current table.
function renderInsertRow(array $columns): void {
	?>
	<tr class="add-row">
		<?php foreach ($columns as $col):
			$flags = getColumnFlags($col);
			$name = $flags['name'];
		?>
			<td data-field="<?= htmlspecialchars($name) ?>">
				<!-- Suppress input for auto-managed fields -->
				<?php if ($flags['is_auto'] || $flags['is_timestamp']): ?>
					—
				<!-- Render editable input -->
				<?php else: ?>
					<input name="<?= htmlspecialchars($name) ?>"
						class="add-input"
						form="add-form"
					/>
				<?php endif; ?>
			</td>
		<?php endforeach; ?>

		<!-- Submit button scoped to #add-form -->
		<td>
			<button type="submit" form="add-form">Add</button>
		</td>
	</tr>
	<?php
}

// Extracts metadata flags (e.g. auto_increment, nullable) from a column definition
function getColumnFlags(array $col): array {
	$name = $col['Field'];
	$type = $col['Type'];
	return [
		'name'         => $name,
		'type'         => $type,
		'is_auto'      => $col['Extra'] === 'auto_increment',
		'is_timestamp' => str_contains($type, 'datetime')
	];
}

// Renders all data rows for the given table
function renderTableRows(string $table, array $columns, ?string $primary): void {
	$rows = fetch_all($table);

	if ($rows):
		foreach ($rows as $row):
			?>

			<!-- Begin row, tagged with primary key for JS targeting -->
			<tr data-id="<?= htmlspecialchars($row[$primary]) ?>">
				<?php

				// Render each column as an editable cell
				foreach ($columns as $col):
					renderEditableCell($row, $col);
				endforeach;

				renderActionCell($table, $row, $primary); ?> <!-- cell for action buttons -->
			</tr>
			<?php
		endforeach;
	endif;
}

/**
 * Renders a cell with a display span and a hidden input field for inline editing.
 *
 * @param array $row  Associative array representing a single table row.
 * @param array $col  Column metadata (must include a 'Field' key).
 */
function renderEditableCell(array $row, array $col): void {
	$field   = $col['Field'];										// column name
	$value   = strval($row[$field] ?? '');			// value from row as string
	$escaped = htmlspecialchars($value);			// escape value for safe HTML output
	?>

	<!-- Editable cell with span and input elements -->
	<td data-field="<?= htmlspecialchars($field) ?>">
		<span class="display-text"><?= $escaped ?></span>
		<input class="edit-input" type="text" value="<?= $escaped ?>" />
	</td>
	<?php
}

// Renders the action cell for a row, including Edit, Save, Cancel, and Delete controls.
function renderActionCell(string $table, array $row, ?string $primary): void {
	// Only render if primary key is defined and present in the row
	if ($primary && isset($row[$primary])):
		$tableName = urlencode($table);
		$id = urlencode($row[$primary]);
		?>

		<!-- Buttons are pre-rendered and toggled via JavaScript -->
		<td class="action-cell">
			<button class="edit-btn">Edit</button>
			<button class="save-btn" style="display:none;">Save</button>
			<button class="cancel-btn" style="display:none;">Cancel</button>
			<?php renderDeleteForm($tableName, $id); ?>
		</td>
		<?php
	endif;
}

// Renders an inline POST form for deleting a row.
function renderDeleteForm(string $tableName, string $id): void {
	?>

	<!-- Inline delete form with confirmation-->
	<form
		method="post"
		action="delete.php"
		style="display:inline;"
		onsubmit="return confirm('Delete this row?')"
	>
		<!-- Hidden inputs to identify table and row -->
		<input type="hidden" name="table" value="<?= htmlspecialchars($tableName) ?>" />
		<input type="hidden" name="id" value="<?= htmlspecialchars($id) ?>" />

		<button type="submit" class="delete-btn">Delete</button>
	</form>

	<?php
}