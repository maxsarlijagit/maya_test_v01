from __future__ import annotations

from types import TracebackType


class SafeMayaOperation:
    """Wrap Maya mutations in an undo chunk and restore selection on failure."""

    def __init__(self, cmds, action_name: str):
        self._cmds = cmds
        self._action_name = action_name
        self._selection: list[str] = []

    def __enter__(self) -> SafeMayaOperation:
        self._selection = self._cmds.ls(selection=True, long=True) or []
        self._cmds.undoInfo(openChunk=True, chunkName=self._action_name)
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        traceback: TracebackType | None,
    ) -> bool:
        try:
            if exc_type is not None:
                self._cmds.select(self._selection, replace=True)
        finally:
            self._cmds.undoInfo(closeChunk=True)
        return False
