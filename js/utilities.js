// ─────────────────────────────────────────────
// Resizing Input Fields
// ─────────────────────────────────────────────

/*
export function autoSizeInputs( table, colIndex ) {
	const inputs = Array.from(
		table.querySelectorAll( `tbody tr td:nth-child(${colIndex + 1}) input, tbody tr td:nth-child(${colIndex + 1}) textarea` )
	);

	// 🔍 Log which inputs were selected and their actual column index
	//console.log( `Inputs selected for column ${colIndex}:` );
	inputs.forEach( input => {
		const td = input.closest( 'td' );
		const actualIndex = getColumnIndex( td );
		//console.log( `→ Value: "${input.value}", Actual Column: ${actualIndex}` );
	} );

	// Measure widest input value live
	const maxWidth = inputs.reduce( ( max, input ) => {
		const span = document.createElement( 'span' );
		span.textContent = input.value || ' ';
		span.style.visibility = 'hidden';
		span.style.position = 'absolute';
		span.style.whiteSpace = 'pre';

		const style = getComputedStyle( input );
		span.style.font = style.font;
		span.style.fontSize = style.fontSize;
		span.style.fontFamily = style.fontFamily;
		span.style.letterSpacing = style.letterSpacing;

		document.body.appendChild( span );
		const width = span.getBoundingClientRect().width;
		document.body.removeChild( span );

		return Math.max( max, width );
	}, 0 );

	// Apply to all inputs in column
	for( const input of inputs ) {
		input.style.width = `${maxWidth}px`;
	}
}
*/

export function autoSizeInputs( table, colIndex ) {
	const cells = Array.from( table.querySelectorAll( `tr td:nth-child(${colIndex + 1})` ) );

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