from __future__ import annotations

from collections.abc import Callable


class MelBridge:
    def __init__(self, evaluator: Callable[[str], object], allowed_commands: set[str]):
        self._evaluator = evaluator
        self._allowed_commands = allowed_commands

    def execute(self, command: str) -> object:
        command_name = command.split("(", maxsplit=1)[0].split(maxsplit=1)[0].strip("; ")
        if command_name not in self._allowed_commands:
            raise ValueError(f"MEL command '{command_name}' is not allowlisted.")
        return self._evaluator(command)
