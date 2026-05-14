from __future__ import annotations

from dataclasses import dataclass, field
from typing import Generic, TypeVar

T = TypeVar("T")


@dataclass(frozen=True)
class Success(Generic[T]):
    value: T
    warnings: tuple[str, ...] = ()
    ok: bool = field(default=True, init=False)


@dataclass(frozen=True)
class Failure:
    message: str
    code: str
    details: dict[str, object] | None = None
    ok: bool = field(default=False, init=False)
