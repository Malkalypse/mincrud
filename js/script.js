import { getColumnIndex, autoSizeInputs } from './utilities.js';

// ─────────────────────────────────────────────
// Action Button Functions
// ─────────────────────────────────────────────

document.addEventListener( 'DOMContentLoaded', () => {
	const table = document.querySelector( 'table' );
	if( !table ) return;

	const colCount = table.rows[0].cells.length;
	//const addRow = table.querySelector( 'tr.add-row' );
	//const addInputs = table.querySelectorAll( '.add-input' );

	for( let colIndex = 0; colIndex < colCount - 1; colIndex++ ) {
		autoSizeInputs( table, colIndex ); // initial sizing for all columns
	}

	// Global listener for any input in the table
	table.addEventListener( 'input', e => {
		const td = e.target.closest( 'td' );
		if( !td ) return;
		const colIndex = getColumnIndex( td );
		autoSizeInputs( table, colIndex );
	} );
} );

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
	} );

	applyColumnWidths( row, table );
	trackInputChanges( row );
	toggleButtons( row, { edit: false, save: true, cancel: true } );
}

// Set input widths based on column content
function applyColumnWidths( row, table ) {
	const editableCells = getEditableCells( row );
	const updatedCols = new Set();

	editableCells.forEach( ( { input } ) => {
		const colIndex = getColumnIndex( input.closest( 'td' ) );

		//console.log( `Sizing column ${colIndex} for input with value: "${input.value}"` );

		if( !updatedCols.has( colIndex ) ) {
			updatedCols.add( colIndex );
			autoSizeInputs( table, colIndex );
		}
	} );
}

// Track input changes within a table row and toggle Save state
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
			autoSizeInputs( table, colIndex );
		} );

		editableCells.forEach( ( { input } ) => {
			const colIndex = getColumnIndex( input.closest( 'td' ) );
			autoSizeInputs( table, colIndex );
		} );

	} );
}
/*
function getColumnIndex( cell ) {
	if( !cell || !cell.parentNode ) return -1;
	return Array.from( cell.parentNode.children ).indexOf( cell );
}
*/

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
	const table = row.closest( 'table' );
	const editableCells = getEditableCells( row ); // cache before inputs are removed
	const updatedCols = new Set();

	row.classList.remove( 'editing' );

	editableCells.forEach( ( { input, span } ) => {
		input.value = span.textContent;

		const colIndex = getColumnIndex( input.closest( 'td' ) );
		if( !updatedCols.has( colIndex ) ) {
			updatedCols.add( colIndex );
			autoSizeInputs( table, colIndex );
		}
	} );

	toggleButtons( row, { edit: true, save: false, cancel: false } );
}


// Get structured data for each cell in a row
function getEditableCells( row ) {
	return Array.from( row.querySelectorAll( '[data-field]' ) ).map( cell => {
		return {
			cell,
			field: cell.dataset.field,																											// field name
			span: cell.querySelector( '.display-text' ),																		// display span
			input: cell.querySelector( '.edit-input' ) || cell.querySelector( '.add-input' )	// input element
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
/*
function sendUpdate( payload ) {
	fetch( 'db/update.php', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams( payload )
	} )
		.then( r => r.text() )
		.then( text => {
			if( text !== 'OK' ) alert( 'Update failed: ' + text );
		} );
}
*/
function sendUpdate( payload ) {
	fetch( 'db/update.php', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'X-Requested-With': 'XMLHttpRequest' // <--- Add this line
		},
		body: new URLSearchParams( payload )
	} )
		.then( r => r.text() )
		.then( text => {
			const errorDiv = document.getElementById( 'error-message' );
			if( text.trim() !== 'OK' ) {
				errorDiv.textContent = 'Error: ' + text;
			} else {
				errorDiv.textContent = '';
			}
		} );
}


