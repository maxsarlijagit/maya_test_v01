from __future__ import annotations

import re
from dataclasses import dataclass

from tools.maya_uv_path_optimizer.core.versioning import Version


@dataclass(frozen=True)
class ToolName:
    package: str
    repository: str
    display: str


@dataclass(frozen=True)
class BuildArtifact:
    stem: str
    filename: str


def _slug(value: str, separator: str) -> str:
    normalized = re.sub(r"[^A-Za-z0-9]+", separator, value.strip()).strip(separator)
    return re.sub(rf"{re.escape(separator)}+", separator, normalized).lower()


def normalize_tool_name(name: str) -> ToolName:
    words = re.findall(r"[A-Za-z0-9]+", name)
    display = " ".join(word.capitalize() if not word.isupper() else word for word in words)
    repository = _slug(name, "-")
    return ToolName(package=repository.replace("-", "_"), repository=repository, display=display)


def make_artifact_name(
    *,
    asset_name: str,
    task: str,
    version: Version,
    timestamp: str,
    extension: str,
) -> BuildArtifact:
    suffix = extension if extension.startswith(".") else f".{extension}"
    stem = f"{_slug(asset_name, '_')}_{_slug(task, '_')}_v{version}_{timestamp}"
    return BuildArtifact(stem=stem, filename=f"{stem}{suffix}")
