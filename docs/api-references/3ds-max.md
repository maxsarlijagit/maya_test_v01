# Autodesk 3ds Max — Python (pymxs) y MAXScript

## Documentación oficial

- **pymxs (introducción)**: [pymxs API Introduction](https://help.autodesk.com/cloudhelp/2026/ENU/MAXDEV-Python/files/MAXDEV_Python_pymxs_api_introduction_html.html) — ajustar año (`2026`, etc.) según la versión de Max en el portal CloudHelp.
- **Ejecutar MAXScript desde Python**: [Executing MAXScript from Python](https://help.autodesk.com/cloudhelp/2026/ENU/MAXDEV-Python/files/MAXDEV_Python_executing_maxscript_from_python_html.html)
- **Novedades Python en Max**: buscar en CloudHelp `MAXDEV-Python` para la versión instalada (ej. “What's New in 3ds Max Python”).

## Modelo mental

- **pymxs** envuelve el motor **MAXScript**; `pymxs.runtime` expone globales de MAXScript a Python.
- Contextos: `pymxs.undo()`, `pymxs.animate()`, `pymxs.attime()`, etc.
- MAXScript sigue siendo referencia para muchas APIs expuestas.

## Tooling

- **Stubs / IDE**: comunidad mantiene stubs de tipo (p. ej. `pymxs_stubs` en GitHub) para autocompletado.
- **Deprecación**: MaxPlus está obsoleto; preferir **pymxs** en versiones recientes.

## Notas para catálogo de herramientas

- Indicar **3ds Max año** y si el código usa **solo pymxs** o scripts **MAXScript** embebidos.
