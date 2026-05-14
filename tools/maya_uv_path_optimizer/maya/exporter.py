from __future__ import annotations

from pathlib import Path

from tools.maya_uv_path_optimizer.core.exporting import ExportPlan, write_json_report


def export_report(report: dict[str, object], destination: Path) -> Path:
    return write_json_report(ExportPlan(destination), report)
