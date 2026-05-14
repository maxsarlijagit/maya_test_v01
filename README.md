# Maya UV Path Optimizer

Production-ready Maya 2027 tool for Windows that selects a safe optimization path for UV workflows, supports dry runs, validates QA, logs errors, and exports/copies reports without overwriting existing output.

## Compatibility

- Autodesk Maya 2027 on Windows.
- Maya embedded Python and PySide2/PySide6.
- Local development tests use standard Python with `pytest` and `ruff`.

## Install In Maya

1. Place this repository on a shared tools path.
2. Add the repository root to `PYTHONPATH` for Maya.
3. Source `tools/maya_uv_path_optimizer/mel/maya_uv_path_optimizer.mel`.
4. Run `mayaUvPathOptimizer();` from MEL or attach it to a shelf button.

## Workflow

1. Select one or more mesh transforms or mesh shapes.
2. Click `Dry Run` to inspect selection, choose the Python/MEL path, and preview QA risk.
3. Review warnings and blockers in the report panel.
4. Run optimization only after dry run review.
5. Export or copy reports using versioned filenames.

## Safety Model

- Dry run does not mutate the scene.
- Destructive operations must go through a safe operation wrapper.
- Undo chunks are opened for Maya mutations.
- Selection is restored after errors.
- MEL fallback is allowlisted.
- Locked, referenced, or invalid meshes are skipped or blocked with explicit reasons.
- Export/copy operations avoid overwrites by incrementing filenames.

## Naming Convention

Project repository: `maya-uv-path-optimizer`.

Python package: `maya_uv_path_optimizer`.

Artifacts:

```text
asset_task_vmajor.minor.patch+build_YYYYMMDD_HHMMSS.ext
```

Example:

```text
hero_robot_uv_optimize_v1.2.3+4_20270513_231500.json
```

## Development

Run tests:

```bash
uv run --with pytest pytest
```

Run lint:

```bash
uv run --with ruff ruff check .
```

Format:

```bash
uv run --with ruff ruff format .
```

## Structure

- `tools/maya_uv_path_optimizer/core/`: testable logic outside Maya.
- `tools/maya_uv_path_optimizer/maya/`: Maya command wrappers, dry run, optimizer, MEL bridge, export helpers.
- `tools/maya_uv_path_optimizer/ui/`: PySide window and design tokens.
- `tools/maya_uv_path_optimizer/mel/`: MEL shelf/menu shim.
- `tools/maya_uv_path_optimizer/resources/`: presets and static assets.
- `tests/`: unit tests using fakes for Maya integration.
- `docs/`: QA, naming, and release notes.

For new tools, create `tools/<tool_name>/` and follow the same subfolder convention.
