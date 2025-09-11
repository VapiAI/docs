# Vapi Platform Documentation

This repository contains the source files for the documentation found at [docs.vapi.ai](https://docs.vapi.ai/). 

> Tip: We recommend using the **Cursor code editor** when editing these docs and running examples. Cursor provides AI-assisted workflows and integrates well with JavaScript/TypeScript and Python projects. Download at `https://cursor.com`.

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
