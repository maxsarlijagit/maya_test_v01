from __future__ import annotations

from dataclasses import asdict
from typing import Protocol

from tools.maya_uv_path_optimizer.core.strategy import (
    MeshUVState,
    StrategyInputs,
    choose_strategy,
)


class PythonUvCommands(Protocol):
    def optimize(self, meshes: tuple[str, ...], operation: str) -> dict[str, object]:
        pass


class UVOptimizer:
    def __init__(self, *, python_uv: PythonUvCommands | None, mel_bridge):
        self._python_uv = python_uv
        self._mel_bridge = mel_bridge

    def optimize(
        self,
        *,
        mesh_names: list[str],
        python_available: bool,
        mel_available: bool,
    ) -> dict[str, object]:
        decision = choose_strategy(
            StrategyInputs(
                meshes=[MeshUVState(name=name) for name in mesh_names],
                python_available=python_available,
                mel_available=mel_available,
            )
        )
        if decision.engine == "python":
            if self._python_uv is None:
                raise RuntimeError("Python UV command adapter is not configured.")
            execution = self._python_uv.optimize(decision.meshes, decision.operation)
        else:
            if self._mel_bridge is None:
                raise RuntimeError("MEL fallback is not configured.")
            for mesh in decision.meshes:
                self._mel_bridge(f"polyAutoProjection {mesh};")
            execution = {
                "engine": "mel",
                "operation": decision.operation,
                "meshes": list(decision.meshes),
            }

        return {
            "status": "optimized",
            "strategy": asdict(decision),
            "execution": execution,
        }
