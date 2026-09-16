const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { digest } = require('./example-cache.cjs');

const VERSION = '5.112.0';
const CLI_SHA256 = '9932a459d6e109b40a1dcf4551317e9737779c5c3750f0c78701c0c4d58d6305';
const MARKER = 'function u8d({propertySchema:e,breadcrumbs:t,context:r,propertyId:n})';
const MEDIA_MARKER = 'generateOrValidateExample({schema:t,example:r,generateOptionalProperties:n,exampleGenerationStrategy:i})';

function inputDigest(root) {
  const inputs = [];
  function visit(relative) {
    const absolute = path.join(root, relative);
    for (const entry of fs.readdirSync(absolute, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const child = path.join(relative, entry.name);
      if (entry.isDirectory()) visit(child);
      else if (entry.isFile()) inputs.push([child, digest(fs.readFileSync(path.join(root, child)))]);
      else throw new Error(`Unsupported API input: ${child}`);
    }
  }
  visit('fern/apis');
  inputs.push(['fern/fern.config.json', digest(fs.readFileSync(path.join(root, 'fern/fern.config.json')))]);
  inputs.push(['runtime', VERSION, CLI_SHA256, process.versions.node, process.versions.v8, process.platform, process.arch]);
  inputs.push(['cache-code', digest(fs.readFileSync(path.join(__dirname, 'example-cache.cjs')))]);
  return digest(JSON.stringify(inputs));
}

function main() {
  const root = path.resolve(__dirname, '../..');
  const config = JSON.parse(fs.readFileSync(path.join(root, 'fern/fern.config.json'), 'utf8'));
  if (config.version !== VERSION) throw new Error('Fern version changed. Review and revalidate the example-cache adapter before publishing.');
  if (!process.env.FERN_CLI_PATH) throw new Error('Set FERN_CLI_PATH to the installed fern-api/cli.cjs (see scripts/fern/README.md).');
  const source = fs.readFileSync(process.env.FERN_CLI_PATH, 'utf8');
  if (digest(source) !== CLI_SHA256 || source.split(MARKER).length !== 2 || source.split(MEDIA_MARKER).length !== 2) throw new Error('Unexpected Fern CLI contents. Refusing to apply the cache adapter.');
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'vapi-fern-'));
  const patched = source
    .replace(MARKER, 'function u8d(args){return globalThis.__vapiFernExamples(args,()=>vapiOriginalExamples(args))}function vapiOriginalExamples({propertySchema:e,breadcrumbs:t,context:r,propertyId:n})')
    .replace(MEDIA_MARKER, 'generateOrValidateExample(args){return globalThis.__vapiFernExamples({context:this.context,breadcrumbs:this.breadcrumbs,mediaExampleArgs:args},()=>this.vapiOriginalMediaExample(args))}vapiOriginalMediaExample({schema:t,example:r,generateOptionalProperties:n,exampleGenerationStrategy:i})');
  try {
    const cli = path.join(temporary, 'fern.cjs');
    fs.writeFileSync(cli, patched);
    const result = spawnSync(process.execPath, ['--require', path.join(__dirname, 'register.cjs'), cli, ...process.argv.slice(2)], {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, VAPI_FERN_CACHE_NAMESPACE: inputDigest(root), VAPI_FERN_CACHE_DIR: path.join(root, '.cache/fern-examples') },
    });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

if (require.main === module) main();
module.exports = { inputDigest };
