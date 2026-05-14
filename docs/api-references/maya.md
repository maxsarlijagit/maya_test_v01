# Autodesk Maya — API y scripting

## Documentación oficial

- **Python API 2.0 (referencia)**: [Python API Reference](https://help.autodesk.com/view/MAYAUL/2024/ENU/?guid=MAYA_API_REF_py_ref_index_html) — sustituir `2024` en la URL por el año de Maya objetivo (p. ej. 2025, 2026, 2027) para la guía alineada a la versión.
- **MEL y comandos**: [Command reference](https://help.autodesk.com/view/MAYAUL/2024/ENU/?guid=GUID-55B63946-CDC9-42E5-9B6E-45EE45CFC7FC) (ajustar versión en la ayuda).
- **Novedades API / guías de actualización**: [Maya API Update Guide (blog)](https://blog.autodesk.io/maya-2024-api-update-guide/) y portal de ayuda por versión.

## Superficies típicas de integración

| Superficie | Uso |
|------------|-----|
| `maya.cmds` | Comandos de alto nivel, scripts de artista |
| `OpenMaya` / API 2.0 | Nodos, DG, extensiones de bajo nivel |
| `maya.api.OpenMaya` (API 2.0) | Python API 2.0 recomendada para nuevo código cuando aplique |
| MEL | Puentes desde MEL a Python, shelves, legacy |

## Tooling

- **Maya DevKit / SDK**: necesario para compilar plugins C++; documentación empaquetada con la instalación o portal Autodesk.
- **Python embebido**: versión acorde al año de Maya; pruebas fuera de Maya con mocks (como en este repo).

## Notas para catálogo de herramientas

- Indicar **versión mínima y máxima de Maya** probada.
- Documentar si el tool usa **cmd**, **API 2.0** o **MEL bridge**.
