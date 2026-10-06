const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const v8 = require('node:v8');

const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');

// V8 serialization preserves values but is not a canonical encoding for keys.
// Tag every value so undefined, null, NaN, and user-authored objects cannot collide.
function fingerprint(value) {
  const ancestors = new Set();
  function encode(value) {
    if (value === null) return ['null'];
    if (value === undefined) return ['undefined'];
    if (typeof value === 'string' || typeof value === 'boolean') return [typeof value, value];
    if (typeof value === 'number') return ['number', Object.is(value, -0) ? '-0' : String(value)];
    if (typeof value !== 'object') throw new Error('Unsupported cache input');
    if (value instanceof Date) return ['date', value.toISOString()];
    if (ancestors.has(value)) throw new Error('Cyclic cache input');
    ancestors.add(value);
    try {
      if (Array.isArray(value)) return ['array', Array.from({ length: value.length }, (_, i) => Object.hasOwn(value, i) ? encode(value[i]) : ['hole'])];
      if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) throw new Error('Unsupported cache input prototype');
      return ['object', Object.keys(value).sort().map((key) => [key, encode(value[key])])];
    } finally {
      ancestors.delete(value);
    }
  }
  return digest(JSON.stringify(encode(value)));
}

// Match the pinned Fern resolver, including its ~1-only pointer decoding.
// Walk every reference in the inputs and their transitive dependencies. Keep
// missing targets in the key so adding a formerly missing type invalidates it.
function dependencyFingerprint(spec, inputs) {
  const references = new Map();
  const visited = new WeakSet();
  function visit(value) {
    if (value === null || typeof value !== 'object' || visited.has(value)) return;
    visited.add(value);
    if (Object.hasOwn(value, '$ref')) {
      const ref = value.$ref;
      if (typeof ref !== 'string' || !ref.startsWith('#/')) {
        throw new Error('Non-local reference requires uncached generation');
      }
      if (!references.has(ref)) {
        let target = spec;
        for (const key of ref.slice(2).split('/').map((part) => part.replace(/~1/g, '/'))) {
          target = target != null && typeof target === 'object' ? target[key] : undefined;
        }
        references.set(ref, target);
        visit(target);
      }
    }
    for (const child of Object.values(value)) visit(child);
  }
  visit(inputs);
  return fingerprint([...references].sort(([a], [b]) => a.localeCompare(b)));
}

// Cache only return values of Fern's property and request/response example generators. API parsing,
// schema validation, markdown validation, and deployment still run normally.
function createExampleCache({ directory, namespace }) {
  const contexts = new WeakMap();
  const stats = { hits: 0, misses: 0, skipped: 0 };

  function contextKey(context) {
    let key = contexts.get(context);
    if (key !== undefined) return key;
    const {
      settings, generationLanguage, smartCasing, namespace: apiNamespace,
      exampleGenerationArgs, authOverrides, environmentOverrides,
      globalHeaderOverrides, enableUniqueErrorsPerEndpoint, generateV1Examples,
      documentBaseDir,
    } = context;
    key = fingerprint({
      settings, generationLanguage, smartCasing, namespace: apiNamespace,
      exampleGenerationArgs, authOverrides, environmentOverrides,
      globalHeaderOverrides, enableUniqueErrorsPerEndpoint, generateV1Examples,
      documentBaseDir,
    });
    contexts.set(context, key);
    return key;
  }

  function run(args, generate) {
    const { context, ...inputs } = args;
    let file;
    try {
      file = path.join(directory, namespace, contextKey(context), `${fingerprint(inputs)}-${dependencyFingerprint(context.spec, inputs)}.bin`);
    } catch {
      stats.skipped++;
      return generate();
    }
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

module.exports = { createExampleCache, digest, fingerprint, dependencyFingerprint };
