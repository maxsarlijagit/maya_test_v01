import json

from tools.maya_uv_path_optimizer.core.exporting import (
    CopyPlan,
    ExportPlan,
    build_copy_plan,
    write_json_report,
)
from tools.maya_uv_path_optimizer.core.logging import create_error_log_record
from tools.maya_uv_path_optimizer.core.result import Failure, Success


def test_success_and_failure_results_are_explicit():
    success = Success(value={"meshes": 2})
    failure = Failure(message="Selection is empty", code="empty_selection")

    assert success.ok is True
    assert failure.ok is False
    assert failure.code == "empty_selection"


def test_error_log_record_contains_scene_user_tool_version_and_traceback():
    try:
        raise RuntimeError("maya command failed")
    except RuntimeError as exc:
        record = create_error_log_record(
            action="optimize",
            error=exc,
            scene_path=r"C:\show\shot010.ma",
            user="artist",
            tool_version="1.0.0+3",
        )

    assert record["action"] == "optimize"
    assert record["scene_path"] == r"C:\show\shot010.ma"
    assert record["user"] == "artist"
    assert record["tool_version"] == "1.0.0+3"
    assert "RuntimeError: maya command failed" in record["traceback"]


def test_build_copy_plan_rejects_overwrite_without_incremented_destination(tmp_path):
    source = tmp_path / "report.json"
    source.write_text("{}", encoding="utf-8")
    existing_destination = tmp_path / "report.json"

    plan = build_copy_plan(source=source, destination=existing_destination)

    assert plan == CopyPlan(
        source=source,
        destination=tmp_path / "report_001.json",
        would_overwrite=False,
    )


def test_write_json_report_exports_structured_payload(tmp_path):
    plan = ExportPlan(path=tmp_path / "qa_report.json")
    write_json_report(plan, {"approved": True, "meshes": ["hero_body"]})

    assert json.loads(plan.path.read_text(encoding="utf-8")) == {
        "approved": True,
        "meshes": ["hero_body"],
    }
