# Fern example cache

Fern 5.112.0 repeatedly generates examples for nested API properties during
validation and publication. The GPT-Live docs publish spent about 24 minutes
preparing validation and another 25 minutes building the API navigation. Its
final deployment took six seconds.

This adapter caches the exact return values of Fern's property and request/response
example generators.
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
- The cache namespace includes the Fern config, adapter implementation, exact CLI
  checksum, Node/V8 versions, OS, and CPU architecture. API source edits and
  Markdown changes do not invalidate the namespace.
- Each entry includes the example inputs, parser and example settings, reference
  base directory, and the complete contents of every transitively referenced
  schema or example. Editing an unrelated endpoint or type preserves the entry.
  Editing a shared type invalidates every example that depends on it. Added or
  removed reference targets also invalidate affected entries, including cycles.
- Reference traversal matches the pinned Fern resolver. Non-local references
  bypass caching because their contents cannot be proven unchanged from the
  resolved local specification. Diagnostics and exceptions retain normal behavior.
- GitHub Actions restores caches with the same tooling fingerprint and saves a
  new snapshot on each successful run. New or changed examples extend the cache.
  The first build with a new tooling fingerprint fills a fresh cache.

## Maintenance and escape hatch

This is a small, version-specific adapter to Fern's bundled CLI, not a public
Fern extension API. `run.cjs` verifies the complete official CLI SHA-256 and the
two expected function signatures before adding the wrappers. An unexpected
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

## Measured validation results

On the same machine and API inputs, the original generators took 697 seconds
in docs validation setup. A fresh process using the cache took 6.9 seconds,
with 2,266 hits and zero misses. Both complete local checks reported zero errors
and 11 warnings, with identical warning text. The cached full check took about
15 seconds. This measures validation, not end-to-end publication.

Two complete preview publications took approximately 47 and 49 seconds, with
4,532 cache hits and zero misses each. Both used the normal publishing flags,
including dynamic SDK snippets. Browser checks covered the guide, API reference,
request examples, and API Explorer form. These are local timings, not CI timings.
A first build after tooling changes still pays the original generation cost.
API edits regenerate only entries whose inputs or transitive references changed.
The measurements above are from the original whole-spec cache. Granular-cache
measurements are recorded separately when verified.
