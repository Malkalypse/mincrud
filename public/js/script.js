import { getColumnIndex, autoSize, autoSizeAll } from './utilities.js';

/*
Operation handling:
------------------------------------------------------------------
Listener	Typical Pattern		Why?
------------------------------------------------------------------
Add				Direct binding		Only one, static element
Delete		Event delegation	Many, dynamic elements
Save			Per-row binding		Dynamic, not a form, needs row context
------------------------------------------------------------------
*/

// ─────────────────────────────────────────────
// Initialization Functions
// ─────────────────────────────────────────────

document.addEventListener( 'DOMContentLoaded', () => {
	const table = document.querySelector( 'table' );
	if( !table ) return;

	initActions( table );
	initAutosize( table );
	setupAddForm();
	setupDeleteHandler();
} );

// Bind actions for initial table rows
function initActions( table ) {
	autoSizeAll( table );
	table.querySelectorAll( 'tr' ).forEach( row => {
		if( !row.classList.contains( 'add-row' ) ) bindActions( row );
	} );
}

// Initial auto-sizing for table inputs
function initAutosize( table ) {
	table.addEventListener( 'input', e => {
		const td = e.target.closest( 'td' );
		if( !td ) return;
		autoSize( table, getColumnIndex( td ) );
	} );
}

// Setup the [Add] form submission handler
function setupAddForm() {
	const addForm = document.getElementById( 'add-form' );

	if( addForm ) {
		addForm.addEventListener( 'submit', function ( e ) {
			e.preventDefault();
			const payload = getFormPayload( addForm );
			sendInsert( payload );
		} );
	}
}

// Setup the [Delete] form submission handler
function setupDeleteHandler() {
	document.body.addEventListener( 'submit', function ( e ) {
		const deleteForm = e.target;

		if( deleteForm.querySelector( 'button.delete-btn' ) ) {
			e.preventDefault();
			const payload = getFormPayload( deleteForm );
			if( confirm( 'Delete this row?' ) ) sendDelete( payload );
		}
	} );
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

// Sends a POST request to insert.php with the given URL-encoded payload.
function sendInsert( payload ) {
	fetch( 'api/insert.php', {
		method: 'POST',
		headers: { 'X-Requested-With': 'XMLHttpRequest' },
		body: new URLSearchParams( payload )
	} )
		.then( r => r.json() )
		.then( data => {
			const errorDiv = document.getElementById( 'error-message' );
			if( data.status === 'OK' && data.row ) {
				errorDiv.textContent = '';
				addTableRow( data.row, payload );
				document.querySelectorAll( '.add-input' ).forEach( input => input.value = '' );
			} else if( data.error ) {
				errorDiv.textContent = 'Error: ' + data.error;
			} else {
				errorDiv.textContent = 'Unknown error';
			}
		} );
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

// Bind actions to edit, save, and cancel buttons
function bindActions( row ) {

	// Define action button handlers
	const actions = [
		{ selector: '.edit-btn', handler: () => enterEditMode( row ) },
		{ selector: '.save-btn', handler: () => saveRow( row ) },
		{ selector: '.cancel-btn', handler: () => cancelEdit( row ) }
	];

	// Apply event listeners
	actions.forEach( ( { selector, handler } ) => {
		const btn = row.querySelector( selector );
		if( btn ) btn.addEventListener( 'click', handler );
	} );
}

// Sends a POST request to delete.php with the given URL-encoded payload.
function sendDelete( payload ) {
	fetch( 'api/delete.php', {
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

// Sends a POST request to update.php with the given URL-encoded payload.
function sendUpdate( payload ) {
	fetch( 'api/update.php', {
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

function getFormPayload( form ) {
	const formData = new FormData( form );
	return Object.fromEntries( formData.entries() );
}
