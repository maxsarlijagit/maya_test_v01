from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class MeshInspection:
    name: str
    zero_area_faces: int = 0
    non_manifold_edges: int = 0
    uv_overlap_ratio: float = 0.0
    uv_out_of_bounds: bool = False
    is_locked: bool = False
    is_referenced: bool = False


@dataclass(frozen=True)
class QAReport:
    approved: bool
    blockers: dict[str, tuple[str, ...]]
    warnings: dict[str, tuple[str, ...]]


def validate_meshes(
    meshes: list[MeshInspection],
    *,
    overlap_threshold: float,
) -> QAReport:
    blockers: dict[str, tuple[str, ...]] = {}
    warnings: dict[str, tuple[str, ...]] = {}

    for mesh in meshes:
        mesh_blockers: list[str] = []
        mesh_warnings: list[str] = []
        if mesh.zero_area_faces > 0:
            mesh_blockers.append("zero_area_faces")
        if mesh.non_manifold_edges > 0:
            mesh_blockers.append("non_manifold")
        if mesh.is_locked:
            mesh_blockers.append("locked")
        if mesh.is_referenced:
            mesh_blockers.append("referenced")
        if mesh.uv_overlap_ratio >= overlap_threshold:
            mesh_warnings.append("uv_overlap")
        if mesh.uv_out_of_bounds:
            mesh_warnings.append("uv_out_of_bounds")

        if mesh_blockers:
            blockers[mesh.name] = tuple(mesh_blockers)
        if mesh_warnings:
            warnings[mesh.name] = tuple(mesh_warnings)

    return QAReport(approved=not blockers, blockers=blockers, warnings=warnings)
