# Vapi Api Configuration

This repository contains our Fern Configuration:

- [OpenAPI spec](./openapi.json)
- [OpenAPI Overrides](./openapi-overrides.yml)
- [SDK generator config](./fern/generators.yml)

## Setup

```sh
npm install -g fern-api
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

## How to update documentation?

### Local Development server

To run a local development server with hot-reloading you can run the following command

```sh
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
