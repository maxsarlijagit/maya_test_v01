from __future__ import annotations

import getpass
import logging
import traceback
from datetime import UTC, datetime
from logging.handlers import RotatingFileHandler
from pathlib import Path


def create_error_log_record(
    *,
    action: str,
    error: BaseException,
    scene_path: str,
    user: str | None,
    tool_version: str,
) -> dict[str, str]:
    return {
        "timestamp": datetime.now(UTC).isoformat(),
        "action": action,
        "scene_path": scene_path,
        "user": user or getpass.getuser(),
        "tool_version": tool_version,
        "error_type": type(error).__name__,
        "message": str(error),
        "traceback": "".join(traceback.format_exception(error)),
    }


def configure_file_logger(log_dir: Path, *, logger_name: str) -> logging.Logger:
    log_dir.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger(logger_name)
    logger.setLevel(logging.INFO)
    if not logger.handlers:
        handler = RotatingFileHandler(
            log_dir / f"{logger_name}.log",
            maxBytes=1_000_000,
            backupCount=5,
            encoding="utf-8",
        )
        handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
        logger.addHandler(handler)
    return logger
