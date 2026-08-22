# SDK Release Approval Runbook

Last updated: 2026-06-25

Use this when Fern generates an SDK release PR or when a Vapi employee needs to manually start an SDK release.

## Slack notification

- Channel: `#production-release-observability`
- Slack app: `Vapi Release Observability`
- GitHub secret name: `PRODUCTION_RELEASE_OBSERVABILITY_SLACK_WEBHOOK`

Each SDK repo that should notify Slack needs a repository secret named `PRODUCTION_RELEASE_OBSERVABILITY_SLACK_WEBHOOK`. The secret value is the Slack workflow webhook URL.

```bash
gh secret set PRODUCTION_RELEASE_OBSERVABILITY_SLACK_WEBHOOK --repo VapiAI/<sdk-repo>
```

Expected alert:

```text
SDK release PR ready for review
Repo: VapiAI/<sdk-repo>
PR: #123 <title>
Package: <registry package>
Version: <version if detected>
Next: review/merge the PR, then publish the release tag from the SDK repo.
Runbook: <this file>
```

## Default release path

1. Fern or a release workflow opens an SDK PR with generated changes and a version bump.
2. Slack posts the PR alert to `#production-release-observability`.
3. Open the PR from Slack and review:
   - version bump matches the intended release
   - generated changelog/package files are sane
   - CI is green
4. Merge the SDK PR into `main`.
5. Create the release tag from the SDK repo.
6. Verify the package appears in the registry.

Do not rely on Fern pushing directly to `main` as the release path. Branch protection means the approval boundary is the SDK PR.

## Start a release PR manually

Use this when docs/API changes are ready but Fern has not opened the SDK PR you expected.

1. Open `VapiAI/docs` in GitHub.
2. Go to `Actions`.
3. Select the SDK release workflow:
   - `Release TypeScript SDK`
   - `Release Python SDK`
   - `Release Go SDK`
   - `Release Ruby SDK`
   - `Release C# SDK`
   - `Release PHP SDK`
   - `Release Swift SDK`
4. Click `Run workflow`.
5. Enter the intended version when the workflow asks for one.
6. Wait for Fern to open the SDK PR.
7. Follow the default release path above.

These workflows run Fern with `--mode pull-request`, so they should open a PR rather than publishing directly.

## Publish after merge

After the SDK PR is merged, publish from the SDK repo by creating a GitHub release/tag at the merged `main` commit.

GitHub UI path:

1. Open the SDK repo.
2. Go to `Releases`.
3. Click `Draft a new release`.
4. Create the tag for the merged version.
5. Target `main`.
6. Publish the release.
7. Watch the SDK repo's `Actions` tab and confirm the publish job passes, when one exists.

CLI equivalent:

```bash
gh release create <tag> --repo VapiAI/<sdk-repo> --target main --title <tag> --generate-notes
```

Use the repo's existing tag convention:

| SDK repo | Package | Tag convention | Publish/verify signal |
| --- | --- | --- | --- |
| `server-sdk-typescript` | `@vapi-ai/server-sdk` on npm | usually `<version>` | `ci` tag push publishes to npm |
| `server-sdk-python` | `vapi_server_sdk` on PyPI | usually `<version>` | `ci` tag push publishes to PyPI |
| `server-sdk-ruby` | `vapi_server_sdk` on RubyGems | usually `<version>` | `ci` tag push publishes to RubyGems |
| `server-sdk-csharp` | `Vapi.Net` on NuGet | usually `<version>` | `ci` tag push publishes to NuGet |
| `server-sdk-java` | Maven package | usually `<version>` | `ci` tag push publishes to Maven |
| `server-sdk-go` | Go module | `v<version>` | Git tag is the release source for Go modules |
| `server-sdk-php` | `vapi/vapi` on Packagist | usually `<version>` | Packagist follows tags; CI currently build/tests only |
| `server-sdk-swift` | Swift package | usually `<version>` | Git tag is the release source for Swift Package Manager |

## If the package does not publish

1. Confirm the release tag points at the merged `main` commit.
2. Open the SDK repo's `Actions` tab.
3. Check the `ci` run for the tag.
4. If the tag exists but no publish job ran, confirm that repo has a tag-push publish job.
5. If the publish job failed, rerun the failed job after fixing the missing credential or registry issue.
6. If the repo has no publish job, verify the registry integration for that ecosystem.

## Current Fern-managed SDKs

The current Fern generator config in `VapiAI/docs` manages these server SDK repos:

- `VapiAI/server-sdk-typescript`
- `VapiAI/server-sdk-python`
- `VapiAI/server-sdk-go`
- `VapiAI/server-sdk-ruby`
- `VapiAI/server-sdk-csharp`
- `VapiAI/server-sdk-php`
- `VapiAI/server-sdk-swift`

`VapiAI/server-sdk-java` exists and has a tag-push publish job, but it is not currently listed in the `VapiAI/docs` Fern generator config.
