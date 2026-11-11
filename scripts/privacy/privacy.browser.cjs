const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const categories = (analytics = 'DENY', marketing = 'DENY', personalization = 'DENY') => ({ ANALYTICS: analytics, MARKETING: marketing, PERSONALIZATION: personalization });
const requestEvidence = new WeakMap();
test.beforeEach(async ({ page }) => {
  const log = [];
  requestEvidence.set(page, log);
  page.on('request', request => log.push({ method: request.method(), url: request.url() }));
  page.on('requestfailed', request => log.push({ failed: request.failure()?.errorText, url: request.url() }));
  page.on('pageerror', error => log.push({ pageError: error.message }));
});
test.afterEach(async ({ page }, info) => {
  fs.mkdirSync(info.outputDir, { recursive: true });
  const evidencePath = info.outputPath('request-initiation.json');
  fs.writeFileSync(evidencePath, JSON.stringify(requestEvidence.get(page), null, 2));
  await info.attach('request-initiation.json', { path: evidencePath, contentType: 'application/json' });
  if (info.status === 'passed') expect(requestEvidence.get(page).filter(item => item.pageError)).toEqual([]);
});

const optional = url => /posthog|hockeystack|static\.reo\.dev|hs-scripts|hs-analytics|licdn|googletagmanager|google-analytics|doubleclick/i.test(new URL(url).hostname) || /cdn\.jsdelivr\.net\/npm\/hockeystack/i.test(url);

// Only CMP decisions and collection responses are fixtures. The docs HTML,
// Fern analytics gate, bundled PostHog SDK, router and custom.js are real.
// Request listeners see initiation even for fulfilled/failed requests. There
// is deliberately no catch-all tracker abort hiding a denied-state request.
async function setup(page, initial = null, gpc = false) {
  const requests = [];
  page.on('request', request => { if (optional(request.url()) || request.url().includes('/analytics/posthog')) requests.push(request.url()); });
  await page.addInitScript(({ initial, gpc }) => {
    window.__cmpConsent = initial;
    Object.defineProperty(navigator, 'globalPrivacyControl', { value: gpc });
  }, { initial, gpc });
  await page.route('https://cmp.osano.com/**/osano.js', route => route.fulfill({
    contentType: 'text/javascript',
    body: `(() => {
      const queued = window.Osano?.data || [];
      const callbacks = {};
      function Osano(name, callback) {
        (callbacks[name] ||= []).push(callback);
        if (name === 'onInitialized') callback(window.__cmpConsent || undefined);
      }
      Osano.cm = { getConsent: () => window.__cmpConsent || undefined };
      window.Osano = Osano;
      window.__cmpEmit = (name, value, payloadless = false) => {
        if (name !== 'onConsentChanged' && value) window.__cmpConsent = value;
        (callbacks[name] || []).forEach(cb => cb(payloadless ? undefined : value));
      };
      for (const args of queued) Osano(...args);
    })();`
  }));
  // Never transmit synthetic analytics to a live project. This does not mock
  // the SDK or hide request initiation; the listener above remains authoritative.
  await page.route('https://*.posthog.com/**', route => route.request().resourceType() === 'script'
    ? route.fulfill({ contentType: 'application/javascript', body: '' })
    : route.fulfill({ json: { status: 1, featureFlags: {}, errorsWhileComputingFlags: false, sessionRecording: false } }));
  await page.goto('/');
  await expect(page.locator('meta[name="fern-analytics-consent"]')).toHaveAttribute('content', 'required');
  await page.waitForFunction(() => !!window.vapiDocsConsent && !!window.__cmpEmit);
  return requests;
}
async function save(page, consent, payloadless = false) {
  await page.evaluate(({ consent, payloadless }) => window.__cmpEmit('onConsentSaved', consent, payloadless), { consent, payloadless });
}
async function storage(page) {
  return page.evaluate(() => ({
    cookies: document.cookie.split(';').filter(value => /^\s*(__)?ph_/i.test(value)),
    local: Object.keys(localStorage).filter(key => /^(__)?ph_/.test(key)),
    session: Object.keys(sessionStorage).filter(key => /^(__)?ph_/.test(key))
  }));
}

test('generated search adapter preserves search responses and auth while optional Algolia transport/storage stays off', async ({ page }) => {
  const calls = [];
  const endpoint = 'https://p6vyurbgg0-dsn.algolia.net/1/indexes/*/queries';
  await page.addInitScript(() => {
    localStorage.setItem('algolia-user-token', 'previous-visitor');
    localStorage.setItem('AlgoliaObjectQueryCache', '{}');
    localStorage.setItem('algolia-client-js-test', 'healthy');
    document.cookie = '_ALGOLIA=previous-visitor; path=/';
  });
  await page.route('https://p6vyurbgg0-dsn.algolia.net/1/indexes/**', async route => {
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    calls.push({ url: route.request().url(), body: route.request().postDataJSON(), key: route.request().headers()['x-algolia-api-key'] });
    await route.fulfill({ headers, json: { results: [{ hits: [{ objectID: 'fixture', title: 'Voice' }], nbHits: 1 }] } });
  });
  // Record any leak, but never deliver synthetic Insights to a live project.
  await page.route('https://insights.algolia.io/1/events', route => route.fulfill({ json: { status: 200, message: 'OK' } }));
  await setup(page, categories());
  expect(await page.evaluate(() => window.__vapiDocsSearchPrivacy)).toBe(true);
  for (const analytics of ['DENY', 'ACCEPT', 'DENY', 'ACCEPT']) {
    await save(page, categories(analytics));
    const result = await page.evaluate(async endpoint => {
      const payload = JSON.stringify({ requests: [{ indexName: 'fixture', params: 'query=voice&filters=lang%3Aen&analytics=true&clickAnalytics=true&userToken=visitor&authenticatedUserToken=account&analyticsTags=%5B%22tag%22%5D' }] });
      const hit = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest(); xhr.open('POST', endpoint);
        xhr.setRequestHeader('X-Algolia-API-Key', 'fixture-key');
        xhr.onload = () => resolve(JSON.parse(xhr.responseText).results[0].hits[0].title);
        xhr.onerror = reject; xhr.send(payload);
      });
      const fetched = await fetch(new Request(endpoint, { method: 'POST', headers: { 'X-Algolia-API-Key': 'fixture-key' }, body: payload }));
      const insights = 'https://insights.algolia.io/1/events';
      const beacon = navigator.sendBeacon(insights, '{}');
      const status = (await fetch(insights, { method: 'POST', body: '{}' })).status;
      const xhrStatus = await new Promise(resolve => {
        const xhr = new XMLHttpRequest(); xhr.open('POST', insights);
        xhr.onload = () => resolve(xhr.status); xhr.send('{}');
      });
      localStorage.setItem('algolia-user-token', 'new-visitor');
      localStorage.setItem('AlgoliaObjectQueryCache', '{}');
      document.cookie = '_ALGOLIA=new-visitor; path=/';
      return { hit, fetched: (await fetched.json()).results[0].hits[0].title, beacon, status, xhrStatus,
        token: localStorage.getItem('algolia-user-token'), cache: localStorage.getItem('AlgoliaObjectQueryCache'),
        hostCache: localStorage.getItem('algolia-client-js-test'), cookie: document.cookie };
    }, endpoint);
    expect(result).toMatchObject({ hit: 'Voice', fetched: 'Voice', beacon: true, status: 200, xhrStatus: 200, token: null, cache: null, hostCache: 'healthy' });
    expect(result.cookie).not.toContain('_ALGOLIA=');
  }
  expect(calls).toHaveLength(8);
  for (const call of calls) {
    expect(call.key).toBe('fixture-key');
    const params = new URLSearchParams(call.body.requests[0].params);
    expect(params.get('query')).toBe('voice'); expect(params.get('filters')).toBe('lang:en');
    expect(params.get('analytics')).toBe('false'); expect(params.get('clickAnalytics')).toBe('false');
    for (const key of ['userToken', 'authenticatedUserToken', 'analyticsTags']) expect(params.has(key)).toBe(false);
  }
  expect(requestEvidence.get(page).filter(item => item.url && new URL(item.url).hostname === 'insights.algolia.io')).toEqual([]);
});

test('unresolved and payload-less saved denial: no optional requests or storage; navigation/search stay available', async ({ page }) => {
  const requests = await setup(page);
  await page.waitForTimeout(4200); // exceed Fern idle start so a missing gate fails
  expect(requests).toEqual([]);
  expect(await storage(page)).toEqual({ cookies: [], local: [], session: [] });
  await save(page, categories(), true);
  await page.getByRole('link', { name: 'Support', exact: true }).first().click();
  await expect(page).toHaveURL(/\/support$/);
  await expect(page.locator('h1').first()).toBeVisible();
  // The built-in search trigger must remain usable while analytics is denied.
  const search = page.getByRole('button', { name: 'Search', exact: true });
  await expect(search).toBeVisible();
  await search.click();
  await expect(page.getByRole('dialog').first()).toBeVisible();
  await page.keyboard.press('Escape');
  expect(requests).toEqual([]);
});

test('late grant starts actual SDK; withdrawal blocks fetch/XHR/beacon and clears storage; regrant waits for reload', async ({ page }) => {
  const requests = await setup(page, categories());
  await page.waitForTimeout(3500);
  expect(requests).toEqual([]);
  await save(page, categories('ACCEPT'), true);
  await expect.poll(() => requests.length, { timeout: 15000 }).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.fernAnalyticsConsent)).toBe(true);
  await page.evaluate(() => {
    localStorage.setItem('ph_test_posthog', '{}');
    sessionStorage.setItem('ph_test_posthog', '{}');
    document.cookie = 'ph_test_posthog=1; path=/';
  });
  await save(page, categories());
  expect(await page.evaluate(() => window.fernAnalyticsConsent)).toBe(false);
  expect(await storage(page)).toEqual({ cookies: [], local: [], session: [] });
  const count = requests.length;
  await page.evaluate(async () => {
    await fetch('https://us.i.posthog.com/i/v0/e/', { method: 'POST', body: '{}' });
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://us.i.posthog.com/i/v0/e/');
    xhr.send('{}');
    navigator.sendBeacon('https://us.i.posthog.com/i/v0/e/', '{}');
    window.dispatchEvent(new Event('pagehide'));
  });
  await save(page, categories('ACCEPT'));
  expect(await page.evaluate(() => window.vapiDocsConsent.getSnapshot().analytics)).toBe(true);
  expect(await page.evaluate(() => window.fernAnalyticsConsent)).toBe(false);
  await page.getByRole('link', { name: 'Support', exact: true }).first().click();
  await page.waitForTimeout(2000);
  expect(requests.slice(count)).toEqual([]);
  expect(await storage(page)).toEqual({ cookies: [], local: [], session: [] });
  await page.addInitScript(() => { window.__cmpConsent = { ANALYTICS: 'ACCEPT', MARKETING: 'DENY', PERSONALIZATION: 'DENY' }; });
  await page.reload();
  await expect.poll(() => requests.length, { timeout: 15000 }).toBeGreaterThan(count);
});

for (const restriction of ['GPC', 'OPT-OUT', 'OPT_OUT']) {
  test(`${restriction} restricts optional Analytics and Marketing after Accept All`, async ({ page }) => {
    const accepted = categories('ACCEPT', 'ACCEPT', 'ACCEPT');
    const consent = restriction === 'GPC' ? accepted : { ...accepted, [restriction]: 'ACCEPT' };
    const requests = await setup(page, consent, restriction === 'GPC');
    await page.waitForTimeout(4200);
    const state = await page.evaluate(() => window.vapiDocsConsent.getSnapshot());
    expect(state.analytics).toBe(false);
    expect(state.marketing).toBe(false);
    expect(state.personalization).toBe(true);
    expect(await page.evaluate(() => window.fernAnalyticsConsent)).toBe(false);
    expect(await storage(page)).toEqual({ cookies: [], local: [], session: [] });
    expect(requests).toEqual([]);
    if (restriction === 'GPC') return;
    await save(page, accepted);
    await expect.poll(() => requests.length, { timeout: 15000 }).toBeGreaterThan(0);
    await page.evaluate(category => window.__cmpEmit('onConsentChanged', { [category]: 'ACCEPT' }), restriction);
    const boundary = requests.length;
    expect(await page.evaluate(() => window.fernAnalyticsConsent)).toBe(false);
    await page.evaluate(category => window.__cmpEmit('onConsentChanged', { [category]: 'DENY' }), restriction);
    expect(await page.evaluate(() => window.vapiDocsConsent.getSnapshot().analytics)).toBe(false);
    await save(page, accepted);
    expect(await page.evaluate(() => window.vapiDocsConsent.getSnapshot().analytics)).toBe(true);
    expect(await page.evaluate(() => window.fernAnalyticsConsent)).toBe(false);
    await page.waitForTimeout(1200);
    expect(requests).toHaveLength(boundary);
  });
}

test('denied analytics preserves requested subscription form submission', async ({ page }) => {
  const requests = await setup(page, categories());
  let submissions = 0;
  await page.route('https://customerioforms.com/**', async route => { submissions++; await route.fulfill({ status: 200, body: 'ok' }); });
  await page.goto('/whats-new');
  await expect(page.locator('form.subscribe-form')).toHaveAttribute('data-enhanced', 'true');
  await page.locator('form.subscribe-form input[name="email"]').fill('consent-regression@example.com');
  await page.locator('form.subscribe-form button[type="submit"]').click();
  await expect(page.locator('.subscribe-form-message')).toContainText('Thanks for subscribing');
  expect(submissions).toBe(1);
  expect(requests).toEqual([]);
});

test('withdrawal during the actual SDK import prevents late startup and denied-event replay', async ({ page }) => {
  let release;
  let started;
  const loading = new Promise(resolve => { started = resolve; });
  const unblock = new Promise(resolve => { release = resolve; });
  await page.route('**/_astro/module.*.js', async route => {
    started();
    await unblock;
    await route.continue();
  });
  const requests = await setup(page, categories());
  await save(page, categories('ACCEPT'));
  await loading;
  await save(page, categories());
  release();
  await page.waitForTimeout(3500);
  expect(requests).toEqual([]);
  expect(await storage(page)).toEqual({ cookies: [], local: [], session: [] });
  await save(page, categories('ACCEPT'));
  await page.waitForTimeout(1500);
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => window.fernAnalyticsConsent)).toBe(false);
});

test('actual browser fetch Request and XHR API dispatch carry current consent without affecting auth/body', async ({ page }) => {
  await setup(page, categories());
  const dispatched = [];
  for (const origin of ['https://api.vapi.ai', 'https://api.eu.vapi.ai']) {
    await page.route(`${origin}/__consent-regression`, async route => {
      const request = route.request();
      dispatched.push({ url: request.url(), headers: request.headers(), body: request.postData() });
      await route.fulfill({ status: 200, body: 'ok', headers: { 'Access-Control-Allow-Origin': '*' } });
    });
  }
  // All API traffic in this test uses synthetic, exactly intercepted endpoints.
  await page.evaluate(async () => {
    const request = new Request('https://api.vapi.ai/__consent-regression', {
      method: 'POST', body: 'fetch-body', headers: { Authorization: 'Bearer fixture', 'X-Vapi-Consent-Analytics': 'granted' }
    });
    await fetch(request);
  });
  await save(page, categories('ACCEPT', 'ACCEPT'));
  await page.evaluate(() => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://api.eu.vapi.ai/__consent-regression');
    xhr.setRequestHeader('Authorization', 'Bearer fixture');
    xhr.setRequestHeader('X-Vapi-Consent-Analytics', 'denied');
    xhr.onload = resolve;
    xhr.onerror = reject;
    xhr.send('xhr-body');
  }));
  expect(dispatched).toHaveLength(2);
  expect(dispatched[0].headers['x-vapi-consent-analytics']).toBe('denied');
  expect(dispatched[0].headers['x-vapi-consent-marketing']).toBe('denied');
  expect(dispatched[0].headers.authorization).toBe('Bearer fixture');
  expect(dispatched[0].body).toBe('fetch-body');
  expect(dispatched[1].headers['x-vapi-consent-analytics']).toBe('granted');
  expect(dispatched[1].headers['x-vapi-consent-marketing']).toBe('granted');
  expect(dispatched[1].headers.authorization).toBe('Bearer fixture');
  expect(dispatched[1].body).toBe('xhr-body');
});
