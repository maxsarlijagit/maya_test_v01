from tools.maya_uv_path_optimizer.maya.optimizer import UVOptimizer


class FakePythonUvCommands:
    def __init__(self):
        self.optimized = []

    def optimize(self, meshes, operation):
        self.optimized.append((tuple(meshes), operation))
        return {"engine": "python", "operation": operation, "meshes": list(meshes)}


def test_optimizer_uses_strategy_decision_and_returns_execution_report():
    python_uv = FakePythonUvCommands()
    optimizer = UVOptimizer(python_uv=python_uv, mel_bridge=None)

    report = optimizer.optimize(
        mesh_names=["hero_body"],
        python_available=True,
        mel_available=False,
    )

    assert python_uv.optimized == [(("hero_body",), "layout_normalize")]
    assert report["status"] == "optimized"
    assert report["execution"]["engine"] == "python"


def test_optimizer_uses_mel_fallback_when_python_path_is_unavailable():
    calls = []
    optimizer = UVOptimizer(
        python_uv=None,
        mel_bridge=lambda command: calls.append(command),
    )

    report = optimizer.optimize(
        mesh_names=["prop_crate"],
        python_available=False,
        mel_available=True,
    )

    assert calls == ["polyAutoProjection prop_crate;"]
    assert report["execution"]["engine"] == "mel"
