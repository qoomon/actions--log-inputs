# GitHub Event Inputs Action

## Usage
```yaml
jobs:
  example:
    runs-on: ubuntu-latest
    steps:
      - uses: qoomon/actions--event-inputs@v1
```

#### Release New Action Version
- Trigger the [Release workflow](../../actions/workflows/release.yaml)
  - The workflow will create a new release with the given version and also move the related major version tag e.g. `v1` to point to this new release
