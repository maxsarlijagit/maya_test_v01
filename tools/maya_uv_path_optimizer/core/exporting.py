from __future__ import annotations

import json
import shutil
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class ExportPlan:
    path: Path


@dataclass(frozen=True)
class CopyPlan:
    source: Path
    destination: Path
    would_overwrite: bool


def _incremented_path(path: Path) -> Path:
    if not path.exists():
        return path
    for index in range(1, 1000):
        candidate = path.with_name(f"{path.stem}_{index:03d}{path.suffix}")
        if not candidate.exists():
            return candidate
    raise RuntimeError(f"No safe destination available for {path}")


def build_copy_plan(*, source: Path, destination: Path) -> CopyPlan:
    safe_destination = _incremented_path(destination)
    return CopyPlan(
        source=source,
        destination=safe_destination,
        would_overwrite=safe_destination == destination and destination.exists(),
    )


def execute_copy(plan: CopyPlan) -> Path:
    plan.destination.parent.mkdir(parents=True, exist_ok=True)
    if plan.would_overwrite:
        raise FileExistsError(f"Refusing to overwrite {plan.destination}")
    return Path(shutil.copy2(plan.source, plan.destination))


def write_json_report(plan: ExportPlan, payload: dict[str, object]) -> Path:
    plan.path.parent.mkdir(parents=True, exist_ok=True)
    plan.path.write_text(
        json.dumps(payload, indent=2, sort_keys=True),
        encoding="utf-8",
    )
    return plan.path
