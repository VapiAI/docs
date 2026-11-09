const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const { digest } = require('./example-cache.cjs');

const version = '5.169.0';
const checksum = '773ec0a808a2c4d03c894c81c6159f8e3fe8db5a873c287cdce5b140eed8b809';
const marker = 'function KOm({propertySchema:e,breadcrumbs:t,context:r,propertyId:n})';
const mediaMarker = 'generateOrValidateExample({schema:t,example:r,generateOptionalProperties:n,exampleGenerationStrategy:i})';
const fixture = `${marker}{return e}class Media{${mediaMarker}{return t}}`;
const wrapper = fs.readFileSync(path.join(__dirname, 'run.cjs'), 'utf8');

// Exercise the wrapper's process boundary without running a deployment command.
function harness(options = {}) {
  const calls = { removed: [], writes: [], spawns: [] };
  const processMock = {
    env: { FERN_CLI_PATH: '/installed/cli.cjs', ...options.env },
    argv: ['node', 'run.cjs', 'check', '--local'],
    execPath: process.execPath, versions: process.versions, platform: process.platform, arch: process.arch,
  };
  const moduleMock = { exports: {} };
  const source = options.source ?? fixture;
  function requireMock(name) {
    if (name === 'node:fs') return {
      ...fs,
      readFileSync(file, encoding) {
        if (file === '/installed/cli.cjs') return source;
        if (file.endsWith('fern.config.json')) return JSON.stringify({ version: options.version ?? version });
        return fs.readFileSync(file, encoding);
      },
      mkdtempSync: () => '/temporary/fern',
      writeFileSync: (...args) => calls.writes.push(args),
      rmSync: (...args) => calls.removed.push(args),
    };
    if (name === './example-cache.cjs') return { digest: value => value === source ? (options.checksum ?? checksum) : digest(value) };
    if (name === 'node:child_process') return { spawnSync: (...args) => { calls.spawns.push(args); return options.result ?? { status: 0 }; } };
    return require(name);
  }
  requireMock.main = moduleMock;
  const context = { require: requireMock, module: moduleMock, __dirname, __filename: path.join(__dirname, 'run.cjs'), process: processMock };
  return { calls, process: processMock, run: () => vm.runInNewContext(wrapper, context) };
}

test('rejects a config version mismatch before starting Fern', () => {
  const h = harness({ version: '5.151.1' });
  assert.throws(h.run, /Fern version changed/);
  assert.equal(h.calls.spawns.length, 0);
});

test('requires an explicit installed CLI path', () => {
  const h = harness({ env: { FERN_CLI_PATH: undefined } });
  assert.throws(h.run, /Set FERN_CLI_PATH/);
  assert.equal(h.calls.writes.length, 0);
});

test('rejects a changed bundle checksum before applying patches', () => {
  const h = harness({ checksum: 'changed' });
  assert.throws(h.run, /Unexpected Fern CLI contents/);
  assert.equal(h.calls.writes.length, 0);
});

for (const [label, source] of [
  ['missing property marker', fixture.replace(marker, 'function changed()')],
  ['duplicated property marker', fixture + marker],
  ['missing media marker', fixture.replace(mediaMarker, 'changed()')],
  ['duplicated media marker', fixture + mediaMarker],
]) test(`rejects ${label} even with an accepted checksum`, () => {
  const h = harness({ source });
  assert.throws(h.run, /Unexpected Fern CLI contents/);
  assert.equal(h.calls.spawns.length, 0);
});

test('both emitted wrappers call the cache and preserve original generation', () => {
  const h = harness();
  h.run();
  const patched = h.calls.writes[0][1];
  const calls = [];
  const context = { __vapiFernExamples(args, generate) { calls.push(args); return generate(); } };
  const result = vm.runInNewContext(`${patched};[KOm({propertySchema:'property'}),new Media().generateOrValidateExample({schema:'media'})]`, context);
  assert.deepEqual(Array.from(result), ['property', 'media']);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].propertySchema, 'property');
  assert.equal(calls[1].mediaExampleArgs.schema, 'media');
});

test('forwards arguments, working directory and cache registration to the child', () => {
  const h = harness();
  h.run();
  const [executable, args, options] = h.calls.spawns[0];
  assert.equal(executable, process.execPath);
  assert.deepEqual(Array.from(args), ['--require', path.join(__dirname, 'register.cjs'), '/temporary/fern/fern.cjs', 'check', '--local']);
  assert.equal(options.cwd, path.resolve(__dirname, '../..'));
  assert.equal(options.stdio, 'inherit');
  assert.match(options.env.VAPI_FERN_CACHE_NAMESPACE, /^[a-f0-9]{64}$/);
  assert.equal(options.env.VAPI_FERN_CACHE_DIR, path.resolve(__dirname, '../../.cache/fern-examples'));
  assert.equal(h.calls.removed.length, 1);
});

for (const status of [0, 2, null]) test(`preserves child exit status ${status}`, () => {
  const h = harness({ result: { status } });
  h.run();
  assert.equal(h.process.exitCode, status ?? 1);
  assert.equal(h.calls.removed.length, 1);
});

test('propagates child startup errors and removes the temporary bundle', () => {
  const h = harness({ result: { error: new Error('startup failed') } });
  assert.throws(h.run, /startup failed/);
  assert.equal(h.calls.removed.length, 1);
});

const installed = process.env.FERN_CLI_PATH;
test('official installed bundle matches the reviewed checksum and unique markers', { skip: !installed }, () => {
  const source = fs.readFileSync(installed, 'utf8');
  assert.equal(digest(source), checksum);
  assert.equal(source.split(marker).length, 2);
  assert.equal(source.split(mediaMarker).length, 2);
  const packageJson = JSON.parse(fs.readFileSync(path.join(path.dirname(installed), 'package.json'), 'utf8'));
  assert.equal(packageJson.version, version);
});

for (const args of [['--version'], ['--help'], ['check', '--help'], ['generate', '--help']]) {
  test(`actual pinned CLI accepts ${args.join(' ')} through the wrapper`, { skip: !installed }, t => {
    const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'fern-cli-test-'));
    t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
    const result = spawnSync(process.execPath, [path.join(__dirname, 'run.cjs'), ...args], {
      env: { ...process.env, TMPDIR: temporary }, encoding: 'utf8', timeout: 30000,
    });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stderr, /\[fern-example-cache\]/);
    assert.ok(result.stdout.trim());
    if (args[0] === '--version') assert.match(result.stdout, /5\.169\.0/);
    assert.deepEqual(fs.readdirSync(temporary), []);
  });
}
