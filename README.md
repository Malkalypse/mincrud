# mincrud

Minimal, inspectable PHP/MySQL CRUD app with modular structure and rollback-safe workflows. Designed for clarity, not cleverness.

## Philosophy

- 🧩 Modular: Each feature lives in its own file. No monoliths.
- 🔍 Inspectable: No frameworks, no magic. Just plain PHP and SQL.
- 🛠️ Config-driven: Behavior adapts via config, not hardcoded logic.
- 🧪 Rollback-safe: Every edit is testable, reversible, and logged.

## Features

- View, edit, and delete rows from any MySQL table
- Configurable field types and display logic
- Centralized toggle for edit/view modes
- Selector-agnostic input handling
- Semantic wrappers for clarity and reuse

## File Structure

```
mincrud/
├── config.php         # Table + field config
├── db.php             # Connection + query helpers
├── index.php          # Entry point
├── view.php           # Read-only display
├── edit.php           # Editable form
├── save.php           # Update logic
├── delete.php         # Row deletion
├── helpers/
│   ├── render_field.php   # Field rendering logic
│   ├── sanitize.php       # Input sanitization
│   └── toggle_mode.php    # Edit/view toggle
└── assets/
    └── style.css          # Minimal styling
```

## Setup

1. Clone repo and configure `config.php` with your DB credentials and table schema.
2. Point your browser to `index.php`.
3. Toggle between view/edit modes using the button.
4. Edit fields, save changes, or delete rows.

## License

MIT — use it, fork it, extend it.
