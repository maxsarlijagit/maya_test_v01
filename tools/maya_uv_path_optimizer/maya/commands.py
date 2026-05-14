from __future__ import annotations


def import_maya_cmds():
    try:
        from maya import cmds  # type: ignore
    except Exception as exc:  # pragma: no cover - only available inside Maya.
        raise RuntimeError("maya.cmds is only available inside Autodesk Maya.") from exc
    return cmds


def selected_meshes(cmds) -> list[str]:
    selected = cmds.ls(selection=True, long=True) or []
    meshes: list[str] = []
    for node in selected:
        shapes = cmds.listRelatives(node, shapes=True, fullPath=True, type="mesh") or []
        meshes.extend(shapes or [node])
    return meshes
