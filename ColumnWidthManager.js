// ColumnWidthManager.js
// Memoizes column widths per table for fast, rollback-safe access
import { measureSpanWidth } from './utilities.js';

const ColumnWidthManager = ( () => {
	const map = new WeakMap();

	function get( table, i ) {
		if( !map.has( table ) ) compute( table );
		return map.get( table )?.[i] ?? 0;
	}

	function invalidate( table ) {
		map.delete( table );
	}

	function refresh( table ) {
		invalidate( table );
		return compute( table );
	};

	// Returns: Array of max widths for each column, based on visible text content
	function compute( table ) {

		// table.rows[0]:	First row of table
		// ?.cells:				Access <td> or <th> elements (optional chaining for safety)
		// || []:					Fall back to empty arraw if .cells is nullish (ensures valid iterable)
		// ( _, i ):			Ignore cell value, use index to compute max column width

		const widths = Array.from(
			table.rows[0]?.cells || [],
			( _, i ) => getMaxColumnTextWidth( table, i )
		);
		map.set( table, widths );
	}

	function getMaxColumnTextWidth( table, columnIndex ) {
		return Array.from( table.querySelectorAll( 'tbody tr' ) ).reduce( ( max, row ) => {
			const cell = row.children[columnIndex];
			if( !cell ) return max;

			// Prefer input or textarea value if present
			const input = cell.querySelector( 'input, textarea' );
			const text = input?.value ?? cell.textContent;

			return Math.max( max, measureSpanWidth( text, cell ) );
		}, 0 );
	}


	return { get, compute, invalidate, refresh };
} )();
window.ColumnWidthManager = ColumnWidthManager;

export default ColumnWidthManager;