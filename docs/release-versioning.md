# Release And Versioning

The tool uses semantic versioning plus a local build number:

```text
major.minor.patch+build
```

- `major`: breaking workflow or API changes.
- `minor`: new compatible capabilities.
- `patch`: fixes and QA improvements.
- `build`: auto-incremented for exported artifacts and controlled release outputs.

The version shown in the Maya UI should match the package release. Exported reports include the full build string so artists and TDs can trace which tool produced a result.
