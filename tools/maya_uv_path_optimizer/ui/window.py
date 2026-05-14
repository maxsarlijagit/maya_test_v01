from __future__ import annotations

import json

from tools.maya_uv_path_optimizer.core.versioning import Version
from tools.maya_uv_path_optimizer.maya.commands import import_maya_cmds, selected_meshes
from tools.maya_uv_path_optimizer.maya.dry_run import build_dry_run_report
from tools.maya_uv_path_optimizer.ui.theme import stylesheet

try:  # pragma: no cover - Maya 2027 usually ships a Qt binding.
    from PySide6 import QtWidgets
except Exception:  # pragma: no cover
    from PySide2 import QtWidgets  # type: ignore


class ToolWindow(QtWidgets.QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self._cmds = import_maya_cmds()
        self._version = Version(0, 1, 0)
        self.setWindowTitle(f"Maya UV Path Optimizer v{self._version}")
        self.setMinimumWidth(520)
        self.setStyleSheet(stylesheet())
        self._build_layout()

    def _build_layout(self) -> None:
        layout = QtWidgets.QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(16)

        header = QtWidgets.QLabel("Safe UV optimization for selected meshes")
        header.setStyleSheet("font-size: 18px; font-weight: 600;")
        layout.addWidget(header)

        selection_box = QtWidgets.QGroupBox("Selection")
        selection_layout = QtWidgets.QVBoxLayout(selection_box)
        self.selection_label = QtWidgets.QLabel("No dry run executed yet.")
        selection_layout.addWidget(self.selection_label)
        layout.addWidget(selection_box)

        actions = QtWidgets.QHBoxLayout()
        dry_run_button = QtWidgets.QPushButton("Dry Run")
        dry_run_button.clicked.connect(self.run_dry_run)
        actions.addWidget(dry_run_button)
        optimize_button = QtWidgets.QPushButton("Optimize")
        optimize_button.setEnabled(False)
        actions.addWidget(optimize_button)
        layout.addLayout(actions)

        self.log_panel = QtWidgets.QTextEdit()
        self.log_panel.setReadOnly(True)
        layout.addWidget(self.log_panel)

    def run_dry_run(self) -> None:
        try:
            meshes = selected_meshes(self._cmds)
            report = build_dry_run_report(
                cmds=self._cmds,
                mesh_names=meshes,
                python_available=True,
                mel_available=True,
            )
            self.selection_label.setText(f"{len(meshes)} mesh item(s) selected")
            self.log_panel.setPlainText(json.dumps(report, indent=2, sort_keys=True))
        except Exception as exc:
            self.log_panel.setPlainText(f"Dry run failed: {exc}")


def show() -> ToolWindow:
    window = ToolWindow()
    window.show()
    return window
