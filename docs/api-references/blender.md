# Blender — API Python (bpy)

## Documentación oficial

- **Índice API (versión actual)**: [Blender Python API](https://docs.blender.org/api/current/index.html)
- **Visión general**: [API Overview](https://docs.blender.org/api/current/info_overview.html)
- **Uso de la referencia**: [API Reference Usage](https://docs.blender.org/api/current/info_api_reference.html)
- La documentación está versionada; para una release concreta de Blender, usar el selector de versión en docs.blender.org o la API embebida en la instalación.

## Módulos clave

| Módulo | Rol |
|--------|-----|
| `bpy` | Punto de entrada, datos, operadores |
| `bpy.types` | Tipos de datos y clases |
| `bpy.context` | Contexto activo (objeto, modo, etc.) |
| `bpy.data` | Acceso a data-blocks del archivo |
| `mathutils` | Vectores, matrices |
| `bpy.props` | Propiedades para addons |

## Tooling

- **Addons**: estructura de paquete Python bajo `scripts/addons`.
- **Testing**: pruebas con Blender en modo batch (`blender -b --python`).

## Notas para catálogo de herramientas

- Especificar **versión menor de Blender** (ej. 4.2 LTS) y si depende de **addons** o **módulos externos** (`PYTHONPATH`).
