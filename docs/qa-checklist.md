# QA Checklist

Use this checklist before publishing a new build of `maya-uv-path-optimizer`.

1. Open Maya 2027 on Windows and load a representative asset scene.
2. Launch the tool from the MEL shim or shelf command.
3. Select valid meshes and run `Dry Run`; confirm the scene is unchanged.
4. Confirm locked, referenced, empty, non-manifold, and zero-area meshes are reported.
5. Run optimization on a copy of the scene and confirm an undo chunk is created.
6. Verify UVs are within the expected bounds and overlap warnings match the threshold.
7. Export the report twice and confirm filenames increment instead of overwriting.
8. Force a controlled failure and confirm the error log includes scene, user, version, action, and traceback.
# QA Checklist

Use this checklist before publishing a new build of `maya-uv-path-optimizer`.

1. Open Maya 2027 on Windows and load a representative asset scene.
2. Launch the tool from the MEL shim or shelf command.
3. Select valid meshes and run `Dry Run`; confirm the scene is unchanged.
4. Confirm locked, referenced, empty, non-manifold, and zero-area meshes are reported.
5. Run optimization on a copy of the scene and confirm an undo chunk is created.
6. Verify UVs are within the expected bounds and overlap warnings match the threshold.
7. Export the report twice and confirm filenames increment instead of overwriting.
8. Force a controlled failure and confirm the error log includes scene, user, version, action, and traceback.
