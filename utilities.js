// ─────────────────────────────────────────────
// Resizing Input Fields
// ─────────────────────────────────────────────

// Attach live width sync to input based on its text content
/*
export function autoSizeInput( input ) {

  // Measure width using hidden span with matched font
  function updateWidth() {
    const width = measureSpanWidth( input.value, input );
    input.style.width = width + 'px';
  }

  // Sync width on input and initialize
  input.addEventListener( 'input', updateWidth );
  updateWidth();
}
*/
export function autoSizeInput( input, colIndex ) {
  const table = input.closest( 'table' );
  const manager = ColumnWidthManager;
  const memoizedWidth = manager.get( table, colIndex );

  // Measure current input value
  const span = document.createElement( 'span' );
  span.style.visibility = 'hidden';
  span.style.position = 'absolute';
  span.style.whiteSpace = 'pre';
  span.textContent = input.value;
  document.body.appendChild( span );

  const measuredWidth = span.offsetWidth; //+ 20; // padding buffer
  document.body.removeChild( span );

  // Final width is max of memoized and measured
  const finalWidth = Math.max( memoizedWidth, measuredWidth );
  input.style.width = `${finalWidth}px`;
}

export function updateColumnInputWidths(table, colIndex) {
	const inputs = Array.from(table.querySelectorAll(`tbody tr td:nth-child(${colIndex + 1}) input, tbody tr td:nth-child(${colIndex + 1}) textarea`));

	// Measure widest input value
	const maxWidth = inputs.reduce((max, input) => {
		const span = document.createElement('span');
		span.style.visibility = 'hidden';
		span.style.position = 'absolute';
		span.style.whiteSpace = 'pre';
		span.textContent = input.value;
		document.body.appendChild(span);
		const width = span.offsetWidth;
		document.body.removeChild(span);
		return Math.max(max, width);
	}, 0);

	// Apply to all inputs in column
	for (const input of inputs) {
		const memoized = ColumnWidthManager.get(table, colIndex);
		const finalWidth = Math.max(memoized, maxWidth);
		input.style.width = `${finalWidth}px`;
	}
}


/*
export function autoGrowInput(input, minWidth = 0) {
  const contentWidth = measureSpanWidth(input.value, input);
  const finalWidth = Math.max(contentWidth, minWidth);
  input.style.width = `${finalWidth}px`;
}
*/

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