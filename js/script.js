import { getColumnIndex, autoSize, autoSizeAll } from './utilities.js';

// ─────────────────────────────────────────────
// Action Button Functions
// ─────────────────────────────────────────────


document.addEventListener( 'DOMContentLoaded', () => {
	const table = document.querySelector( 'table' );
	if( !table ) return;

	autoSizeAll( table );

	// Bind actions for all existing rows (except the add-row)
	table.querySelectorAll( 'tr' ).forEach( row => {
		if( !row.classList.contains( 'add-row' ) ) {
			bindActions( row );
		}
	} );

	// Global listener for any input in the table
	table.addEventListener( 'input', e => {
		const td = e.target.closest( 'td' );
		if( !td ) return;
		const colIndex = getColumnIndex( td );
		autoSize( table, colIndex );
	} );

	// Intercept Add form submission
	const addForm = document.getElementById( 'add-form' );
	if( addForm ) {
		addForm.addEventListener( 'submit', function ( e ) {
			e.preventDefault();
			const formData = new FormData( addForm );
			const payload = Object.fromEntries( formData.entries() );
			sendInsert( payload );
		} );
	}

	// Intercept Delete form submission (event delegation)
	document.body.addEventListener( 'submit', function ( e ) {
		const form = e.target;
		// Match any form containing a .delete-btn button
		if( form.querySelector( 'button.delete-btn' ) ) {
			e.preventDefault();
			const formData = new FormData( form );
			const payload = Object.fromEntries( formData.entries() );
			if( confirm( 'Delete this row?' ) ) {
				sendDelete( payload );
			}
		}
	} );

} );

// Bind action buttons for existing rows
function bindActions( row ) {
	const editBtn = row.querySelector( '.edit-btn' );
	const saveBtn = row.querySelector( '.save-btn' );
	const cancelBtn = row.querySelector( '.cancel-btn' );

	if( editBtn ) editBtn.addEventListener( 'click', () => enterEditMode( row ) );
	if( saveBtn ) saveBtn.addEventListener( 'click', () => saveRow( row ) );
	if( cancelBtn ) cancelBtn.addEventListener( 'click', () => cancelEdit( row ) );
}

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
			autoSize( table, colIndex );
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
			autoSize( table, colIndex );
		} );

		editableCells.forEach( ( { input } ) => {
			const colIndex = getColumnIndex( input.closest( 'td' ) );
			autoSize( table, colIndex );
		} );

	} );
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
	const table = row.closest( 'table' );
	const editableCells = getEditableCells( row ); // cache before inputs are removed
	const updatedCols = new Set();

	row.classList.remove( 'editing' );

	editableCells.forEach( ( { input, span } ) => {
		input.value = span.textContent;

		const colIndex = getColumnIndex( input.closest( 'td' ) );
		if( !updatedCols.has( colIndex ) ) {
			updatedCols.add( colIndex );
			autoSize( table, colIndex );
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

function sendInsert( payload ) {
	fetch( 'db/insert.php', {
		method: 'POST',
		headers: { 'X-Requested-With': 'XMLHttpRequest' },
		body: new URLSearchParams( payload )
	} )
		.then( r => r.json() )
		.then( data => {
			const errorDiv = document.getElementById( 'error-message' );
			if( data.status === 'OK' && data.row ) {
				errorDiv.textContent = '';
				addTableRow( data.row, payload ); // Pass payload as second argument
				clearAddInputs();
			} else if( data.error ) {
				errorDiv.textContent = 'Error: ' + data.error;
			} else {
				errorDiv.textContent = 'Unknown error';
			}
		} );
}
// Helper to clear add row inputs
function clearAddInputs() {
	document.querySelectorAll( '.add-input' ).forEach( input => input.value = '' );
}

// Helper to add a new row to the table
function addTableRow( rowData, payload ) {
	const table = document.querySelector( 'table' );
	const addRow = table.querySelector( '.add-row' );
	const newRow = document.createElement( 'tr' );
	newRow.setAttribute( 'data-id', rowData.id ); // Adjust if your PK is not 'id'

	// Build cells
	[...addRow.parentNode.querySelectorAll( 'th' )].forEach( ( th, i ) => {
		if( i < Object.keys( rowData ).length ) {
			const field = th.textContent.trim();
			const td = document.createElement( 'td' );
			td.setAttribute( 'data-field', field ); // Add data-field for consistency
			td.innerHTML = `<span class="display-text">${rowData[field]}</span><input class="edit-input" type="text" value="${rowData[field] || ''}" />`;
			newRow.appendChild( td );
		}
	} );
	// Add actions cell (reuse existing HTML or build in JS)
	const actionsTd = document.createElement( 'td' );
	actionsTd.className = 'action-cell';
	actionsTd.innerHTML = `
        <button class="edit-btn">Edit</button>
        <button class="save-btn" style="display:none;">Save</button>
        <button class="cancel-btn" style="display:none;">Cancel</button>
        <form method="post" style="display:inline;">
            <input type="hidden" name="table" value="${payload.table}" />
            <input type="hidden" name="id" value="${rowData.id}" />
            <button type="submit" class="delete-btn">Delete</button>
        </form>
    `;

	newRow.appendChild( actionsTd );
	addRow.parentNode.appendChild( newRow );
	autoSizeAll( table );
	bindActions( newRow );
}


function sendDelete( payload ) {
	fetch( 'db/delete.php', {
		method: 'POST',
		headers: { 'X-Requested-With': 'XMLHttpRequest' },
		body: new URLSearchParams( payload )
	} )
		.then( r => r.json() )
		.then( data => {
			const errorDiv = document.getElementById( 'error-message' );
			if( data.status === 'OK' ) {
				errorDiv.textContent = '';
				const row = document.querySelector( `tr[data-id="${payload.id}"]` );
				if( row ) row.remove();
				const table = document.querySelector( 'table' );
				autoSizeAll( table );
			} else if( data.error ) {
				errorDiv.textContent = 'Error: ' + data.error;
			} else {
				errorDiv.textContent = 'Unknown error';
			}
		} );
}

/**
 * Sends a POST request to update.php with the given URL-encoded payload.
 * Alerts if the response is not 'OK'.
 */
function sendUpdate( payload ) {
	fetch( 'db/update.php', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'X-Requested-With': 'XMLHttpRequest'
		},
		body: new URLSearchParams( payload )
	} )
		.then( r => r.json() )
		.then( data => {
			const errorDiv = document.getElementById( 'error-message' );
			if( data.status === 'OK' ) {
				errorDiv.textContent = '';
				updateTableRow( payload.id, payload ); // You may want to fetch the updated row from backend for accuracy
			} else if( data.error ) {
				errorDiv.textContent = 'Error: ' + data.error;
			} else {
				errorDiv.textContent = 'Unknown error';
			}
		} );
}

// Helper to update a row in the table
function updateTableRow( id, newData ) {
	const row = document.querySelector( `tr[data-id="${id}"]` );
	if( !row ) return;
	Object.keys( newData ).forEach( field => {
		const cell = row.querySelector( `td[data-field="${field}"]` );
		if( cell ) {
			const span = cell.querySelector( '.display-text' );
			const input = cell.querySelector( '.edit-input' );
			if( span ) span.textContent = newData[field];
			if( input ) input.value = newData[field];
		}
	} );
	row.classList.remove( 'editing' );
	const table = row.closest( 'table' );
	autoSizeAll( table );
}

