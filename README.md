# VAPI API Documentation

This repository contains the source files for the documentation found at [docs.vapi.ai](https://docs.vapi.ai/). 

## How can I contribute to these docs?

You can suggest edits by making a pull request.

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
