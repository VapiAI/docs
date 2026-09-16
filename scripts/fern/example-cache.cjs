const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const v8 = require('node:v8');

const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');

// Cache only the return value of Fern's property-example generator. API parsing,
// schema validation, markdown validation, and deployment still run normally.
function createExampleCache({ directory, namespace }) {
  const contexts = new WeakMap();
  const stats = { hits: 0, misses: 0, skipped: 0 };

  function contextKey(context) {
    let key = contexts.get(context);
    if (key !== undefined) return key;
    const {
      spec, settings, generationLanguage, smartCasing, namespace: apiNamespace,
      exampleGenerationArgs, authOverrides, environmentOverrides,
      globalHeaderOverrides, enableUniqueErrorsPerEndpoint, generateV1Examples,
    } = context;
    key = digest(JSON.stringify({
      spec, settings, generationLanguage, smartCasing, namespace: apiNamespace,
      exampleGenerationArgs, authOverrides, environmentOverrides,
      globalHeaderOverrides, enableUniqueErrorsPerEndpoint, generateV1Examples,
    }));
    contexts.set(context, key);
    return key;
  }

  function run(args, generate) {
    const { context, ...inputs } = args;
    const file = path.join(directory, namespace, contextKey(context), `${digest(JSON.stringify(inputs))}.bin`);
    try {
      const entry = fs.readFileSync(file);
      const payload = entry.subarray(65);
      if (entry[64] !== 10 || entry.subarray(0, 64).toString() !== digest(payload)) throw new Error('Invalid cache checksum');
      const result = v8.deserialize(payload);
      stats.hits++;
      return result;
    } catch {
      // A missing, stale, or corrupt cache is a normal cold build.
    }
    stats.misses++;
    const collector = context.errorCollector;
    const owned = Object.hasOwn(collector, 'collect');
    const collect = collector.collect;
    let clean = true;
    collector.collect = function (...values) {
      clean = false;
      return collect.apply(this, values);
    };
    let result;
    try {
      result = generate();
    } finally {
      if (owned) collector.collect = collect;
      else delete collector.collect;
    }
    // Never suppress diagnostics on subsequent builds.
    if (!clean) {
      stats.skipped++;
      return result;
    }
    const temporary = `${file}.${process.pid}.${crypto.randomUUID()}.tmp`;
    try {
      const payload = v8.serialize(result);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(temporary, Buffer.concat([Buffer.from(`${digest(payload)}\n`), payload]));
      fs.renameSync(temporary, file);
    } catch {
      // Cache storage must not make an otherwise valid build fail.
      try { fs.unlinkSync(temporary); } catch {}
    }
    return result;
  }

  return { run, stats };
}

module.exports = { createExampleCache, digest };
