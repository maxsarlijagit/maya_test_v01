import pytest

from tools.maya_uv_path_optimizer.maya.dry_run import build_dry_run_report
from tools.maya_uv_path_optimizer.maya.mel_bridge import MelBridge
from tools.maya_uv_path_optimizer.maya.safe_ops import SafeMayaOperation


class FakeCmds:
    def __init__(self):
        self.calls = []
        self.selection = ["hero_body"]

    def undoInfo(self, **kwargs):
        self.calls.append(("undoInfo", kwargs))

    def ls(self, selection=False, long=False, type=None):
        self.calls.append(("ls", {"selection": selection, "long": long, "type": type}))
        return list(self.selection)

    def select(self, items, replace=True):
        self.calls.append(("select", tuple(items), replace))
        self.selection = list(items)


def test_safe_operation_wraps_undo_chunk_and_restores_selection_on_error():
    cmds = FakeCmds()

    with pytest.raises(RuntimeError), SafeMayaOperation(cmds, "optimize"):
        cmds.selection = ["changed"]
        raise RuntimeError("boom")

    assert cmds.selection == ["hero_body"]
    assert ("undoInfo", {"openChunk": True, "chunkName": "optimize"}) in cmds.calls
    assert ("undoInfo", {"closeChunk": True}) in cmds.calls


def test_mel_bridge_rejects_commands_outside_allowlist():
    bridge = MelBridge(evaluator=lambda command: command, allowed_commands={"polyAutoProjection"})

    with pytest.raises(ValueError, match="not allowlisted"):
        bridge.execute("deleteAll")


def test_dry_run_report_does_not_mutate_selection_and_returns_strategy():
    cmds = FakeCmds()

    report = build_dry_run_report(
        cmds=cmds,
        mesh_names=["hero_body"],
        python_available=True,
        mel_available=True,
    )

    assert cmds.selection == ["hero_body"]
    assert report["dry_run"] is True
    assert report["strategy"]["engine"] == "python"
    assert report["strategy"]["operation"] == "layout_normalize"
