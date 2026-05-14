from __future__ import annotations

from dataclasses import asdict
from datetime import UTC, datetime

from tools.maya_uv_path_optimizer.core.strategy import (
    MeshUVState,
    StrategyInputs,
    choose_strategy,
)


def build_dry_run_report(
    *,
    cmds,
    mesh_names: list[str],
    python_available: bool,
    mel_available: bool,
) -> dict[str, object]:
    selection_snapshot = cmds.ls(selection=True, long=True) or []
    decision = choose_strategy(
        StrategyInputs(
            meshes=[MeshUVState(name=name) for name in mesh_names],
            python_available=python_available,
            mel_available=mel_available,
        )
    )
    return {
        "dry_run": True,
        "created_at": datetime.now(UTC).isoformat(),
        "selection": selection_snapshot,
        "strategy": asdict(decision),
    }
