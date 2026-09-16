# Fern example cache

Fern 5.112.0 repeatedly generates examples for nested API properties during
validation and publication. The GPT-Live docs publish spent about 24 minutes
preparing validation and another 25 minutes building the API navigation. Its
final deployment took six seconds.

This adapter caches the exact return values of Fern's property-example generator.
It does not remove fields, shorten examples, skip schema checks, disable SDK
snippets, or change the API playground. Changes are confined to this docs repo.

## How it works

- A cold miss invokes the unmodified property-example generator.
- Successful values are stored with V8 serialization, preserving `undefined`
  values that JSON would discard. Each entry has a checksum and is written
  atomically. Every read returns an independent object.
- Any call that reports a diagnostic through Fern's error collector is not
  cached. Exceptions still fail the build. Unreadable or corrupt entries are
  regenerated normally.
- The cache namespace includes every file under `fern/apis`, the Fern config,
  adapter implementation, exact CLI checksum, Node/V8 versions, OS, and CPU
  architecture. Each entry also includes the resolved API spec, parser settings,
  example settings, schema, property ID, and breadcrumbs. Markdown changes do
  not invalidate API examples.
- GitHub Actions restores only caches with the same API/tooling fingerprint.
  Each successful run saves a new snapshot, so additional examples generated
  during publishing can extend the validation cache. It never falls back to
  different API inputs. The first build for new inputs fills the cache.

## Maintenance and escape hatch

This is a small, version-specific adapter to Fern's bundled CLI, not a public
Fern extension API. `run.cjs` verifies the complete official CLI SHA-256 and the
single expected function signature before adding the wrapper. An unexpected
version or bundle fails before publishing. Upgrading Fern requires reviewing the
adapter and repeating the output and timing checks.

To bypass the cache, invoke the installed Fern CLI directly. No source schema or
published content needs to change. Removing the setup action and restoring the
original Fern commands also removes this optimization.

## Local verification

```sh
npm install --prefix /tmp/vapi-fern --no-save fern-api@5.112.0
export FERN_CLI_PATH=/tmp/vapi-fern/node_modules/fern-api/cli.cjs
node --test scripts/fern/example-cache.test.cjs
node scripts/fern/run.cjs check --local --log-level debug
node scripts/fern/run.cjs generate --docs --preview --log-level debug
```

Only use `--preview` for verification. Production publishing remains in the
existing main-branch workflow. Logs print cache hits, misses, and uncached
diagnostic-producing calls at exit.
