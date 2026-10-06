const { createExampleCache } = require('./example-cache.cjs');
const cache = createExampleCache({ directory: process.env.VAPI_FERN_CACHE_DIR, namespace: process.env.VAPI_FERN_CACHE_NAMESPACE });
globalThis.__vapiFernExamples = cache.run;
process.on('exit', () => console.error('[fern-example-cache]', JSON.stringify(cache.stats)));
