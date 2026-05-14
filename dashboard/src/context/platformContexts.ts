import type { Platform } from '../types'

/** Contexto breve para prompts de IA (alineado a docs/api-references del repo) */
export const PLATFORM_AI_CONTEXT: Record<Platform, string> = {
  maya: `Autodesk Maya: scripting con maya.cmds, Python API 2.0 (OpenMaya), MEL para integración. Documentación por versión en help.autodesk.com/view/MAYAUL/<YEAR>.`,

  blender: `Blender: bpy, bpy.context, bpy.data, bpy.types, mathutils. Docs: docs.blender.org/api/current.`,

  substance_painter: `Substance 3D Painter: plugins Python en carpeta de usuario; export/textura/proyecto. Docs: adobedocs.github.io/painter-python-api y helpx.adobe.com/substance-3d-painter-python.`,

  '3ds_max': `3ds Max: pymxs (runtime MAXScript desde Python), MAXScript. CloudHelp MAXDEV-Python por versión.`,

  unreal: `Unreal Editor: Python API generado; habilitar plugins de Python en el editor. Docs: dev.epicgames.com documentation python-api y scripting-the-unreal-editor-using-python.`,
}
