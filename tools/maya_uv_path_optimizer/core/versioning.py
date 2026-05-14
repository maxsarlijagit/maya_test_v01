from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import PurePath


@dataclass(frozen=True, order=True)
class Version:
    major: int
    minor: int
    patch: int
    build: int = 0

    def __str__(self) -> str:
        base = f"{self.major}.{self.minor}.{self.patch}"
        if self.build:
            return f"{base}+{self.build}"
        return base


def next_build_version(
    base: Version,
    existing_paths: list[PurePath],
    *,
    artifact_prefix: str = "maya_uv_path_optimizer",
) -> Version:
    pattern = re.compile(
        rf"^{re.escape(artifact_prefix)}_v{base.major}\.{base.minor}\.{base.patch}\+"
        r"(?P<build>\d+)_"
    )
    highest = base.build
    for path in existing_paths:
        match = pattern.search(path.name)
        if match:
            highest = max(highest, int(match.group("build")))
    return Version(base.major, base.minor, base.patch, highest + 1)
