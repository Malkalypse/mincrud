import { autoSizeInput, updateColumnInputWidths } from './utilities.js';
import ColumnWidthManager from './ColumnWidthManager.js';

// ─────────────────────────────────────────────
// Action Button Functions
// ─────────────────────────────────────────────

// Set button actions
document.querySelectorAll( 'table' ).forEach( table => {
	table.addEventListener( 'click', event => {
		const button = event.target;
		const row = button.closest( 'tr' );

		if( button.classList.contains( 'edit-btn' ) ) {
			enterEditMode( row );
		} else if( button.classList.contains( 'save-btn' ) ) {
			saveRow( row );
		} else if( button.classList.contains( 'cancel-btn' ) ) {
			cancelEdit( row );
		}
	} );
} );

// Enable editing for a given table row
function enterEditMode( row ) {
	row.classList.add( 'editing' );

	const table = row.closest( 'table' );
	const editableCells = getEditableCells( row );

	editableCells.forEach( ( { input, span }, i ) => {
		input.value = span.textContent;
		input.dataset.original = span.textContent.trim();

		autoSizeInput( input ); // Optional: may be replaced by fixed width
	} );

	applyColumnWidths( row, table );

	trackInputChanges( row );
	toggleButtons( row, { edit: false, save: true, cancel: true } );
}

// Set input widths based on column content
function applyColumnWidths( row, table ) {
	const editableCells = getEditableCells( row );

	editableCells.forEach( ( { input }, i ) => {
		const width = ColumnWidthManager.get( table, i );
		input.style.width = `${width}px`;
	} );
}

/**
 * Tracks input changes within a table row and toggles Save button state.
 *
 * Stores original values from display spans in data-original attributes.
 * Enables the Save button only if at least one input value differs from its original.
 *
 * @param {HTMLTableRowElement} row The table row containing editable cells and a Save button.
 */
/*
function trackInputChanges( row ) {
	const editableCells = getEditableCells( row ); // strictured access to inputs and spans
	const saveBtn = row.querySelector( '.save-btn' );

	// Store original values
	editableCells.forEach( ( { input, span } ) => {
		const original = span.textContent.trim();
		input.dataset.original = original;
	} );

	saveBtn.disabled = true;
	saveBtn.title = 'Changes cannot be saved if there are no changes';

	// Attach listeners to detect changes
	editableCells.forEach( ( { input } ) => {
		input.addEventListener( 'input', () => {

			// Compare input to original value
			const changed = editableCells.some( ( { input } ) =>
				input.value.trim() !== input.dataset.original
			);

			saveBtn.disabled = !changed;
			saveBtn.title = saveBtn.disabled
				? 'Changes cannot be saved if there are no changes'
				: '';

		} );
	} );
}
*/
function trackInputChanges( row ) {
	const table = row.closest( 'table' );
	const editableCells = getEditableCells( row );
	const saveBtn = row.querySelector( '.save-btn' );

	editableCells.forEach( ( { input, span } ) => {
		const original = span.textContent.trim();
		input.dataset.original = original;
	} );

	saveBtn.disabled = true;
	saveBtn.title = 'Changes cannot be saved if there are no changes';

	editableCells.forEach( ( { input } ) => {
		input.addEventListener( 'input', () => {
			const changed = editableCells.some( ( { input } ) =>
				input.value.trim() !== input.dataset.original
			);

			saveBtn.disabled = !changed;
			saveBtn.title = saveBtn.disabled
				? 'Changes cannot be saved if there are no changes'
				: '';

			const colIndex = getColumnIndex( input.closest( 'td' ) );
			updateColumnInputWidths( table, colIndex );
		} );

		editableCells.forEach(({ input }) => {
			const colIndex = getColumnIndex(input.closest('td'));
			updateColumnInputWidths(table, colIndex);
		} );

	} );
}
function getColumnIndex( cell ) {
	if( !cell || !cell.parentNode ) return -1;
	return Array.from( cell.parentNode.children ).indexOf( cell );
}


// Commit edits for a row
function saveRow( row ) {
	row.classList.remove( 'editing' );

	getEditableCells( row ).forEach( ( { input, span } ) => {
		span.textContent = input.value;
	} );
	toggleButtons( row, { edit: true, save: false, cancel: false } );

	const payload = buildPayload( row );
	sendUpdate( payload );
}

// Cancel editing for a row
function cancelEdit( row ) {
	row.classList.remove( 'editing' );

	getEditableCells( row ).forEach( ( { input, span } ) => {
		input.value = span.textContent;
	} );
	toggleButtons( row, { edit: true, save: false, cancel: false } );
}

// Get structured data for each cell in a row
function getEditableCells( row ) {
	return Array.from( row.querySelectorAll( '[data-field]' ) ).map( cell => {
		return {
			cell,
			field: cell.dataset.field,										// field name
			span: cell.querySelector( '.display-text' ),	// display span
			input: cell.querySelector( '.edit-input' )		// input element
		};
	} );
}

// Update Edit/Save/Cancel button visibility
function toggleButtons( row, { edit, save, cancel } ) {
	row.querySelector( '.edit-btn' ).style.display = edit ? '' : 'none';
	row.querySelector( '.save-btn' ).style.display = save ? '' : 'none';
	row.querySelector( '.cancel-btn' ).style.display = cancel ? '' : 'none';
}

/**
 * Constructs a key-value payload from a table row for submission.
 * Includes table name, row ID, and all editable field values.
 */
function buildPayload( row ) {
	// Extract table name from URL query string
	const tableName = new URLSearchParams( location.search ).get( 'table' );

	// Initialize payload with table name and row ID
	const payload = {
		table: tableName,
		id: row.dataset.id
	};

	// Add each editable field and its current input value
	row.querySelectorAll( '[data-field]' ).forEach( cell => {
		const field = cell.dataset.field;										// field name
		const input = cell.querySelector( '.edit-input' );	// input element
		payload[field] = input.value;												// input value
	} );

	return payload;
}

/**
 * Sends a POST request to update.php with the given URL-encoded payload.
 * Alerts if the response is not 'OK'.
 */
function sendUpdate( payload ) {
	fetch( 'update.php', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams( payload )
	} )
		.then( r => r.text() )
		.then( text => {
			if( text !== 'OK' ) alert( 'Update failed: ' + text );
		} );
}


