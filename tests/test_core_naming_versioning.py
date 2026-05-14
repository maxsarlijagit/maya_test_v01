from pathlib import PureWindowsPath

from tools.maya_uv_path_optimizer.core.naming import (
    BuildArtifact,
    ToolName,
    make_artifact_name,
    normalize_tool_name,
)
from tools.maya_uv_path_optimizer.core.versioning import Version, next_build_version


def test_normalize_tool_name_uses_github_safe_kebab_case():
    assert normalize_tool_name("Maya UV Path Optimizer!") == ToolName(
        package="maya_uv_path_optimizer",
        repository="maya-uv-path-optimizer",
        display="Maya UV Path Optimizer",
    )


def test_make_artifact_name_contains_asset_task_version_and_timestamp():
    artifact = make_artifact_name(
        asset_name="Hero Robot",
        task="UV Optimize",
        version=Version(major=1, minor=2, patch=3, build=4),
        timestamp="20270513_231500",
        extension=".json",
    )

    assert artifact == BuildArtifact(
        stem="hero_robot_uv_optimize_v1.2.3+4_20270513_231500",
        filename="hero_robot_uv_optimize_v1.2.3+4_20270513_231500.json",
    )


def test_next_build_version_increments_highest_existing_artifact_build():
    existing = [
        PureWindowsPath(r"C:\show\maya_uv_path_optimizer_v1.2.3+1_20270513_230000.json"),
        PureWindowsPath(r"C:\show\maya_uv_path_optimizer_v1.2.3+7_20270513_230000.json"),
        PureWindowsPath(r"C:\show\other_v1.2.3+99_20270513_230000.json"),
    ]

    assert next_build_version(Version(1, 2, 3), existing).build == 8
