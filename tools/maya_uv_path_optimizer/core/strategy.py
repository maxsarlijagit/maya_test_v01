from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

Engine = Literal["python", "mel"]


@dataclass(frozen=True)
class MeshUVState:
    name: str
    has_uvs: bool = True
    uv_overlap_ratio: float = 0.0
    uv_out_of_bounds: bool = False
    is_locked: bool = False
    is_referenced: bool = False


@dataclass(frozen=True)
class StrategyInputs:
    meshes: list[MeshUVState]
    python_available: bool
    mel_available: bool
    overlap_threshold: float = 0.2


@dataclass(frozen=True)
class StrategyDecision:
    engine: Engine
    operation: str
    meshes: tuple[str, ...]
    skipped: dict[str, str]
    warnings: tuple[str, ...] = ()


def choose_strategy(inputs: StrategyInputs) -> StrategyDecision:
    if not inputs.python_available and not inputs.mel_available:
        raise RuntimeError("No supported Maya UV execution path is available.")

    valid_meshes: list[MeshUVState] = []
    skipped: dict[str, str] = {}
    for mesh in inputs.meshes:
        if mesh.is_locked or mesh.is_referenced:
            skipped[mesh.name] = "locked_or_referenced"
        else:
            valid_meshes.append(mesh)

    if not valid_meshes:
        raise ValueError("No valid meshes are available for UV optimization.")

    engine: Engine = "python" if inputs.python_available else "mel"
    needs_full_layout = any(
        (not mesh.has_uvs) or mesh.uv_overlap_ratio >= inputs.overlap_threshold
        for mesh in valid_meshes
    )
    operation = "unfold_layout_repack" if needs_full_layout else "layout_normalize"
    if engine == "mel" and needs_full_layout:
        operation = "create_uvs_layout"

    warnings = ()
    if any(mesh.uv_overlap_ratio >= inputs.overlap_threshold for mesh in valid_meshes):
        warnings = ("High UV overlap detected; full unfold and layout recommended.",)

    return StrategyDecision(
        engine=engine,
        operation=operation,
        meshes=tuple(mesh.name for mesh in valid_meshes),
        skipped=skipped,
        warnings=warnings,
    )
