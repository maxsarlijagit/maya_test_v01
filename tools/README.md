# Tools Folder Convention

Each production tool lives in `tools/<tool_name>/` with focused subfolders:

- `core/`: pure Python logic that can run outside Maya.
- `maya/`: Maya adapters, safe command wrappers, MEL bridges, and exporters.
- `ui/`: PySide/Qt windows and reusable UI components.
- `mel/`: shelf/menu entry points.
- `resources/`: presets, icons, and static templates.
- `logs/` and `exports/`: local runtime output ignored by git.

New tools should follow snake_case package names and kebab-case GitHub repository names.
