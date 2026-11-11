const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../fern/assets/privacy-requests.js'), 'utf8');
function setup() {
  let state = { ready: false, analytics: false, marketing: false };
  const calls = [];
  class XHR {
    constructor() { this.headers = {}; }
    open(...args) { this.args = args; this.headers = {}; this.onreadystatechange?.(); }
    setRequestHeader(name, value) { this.headers[name] = value; }
    send(body) { this.body = body; }
  }
  const window = {
    location: { href: 'https://docs.vapi.ai/quickstart' },
    vapiDocsConsent: { getSnapshot: () => state },
    fetch: (...args) => { calls.push(args); return Promise.resolve('response'); }
  };
  const context = vm.createContext({ window, URL, Headers, XMLHttpRequest: XHR });
  vm.runInContext(source, context);
  return { window, calls, XHR, update: next => { state = next; } };
}
test('fetch preserves Request/init semantics and reads permission at dispatch', async () => {
  const b = setup();
  const request = new Request('https://api.vapi.ai/__consent-regression', { method: 'POST', body: 'payload', headers: { Authorization: 'test', 'X-Vapi-Consent-Analytics': 'granted' }, credentials: 'include' });
  const signal = new AbortController().signal;
  await b.window.fetch(request, { signal });
  const [input, init] = b.calls[0];
  assert.equal(input, request);
  assert.equal(init.signal, signal);
  assert.equal(init.headers.get('Authorization'), 'test');
  assert.equal(init.headers.get('X-Vapi-Consent-Analytics'), 'denied');
  assert.equal(request.bodyUsed, false);
  assert.equal(request.credentials, 'include');
  b.update({ ready: true, analytics: true, marketing: false });
  const override = { 'X-Existing': 'kept' };
  await b.window.fetch(request, { headers: override, method: 'PUT', body: 'override', credentials: 'omit' });
  const second = b.calls[1][1];
  assert.equal(second.headers.get('X-Vapi-Consent-Analytics'), 'granted');
  assert.equal(second.headers.get('X-Vapi-Consent-Marketing'), 'denied');
  assert.equal(second.headers.get('Authorization'), null, 'init.headers overrides Request headers');
  assert.equal(second.headers.get('X-Existing'), 'kept');
  assert.equal(second.body, 'override');
  assert.equal(second.method, 'PUT');
  assert.equal(second.credentials, 'omit');
  assert.deepEqual(override, { 'X-Existing': 'kept' });
});
test('only exact HTTPS API origins receive headers', async () => {
  const b = setup();
  for (const target of ['https://api.vapi.ai/path', new URL('https://api.eu.vapi.ai/path')]) {
    await b.window.fetch(target);
    assert.equal(b.calls.at(-1)[1].headers.get('X-Vapi-Consent-Marketing'), 'denied');
  }
  for (const target of ['/api/fern-docs/search/v2/key', 'https://docs.vapi.ai', 'https://api.vapi.ai.attacker.test', 'http://api.vapi.ai', 'https://api.vapi.ai:8443', 'https://customerioforms.com', 'https://us.i.posthog.com', 'https://cdn.jsdelivr.net']) {
    const init = { headers: { Accept: 'application/json' } };
    await b.window.fetch(target, init);
    assert.equal(b.calls.at(-1)[1], init);
  }
});
test('XHR keeps credentials/body/caller headers; opening before grant uses send-time consent', () => {
  const b = setup();
  const xhr = new b.XHR();
  xhr.open('POST', 'https://api.eu.vapi.ai/__consent-regression', true, 'user', 'password');
  xhr.withCredentials = true;
  xhr.setRequestHeader('Authorization', 'test');
  xhr.setRequestHeader('x-vapi-consent-analytics', 'granted');
  b.update({ ready: true, analytics: false, marketing: true });
  xhr.send('payload');
  assert.equal(xhr.headers['X-Vapi-Consent-Analytics'], 'denied');
  assert.equal(xhr.headers['X-Vapi-Consent-Marketing'], 'granted');
  assert.equal(xhr.headers['x-vapi-consent-analytics'], undefined);
  assert.equal(xhr.headers.Authorization, 'test');
  assert.equal(xhr.body, 'payload');
  assert.equal(xhr.withCredentials, true);
  assert.deepEqual(xhr.args, ['POST', 'https://api.eu.vapi.ai/__consent-regression', true, 'user', 'password']);
  xhr.open('GET', 'https://example.com');
  xhr.setRequestHeader('X-Existing', 'kept');
  xhr.send();
  assert.deepEqual(xhr.headers, { 'X-Existing': 'kept' });
});

test('XHR stamps even when a caller sends synchronously from the open state-change callback', () => {
  const b = setup();
  const xhr = new b.XHR();
  xhr.onreadystatechange = () => xhr.send('immediate');
  xhr.open('POST', 'https://api.vapi.ai/__consent-regression');
  assert.equal(xhr.headers['X-Vapi-Consent-Analytics'], 'denied');
  assert.equal(xhr.headers['X-Vapi-Consent-Marketing'], 'denied');
  assert.equal(xhr.body, 'immediate');
});
