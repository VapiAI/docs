# Vapi Platform Documentation

This repository contains the source files for the documentation found at [docs.vapi.ai](https://docs.vapi.ai/). 

Get started with Vapi here: [docs.vapi.ai/introduction](https://docs.vapi.ai/introduction)

View the API Reference here: [docs.vapi.ai/api-reference](https://docs.vapi.ai/api-reference/)

Explore our Client and Server SDKs here: [docs.vapi.ai/sdks](https://docs.vapi.ai/sdks)

| Vapi Developer Ecosystem  |  |
|--------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Real-time SDKs** | [Web](https://github.com/VapiAI/web) · [Flutter](https://github.com/VapiAI/flutter) · [React Native](https://github.com/VapiAI/react-native-sdk) · [iOS](https://github.com/VapiAI/ios) · [Python](https://github.com/VapiAI/python) · [Vanilla](https://github.com/VapiAI/html-script-tag) |
| **Client Examples** | [Next.js](https://github.com/VapiAI/client-side-example-javascript-next) · [React](https://github.com/VapiAI/client-side-example-javascript-react) · [Flutter](https://github.com/VapiAI/flutter/tree/main/example) · [React Native](https://github.com/VapiAI/client-side-example-react-native) |
| **Server Examples** | [Vercel](https://github.com/VapiAI/server-side-example-serverless-vercel) · [Cloudflare](https://github.com/VapiAI/server-side-example-serverless-cloudflare) · [Supabase](https://github.com/VapiAI/server-side-example-serverless-supabase) · [Node](https://github.com/VapiAI/server-side-example-javascript-node) · [Bun](https://github.com/VapiAI/server-side-example-javascript-bun) · [Deno](https://github.com/VapiAI/server-side-example-javascript-deno) · [Flask](https://github.com/VapiAI/server-side-example-python-flask) · [Laravel](https://github.com/VapiAI/server-side-example-php-laravel) · [Go](https://github.com/VapiAI/server-side-example-go-gin) · [Rust](https://github.com/VapiAI/server-side-example-rust-actix) |
| **Resources** | [Official Docs](https://docs.vapi.ai/) · [API Reference](https://api.vapi.ai/api) |
| **Community** | [Videos](/community/videos) · [UI Library](https://www.vapiblocks.com/) |

## How can I contribute to these docs?

You can suggest edits by making a pull request.

## How to update documentation?

### Local Development server

To run a local development server with hot-reloading you can run the following command

```sh
npm install -g fern-api
fern docs dev
```

#### Hosted URL

To update your documentation on a hosted URL, run
```
# npm install -g fern-api
fern generate --docs
```
To preview your documentation, run
```
# npm install -g fern-api
fern generate --docs --preview
```
The repository contains GitHub workflows that will automatically run these commands for you. For example, when you make a PR a preview link will be auto-generated and when you merge to main the docs site will update.

### Documentation checks

Every pull request runs `fern check --warnings` with the pinned CLI and the
example-cache adapter. Internal broken links fail validation and publication.
API example validation and missing redirects are warnings while existing findings
are reviewed. Missing-redirect detection compares against the published site and
needs the `FERN_TOKEN` repository secret; fork PRs still receive local validation.
See [the cache setup and verification commands](scripts/fern/README.md).

Same-repository PRs receive a stable preview named `pr-<number>`. Subsequent pushes
update the preview and its PR comment, and closing or merging the PR deletes the
preview. Fork PRs skip hosted previews because repository secrets are unavailable.

The **check-external-links** workflow scans the published site daily at 08:00 UTC
and can also be run manually. Changes to that workflow run the scan on
same-repository PRs to verify its configuration before merge. Broken links and
incomplete scans fail the job.
Blocked URLs (such as HTTP 403 responses) are reported separately by Fern and do
not fail the scan. The run summary lists findings and source pages; download the
`fern-live-links` artifact for the JSON report. This workflow monitors external
URLs as well as deployed internal links; ordinary docs PRs use the local link
validator.

### Required checks on main

After merging the CI configuration and confirming that **fern-check** and
**Docs Preview** appear on a PR, a repository administrator should apply the
additive [Documentation CI ruleset](.github/required-checks.ruleset.json):

```sh
gh api --method POST repos/VapiAI/docs/rulesets \
  --input .github/required-checks.ruleset.json
```

Apply this once. If a `Documentation CI` ruleset already exists, update that ruleset
instead of creating a duplicate. It requires both checks from GitHub Actions on
an up-to-date branch and leaves the existing review rules intact. **Docs Preview**
is skipped successfully for forks; their **fern-check** must still pass. SDK
preview jobs run only for matching paths, and the live scan runs on a schedule, so
neither is a required check in this ruleset.
