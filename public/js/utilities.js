// ─────────────────────────────────────────────
// Resizing Input Fields
// ─────────────────────────────────────────────

export function autoSizeAll( table ) {
	const colCount = table.rows[0]?.cells.length || 0;
	// Optionally skip the last column if it's for actions
	for( let colIndex = 0; colIndex < colCount - 1; colIndex++ ) {
		autoSize( table, colIndex );
	}
}

// This function automatically resizes input fields in a specified column of a table
export function autoSize( table, colIndex ) {

	const cells = Array.from( // get all cells in the specified column
		table.querySelectorAll(
			`tr td:nth-child(${colIndex + 1})` // adjust for 0-based index
		)
	);

	let maxWidth = 0;

	for( const cell of cells ) {
		const elements = [
			...cell.querySelectorAll( 'input, textarea, select' ),
			cell.querySelector( '.display-text' )
		].filter( Boolean );

		for( const el of elements ) {
			const span = document.createElement( 'span' );
			span.textContent = el.value || el.textContent || ' ';
			span.style.visibility = 'hidden';
			span.style.position = 'absolute';
			span.style.whiteSpace = 'pre';
			const style = getComputedStyle( el );
			span.style.font = style.font;
			span.style.fontSize = style.fontSize;
			span.style.fontFamily = style.fontFamily;
			span.style.letterSpacing = style.letterSpacing;
			document.body.appendChild( span );
			const width = span.getBoundingClientRect().width;
			document.body.removeChild( span );

			maxWidth = Math.max( maxWidth, width );
		}
	}

	for( const cell of cells ) {
		const targets = cell.querySelectorAll( 'input, textarea, select' );
		targets.forEach( el => {
			el.style.width = `${maxWidth}px`;
		} );
	}
}


export function getColumnIndex( cell ) {
	if( !cell || !cell.parentNode ) return -1;
	return Array.from( cell.parentNode.children ).indexOf( cell );
}

export function measureSpanWidth( text, el ) {
	const span = document.createElement( 'span' );
	span.textContent = text;
	span.style.visibility = 'hidden';
	span.style.whiteSpace = 'nowrap';

	const style = getComputedStyle( el );
	span.style.font = style.font;
	span.style.fontSize = style.fontSize;
	span.style.fontFamily = style.fontFamily;
	span.style.letterSpacing = style.letterSpacing;

	document.body.appendChild( span );
	const width = span.getBoundingClientRect().width;
	document.body.removeChild( span );

	return width;
}