# Vapi Api Configuration

This repository contains our Fern Configuration:

- [OpenAPI spec](./openapi.json)
- [OpenAPI Overrides](./openapi-overrides.yml)
- [SDK generator config](./fern/generators.yml)

## Setup

```sh
npm install -g fern-api@5.169.0
```

## Validating your OpenAPI Specs

To validate your API, run:

```sh
fern check
```

## Managing SDKs

### Deploying your SDKs

To deploy your SDKs, simply run the `Release Python SDK` GitHub Action with the 
desired version for the release. Under the hood, this leverages the Fern CLI:

```sh
fern generate --api api --group python-sdk
```

### Developing SDKs

You can also regenerate the SDKs locally by running:

```sh
fern generate --api api --group python-sdk --preview --log-level debug
```

This will generate the SDK and download it to a local folder that can be pip installed.

```sh
pip install -e /fern/.preview/fern-python-sdk
```

## Managing the CLI

The `cli-sdk` group in `fern/apis/cli/generators.yml` generates `VapiAI/cli`
from the same OpenAPI definition, naming overrides, and parameter-description
overlay as the server SDKs. Its separate API workspace adds public-client
OAuth with PKCE and a staging default server; the other SDK groups retain their
existing authentication. Promote the CLI issuer, public client, resource and
server together after live OAuth acceptance.

Run **Release CLI** with an explicit version to open a generated CLI pull
request, just like the SDK release workflows. Generation does not publish a
package. Merge the CLI repository's Fern migration before the first run;
review and merge generated updates there, then use its version-tag publishing
workflow when the release gates are satisfied.

For a local preview:

```sh
fern generate --api cli --group cli-sdk --version 1.0.0-beta.1 --preview
```

The CLI repository owns its docs, tests and runtime customizations. Its
`.fernignore` preserves repository-owned files, and Fern Replay carries its
schema changes across generated pull requests. The customized HTTP runtime is
protected by `.fernignore` because Replay rejects its embedded test certificate. Keep API naming changes in
shared source annotations or overrides, not CLI-only aliases.

## How to update documentation?

### Local Development server

To run a local development server with hot-reloading you can run the following command

```sh
fern docs dev
```

#### Hosted URL

To update your documentation on a hosted URL, run
```
# npm install -g fern-api@5.169.0
fern generate --docs
```
To preview your documentation, run
```
# npm install -g fern-api@5.169.0
fern generate --docs --preview
```
The repository contains GitHub workflows that will automatically run these commands for you. For example, when you make a PR a preview link will be auto-generated and when you merge to main the docs site will update.
