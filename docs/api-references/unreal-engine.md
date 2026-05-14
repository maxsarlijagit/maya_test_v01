# Unreal Engine — Editor scripting con Python

## Documentación oficial

- **Guía principal**: [Scripting the Unreal Editor Using Python](https://dev.epicgames.com/documentation/en-us/unreal-engine/scripting-the-unreal-editor-using-python)
- **Referencia API Python**: [Unreal Python API](https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/) (elige la **versión del motor** en la documentación; UE5.x difiere de UE4).
- **Ejemplos**: repositorio comunitario/epic [ue4plugins/PythonSamples](https://github.com/ue4plugins/PythonSamples) (nombres históricos; verificar compatibilidad con tu UE).

## Plugins necesarios

- Habilitar plugins **Editor Scripting Utilities** / **Python Editor Script Plugin** según la versión del motor (los nombres pueden variar ligeramente entre UE4 y UE5).

## Casos de uso

- Automatización de assets, LODs, colocación en niveles, pipelines DCC → Unreal.

## Notas para catálogo de herramientas

- Fijar **versión exacta de Unreal** (ej. 5.3, 5.4): el API de Python generado refleja módulos del motor.
- Documentar si el script corre **dentro del Editor** y en qué **contexto** (Asset Tools, Level, etc.).
