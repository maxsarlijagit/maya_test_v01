from tools.maya_uv_path_optimizer.core.qa import MeshInspection, validate_meshes
from tools.maya_uv_path_optimizer.core.strategy import (
    MeshUVState,
    StrategyInputs,
    choose_strategy,
)


def test_choose_strategy_skips_locked_referenced_meshes_and_prefers_python_path():
    decision = choose_strategy(
        StrategyInputs(
            meshes=[
                MeshUVState(name="locked_mesh", is_locked=True),
                MeshUVState(name="hero_body", has_uvs=True, uv_overlap_ratio=0.42),
            ],
            python_available=True,
            mel_available=True,
        )
    )

    assert decision.engine == "python"
    assert decision.operation == "unfold_layout_repack"
    assert decision.meshes == ("hero_body",)
    assert decision.skipped == {"locked_mesh": "locked_or_referenced"}
    assert decision.warnings == ("High UV overlap detected; full unfold and layout recommended.",)


def test_choose_strategy_falls_back_to_mel_when_python_path_is_unavailable():
    decision = choose_strategy(
        StrategyInputs(
            meshes=[MeshUVState(name="prop_crate", has_uvs=False)],
            python_available=False,
            mel_available=True,
        )
    )

    assert decision.engine == "mel"
    assert decision.operation == "create_uvs_layout"


def test_validate_meshes_reports_blockers_and_recoverable_warnings():
    report = validate_meshes(
        [
            MeshInspection(name="bad_zero", zero_area_faces=4),
            MeshInspection(name="ref_mesh", is_referenced=True),
            MeshInspection(name="hero_body", uv_overlap_ratio=0.03, uv_out_of_bounds=True),
        ],
        overlap_threshold=0.05,
    )

    assert report.approved is False
    assert report.blockers == {"bad_zero": ("zero_area_faces",), "ref_mesh": ("referenced",)}
    assert report.warnings == {"hero_body": ("uv_out_of_bounds",)}


def test_validate_meshes_approves_clean_meshes():
    report = validate_meshes(
        [MeshInspection(name="hero_body", uv_overlap_ratio=0.01)],
        overlap_threshold=0.05,
    )

    assert report.approved is True
    assert report.blockers == {}
