const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '../../fern/assets/privacy-search.js');
const source = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const search = 'https://p6vyurbgg0-dsn.algolia.net/1/indexes/*/queries';
function browser({ unavailableStorage = false } = {}) {
  const sent = [];
  class Storage {
    constructor() { this.data = new Map([['algolia-user-token', 'old-user'], ['AlgoliaObjectQueryCache', '{}'], ['algolia-client-js-hosts', 'healthy'], ['ordinary', 'keep']]); }
    getItem(k) { return this.data.get(String(k)) ?? null; }
    setItem(k, v) { this.data.set(String(k), String(v)); }
    removeItem(k) { this.data.delete(String(k)); }
  }
  class XHR extends EventTarget {
    open(method, url) { this.url = url; this.readyState = 1; }
    setRequestHeader(name, value) { (this.headers ||= {})[name] = value; }
    send(body) { sent.push({ type: 'xhr', url: this.url, body, headers: this.headers }); }
    abort() { this.readyState = 0; }
    dispatchEvent(event) { this['on' + event.type]?.(event); return super.dispatchEvent(event); }
  }
  class Document {}
  let cookie = '_ALGOLIA=old-user; ordinary=keep';
  Object.defineProperty(Document.prototype, 'cookie', { configurable: true, get: () => cookie, set: value => { if (value.startsWith('_ALGOLIA=')) cookie = cookie.split('; ').filter(v => !v.startsWith('_ALGOLIA=')).join('; '); } });
  const document = new Document();
  const navigator = { sendBeacon: (...args) => { sent.push({ type: 'beacon', args }); return true; } };
  const window = { location: new URL('https://docs.vapi.ai/overview'), localStorage: new Storage(), sessionStorage: new Storage(), fetch: async (input, init) => { const req = new Request(input, init); sent.push({ type: 'fetch', url: req.url, body: await req.text(), headers: req.headers, signal: req.signal }); return new Response('{"results":[]}'); } };
  if (unavailableStorage) for (const name of ['localStorage', 'sessionStorage']) Object.defineProperty(window, name, { get() { throw new Error('unavailable'); } });
  Object.assign(window, { navigator, document });
  const context = vm.createContext({ window, navigator, document, Document, Storage, XMLHttpRequest: XHR, URL, URLSearchParams, Request, Response, Headers, Event, setTimeout });
  vm.runInContext(source, context);
  return { window, document, navigator, XHR, sent, context };
}
test('native XHR search keeps ranking/auth inputs and disables every optional query identity', () => {
  const b = browser();
  const xhr = new b.XHR();
  xhr.open('POST', search + '?userToken=url-user&analytics=true&x-algolia-api-key=secret');
  xhr.setRequestHeader('X-Algolia-API-Key', 'scoped-key');
  xhr.send(JSON.stringify({ requests: [{ indexName: 'docs', query: 'voice', filters: 'lang:en', analytics: true, clickAnalytics: true, userToken: 'user', authenticatedUserToken: 'account', analyticsTags: ['tag'], params: 'query=voice&filters=lang%3Aen&userToken=hidden&analyticsTags=%5B%22tag%22%5D&analytics=true' }] }));
  const call = b.sent[0];
  const url = new URL(call.url);
  assert.equal(url.searchParams.get('analytics'), 'false');
  assert.equal(url.searchParams.has('userToken'), false);
  assert.equal(url.searchParams.get('x-algolia-api-key'), 'secret');
  const req = JSON.parse(call.body).requests[0];
  assert.equal(req.query, 'voice'); assert.equal(req.filters, 'lang:en');
  assert.equal(req.analytics, false); assert.equal(req.clickAnalytics, false);
  for (const key of ['userToken', 'authenticatedUserToken', 'analyticsTags']) assert.equal(key in req, false);
  const params = new URLSearchParams(req.params);
  assert.equal(params.get('query'), 'voice'); assert.equal(params.get('analytics'), 'false');
  assert.equal(params.has('userToken'), false); assert.equal(params.has('analyticsTags'), false);
  assert.equal(call.headers['X-Algolia-API-Key'], 'scoped-key');
});
test('fetch supports Request/init and retry hosts, and fails closed for unknown search bodies', async () => {
  const b = browser();
  const controller = new AbortController();
  await b.window.fetch(new Request(search.replace('-dsn.algolia.net', '-2.algolianet.com'), { method: 'POST', headers: { authorization: 'keep' }, body: JSON.stringify({ requests: [{ indexName: 'docs', params: { query: 'voice', userToken: 'user' } }] }), signal: controller.signal }));
  assert.equal(b.sent[0].headers.get('authorization'), 'keep');
  assert.equal(JSON.parse(b.sent[0].body).requests[0].params.analytics, false);
  await assert.rejects(b.window.fetch(search, { method: 'POST', body: 'unrecognized' }));
  assert.equal(b.sent.length, 1);
});
test('Insights beacon/fetch/XHR settle successfully without initiation, even after regrant', async () => {
  const b = browser();
  const endpoint = 'https://insights.algolia.io/1/events';
  for (const analytics of [false, true]) {
    b.window.vapiDocsConsent = { getSnapshot: () => ({ ready: true, analytics }) };
    assert.equal(b.navigator.sendBeacon(endpoint, '{}'), true);
    const response = await b.window.fetch(endpoint, { method: 'POST', body: '{}' });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).status, 200);
    const xhr = new b.XHR();
    const completed = new Promise(resolve => { xhr.onload = resolve; });
    xhr.open('POST', endpoint); xhr.send('{}');
    await completed;
    assert.equal(xhr.readyState, 4); assert.equal(xhr.status, 200);
    assert.equal(JSON.parse(xhr.responseText).status, 200);
  }
  assert.equal(b.sent.length, 0);
});
test('only audited optional storage is removed and blocked; host cache and ordinary storage survive', () => {
  const b = browser();
  for (const store of [b.window.localStorage, b.window.sessionStorage]) {
    for (const key of ['algolia-user-token', 'AlgoliaObjectQueryCache']) {
      assert.equal(store.data.has(key), false); store.setItem(key, 'new'); assert.equal(store.getItem(key), null); assert.equal(store.data.has(key), false);
    }
    assert.equal(store.getItem('ordinary'), 'keep'); assert.equal(store.getItem('algolia-client-js-hosts'), 'healthy');
  }
  assert.equal(b.document.cookie, 'ordinary=keep');
  b.document.cookie = '_ALGOLIA=again; path=/';
  assert.equal(b.document.cookie, 'ordinary=keep');
});
test('scoped-key identifier is stripped only on the exact same-origin endpoint', async () => {
  const b = browser();
  const key = 'https://docs.vapi.ai/api/fern-docs/search/v2/key';
  await b.window.fetch(key, { headers: { 'X-User-Token': 'user', authorization: 'Bearer necessary' } });
  assert.equal(b.sent[0].headers.has('X-User-Token'), false);
  assert.equal(b.sent[0].headers.get('authorization'), 'Bearer necessary');
  const xhr = new b.XHR(); xhr.open('GET', key); xhr.setRequestHeader('X-User-Token', 'user'); xhr.setRequestHeader('authorization', 'keep'); xhr.send();
  assert.equal(b.sent[1].headers['X-User-Token'], undefined); assert.equal(b.sent[1].headers.authorization, 'keep');
  await b.window.fetch('https://api.vapi.ai/api/fern-docs/search/v2/key', { headers: { 'X-User-Token': 'necessary' } });
  assert.equal(b.sent[2].headers.get('X-User-Token'), 'necessary');
});
test('unrelated Algolia endpoints, other applications and ordinary requests are untouched', async () => {
  const b = browser();
  for (const url of ['https://other-dsn.algolia.net/1/indexes/*/queries', 'https://p6vyurbgg0.algolia.net/1/keys', 'https://example.com/1/events']) {
    await b.window.fetch(url, { method: 'POST', body: 'original' });
    assert.equal(b.sent.at(-1).body, 'original');
  }
  assert.equal(b.navigator.sendBeacon('https://example.com/1/events', '{}'), true);
  assert.equal(b.sent.length, 4);
});
test('XHR reuse and abort do not retain local Insights response or endpoint classification', async () => {
  const b = browser();
  const xhr = new b.XHR();
  const complete = new Promise(resolve => { xhr.onload = resolve; });
  xhr.open('POST', 'https://insights.us.algolia.io/1/events'); xhr.send('{}'); await complete;
  xhr.open('POST', search); xhr.send('{"requests":[{"params":"query=voice"}]}');
  assert.equal(xhr.readyState, 1); assert.equal(JSON.parse(b.sent[0].body).requests[0].analytics, false);
  const completed = new Promise(resolve => { xhr.onload = resolve; });
  xhr.open('POST', 'https://insights.algolia.io/1/events'); xhr.send('{}'); await completed;
  xhr.abort(); xhr.open('POST', search); xhr.send('{"requests":[{"query":"voice"}]}'); assert.equal(xhr.readyState, 1);
  xhr.open('POST', 'https://example.com/ordinary'); xhr.send('untouched'); assert.equal(b.sent.at(-1).body, 'untouched');
  let loaded = false; xhr.onload = () => { loaded = true; };
  xhr.open('POST', 'https://insights.algolia.io/1/events'); xhr.send('{}'); xhr.abort();
  await new Promise(resolve => setTimeout(resolve, 5)); assert.equal(loaded, false);
});
test('fetch honors init overrides and URL encoded multiqueries', async () => {
  const b = browser();
  const input = new Request(search, { method: 'POST', headers: { authorization: 'original' }, body: '{"requests":[{"query":"original"}]}' });
  await b.window.fetch(input, { headers: { authorization: 'override' }, body: new URLSearchParams({ requests: JSON.stringify([{ query: 'override', userToken: 'remove' }]) }).toString() });
  assert.equal(b.sent[0].headers.get('authorization'), 'override');
  const req = JSON.parse(new URLSearchParams(b.sent[0].body).get('requests'))[0];
  assert.equal(req.query, 'override'); assert.equal(req.analytics, false); assert.equal('userToken' in req, false);
});
test('fetch consumes Request bodies once, preserves signals and removes all identity header aliases', async () => {
  const b = browser();
  const controller = new AbortController();
  const input = new Request(search, { method: 'POST', signal: controller.signal, headers: { 'X-Algolia-User-Token': 'user', 'X-Algolia-Authenticated-User-Token': 'account', 'X-Algolia-UserToken': 'alias', authorization: 'keep' }, body: '{"requests":[{"query":"voice"}]}' });
  await b.window.fetch(input);
  assert.equal(input.bodyUsed, true, 'match native fetch ownership of a Request body');
  assert.equal(b.sent[0].headers.get('authorization'), 'keep');
  for (const name of ['X-Algolia-User-Token', 'X-Algolia-Authenticated-User-Token', 'X-Algolia-UserToken']) assert.equal(b.sent[0].headers.has(name), false);
  controller.abort(); assert.equal(b.sent[0].signal.aborted, true);
});
test('reopening during local Insights completion does not dispatch stale load events', async () => {
  const b = browser(); const xhr = new b.XHR(); let loaded = false;
  xhr.onreadystatechange = () => { if (xhr.readyState === 4) { xhr.open('POST', search); xhr.send('{"requests":[{"query":"voice"}]}'); } };
  xhr.onload = () => { loaded = true; };
  xhr.open('POST', 'https://insights.algolia.io/1/events'); xhr.send('{}');
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(loaded, false); assert.equal(b.sent.length, 1); assert.equal(xhr.readyState, 1);
});
test('unavailable storage does not prevent transport enforcement; duplicate evaluation composes once', async () => {
  const b = browser({ unavailableStorage: true });
  const fetch = b.window.fetch; vm.runInContext(source, b.context); assert.equal(b.window.fetch, fetch);
  await b.window.fetch(search, { method: 'POST', body: '{"requests":[{"userToken":"remove"}]}' });
  assert.equal(JSON.parse(b.sent[0].body).requests[0].analytics, false);
});
