# Naming Convention

Repository names use kebab-case: `maya-uv-path-optimizer`.

Python packages use snake_case: `maya_uv_path_optimizer`.

Runtime artifacts use:

```text
asset_task_vmajor.minor.patch+build_YYYYMMDD_HHMMSS.ext
```

Example:

```text
hero_robot_uv_optimize_v1.2.3+4_20270513_231500.json
```

Never overwrite exported reports or copied outputs. Increment the build or append a numeric suffix.
