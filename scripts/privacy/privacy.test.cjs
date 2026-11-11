const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../fern/assets/privacy.js'), 'utf8');
const categories = (analytics = 'DENY', marketing = 'DENY', personalization = 'DENY') => ({ ANALYTICS: analytics, MARKETING: marketing, PERSONALIZATION: personalization });
function browser({ consent, gpc = false } = {}) {
  const events = [];
  const window = { dispatchEvent: () => events.push(window.fernAnalyticsConsent) };
  const context = vm.createContext({ window, navigator: { globalPrivacyControl: gpc }, Event: class {} });
  vm.runInContext(source, context);
  const callbacks = Object.fromEntries(window.Osano.data.map(args => [...args]));
  window.Osano.cm = { getConsent: () => consent };
  return { window, events, callbacks, context, setConsent: value => { consent = value; }, snapshot: () => window.vapiDocsConsent.getSnapshot() };
}
test('unresolved, failed, malformed CMP deny all without a startup timeout', () => {
  const b = browser();
  b.callbacks.onInitialized();
  assert.equal(b.snapshot().ready, false);
  assert.equal(b.window.fernAnalyticsConsent, false);
  b.setConsent({ ANALYTICS: 'ACCEPT' });
  b.callbacks.onInitialized();
  assert.equal(b.snapshot().analytics, false);
  b.window.Osano.cm.getConsent = () => { throw Error('CMP unavailable'); };
  b.callbacks.onConsentSaved();
  assert.equal(b.snapshot().ready, false);
});
test('resolved default and saved payload-less updates read current consent', () => {
  const b = browser({ consent: categories('ACCEPT') });
  b.callbacks.onInitialized();
  assert.equal(b.snapshot().analytics, true);
  assert.equal(b.events[0], true, 'property is set before Fern event dispatch');
  b.setConsent(categories());
  b.callbacks.onConsentSaved();
  assert.equal(b.snapshot().analytics, false);
  assert.equal(b.events[1], false);
});
test('late grant starts now; withdrawal increments generation and regrant needs reload', () => {
  const b = browser();
  const seen = [];
  const unsubscribe = b.window.vapiDocsConsent.subscribe(s => seen.push(s));
  b.callbacks.onInitialized(categories());
  b.callbacks.onConsentSaved(categories('ACCEPT'));
  assert.equal(b.window.fernAnalyticsConsent, true);
  const granted = b.snapshot();
  b.callbacks.onConsentSaved(categories());
  assert.ok(b.snapshot().generation > granted.generation);
  assert.equal(b.window.fernAnalyticsConsent, false);
  b.callbacks.onConsentSaved(categories('ACCEPT'));
  assert.equal(b.snapshot().analytics, true);
  assert.equal(b.window.fernAnalyticsConsent, false);
  assert.ok(Object.isFrozen(b.snapshot()));
  unsubscribe();
  const count = seen.length;
  b.callbacks.onConsentSaved(categories());
  assert.equal(seen.length, count);
});
test('unsaved grants never authorize; denial toggles stop before save', () => {
  const b = browser({ consent: categories('ACCEPT') });
  b.callbacks.onInitialized();
  b.callbacks.onConsentChanged({ ANALYTICS: 'DENY' });
  assert.equal(b.snapshot().analytics, false);
  b.callbacks.onConsentChanged({ ANALYTICS: 'ACCEPT' });
  assert.equal(b.snapshot().analytics, false);
  b.callbacks.onConsentSaved();
  assert.equal(b.snapshot().analytics, true);
  assert.equal(b.window.fernAnalyticsConsent, false);
  const denied = browser({ consent: categories() });
  denied.callbacks.onInitialized();
  denied.callbacks.onConsentChanged({ ANALYTICS: 'ACCEPT' });
  assert.equal(denied.snapshot().analytics, false);
});
test('GPC and browser opt-out restrict Analytics and Marketing while Personalization remains independent', () => {
  for (const gpc of [false, true]) {
    const b = browser({ gpc });
    b.callbacks.onInitialized(categories('ACCEPT', 'ACCEPT', 'ACCEPT'));
    assert.equal(b.snapshot().marketing, !gpc);
    assert.equal(b.snapshot().analytics, !gpc);
    b.setConsent({ ...categories('ACCEPT', 'ACCEPT', 'ACCEPT'), 'OPT-OUT': 'ACCEPT' });
    b.callbacks.onOptOut();
    assert.equal(b.snapshot().marketing, false);
    assert.equal(b.snapshot().analytics, false);
    assert.equal(b.snapshot().personalization, true);
    const update = [...b.window.dataLayer.at(-1)][2];
    assert.equal(update.ad_storage, 'denied');
    assert.equal(update.ad_user_data, 'denied');
    assert.equal(update.ad_personalization, 'denied');
    assert.equal(update.analytics_storage, 'denied');
    assert.equal(update.personalization_storage, 'granted');
  }
});
test('duplicate script evaluation preserves snapshot and withdrawal latch', () => {
  const b = browser();
  b.callbacks.onInitialized(categories('ACCEPT'));
  b.callbacks.onConsentSaved(categories());
  const adapter = b.window.vapiDocsConsent;
  vm.runInContext(source, b.context);
  assert.equal(b.window.vapiDocsConsent, adapter);
  b.callbacks.onConsentSaved(categories('ACCEPT'));
  assert.equal(b.window.fernAnalyticsConsent, false);
});
test('payload-less explicit opt-out stops both optional purposes even before the saved getter updates', () => {
  const b = browser({ consent: categories('ACCEPT', 'ACCEPT', 'ACCEPT') });
  b.callbacks.onInitialized();
  b.callbacks.onOptOut();
  assert.equal(b.snapshot().analytics, false);
  assert.equal(b.snapshot().marketing, false);
  assert.equal(b.window.fernAnalyticsConsent, false);
  b.callbacks.onConsentSaved();
  assert.equal(b.snapshot().analytics, true);
  assert.equal(b.window.fernAnalyticsConsent, false);
});
test('docs config enables native gate and loads preload/CMP before custom functionality', () => {
  const config = fs.readFileSync(path.join(__dirname, '../../fern/docs.yml'), 'utf8');
  assert.match(config, /require-analytics-consent: true/);
  assert.match(config, /js:\n  - path: \.\/assets\/privacy-search\.js\n    strategy: beforeInteractive\n  - path: \.\/assets\/privacy\.js/);
  assert.match(config, /privacy\.js\n    strategy: beforeInteractive\n  - url: https:\/\/cmp\.osano\.com\//);
  assert.doesNotMatch(config, /\n  (ga4|gtm):/);
  const custom = fs.readFileSync(path.join(__dirname, '../../fern/custom.js'), 'utf8');
  assert.doesNotMatch(custom, /hockeystack|static\.reo|hs-scripts|snap\.licdn|posthog\.set_config/i);
  assert.match(custom, /function initializeSubscribeForm\(/);
});

test('both documented Osano opt-out spellings restrict optional Analytics and Marketing after Accept All', () => {
  for (const category of ['OPT-OUT', 'OPT_OUT']) {
    const b = browser({ consent: { ...categories('ACCEPT', 'ACCEPT', 'ACCEPT'), [category]: 'ACCEPT' } });
    b.callbacks.onInitialized();
    assert.equal(b.snapshot().marketing, false);
    assert.equal(b.snapshot().analytics, false);
    assert.equal(b.window.fernAnalyticsConsent, false);
    b.setConsent(categories('ACCEPT', 'ACCEPT', 'ACCEPT'));
    b.callbacks.onConsentSaved();
    assert.equal(b.snapshot().marketing, true);
    assert.equal(b.snapshot().analytics, true);
    b.callbacks.onConsentChanged({ [category]: 'ACCEPT' });
    assert.equal(b.snapshot().marketing, false);
    assert.equal(b.snapshot().analytics, false);
    assert.equal(b.window.fernAnalyticsConsent, false);
    b.callbacks.onConsentChanged({ [category]: 'DENY' });
    b.callbacks.onOptOut();
    assert.equal(b.snapshot().analytics, false, 'unsaved removal cannot undo pending opt-out');
    b.callbacks.onConsentSaved();
    assert.equal(b.snapshot().analytics, true);
    assert.equal(b.window.fernAnalyticsConsent, false, 'withdrawal latch prevents denied replay');
  }
});
test('Analytics-only and Personalization-only consent never grant other Google purposes', () => {
  for (const consent of [categories('ACCEPT'), categories('DENY', 'DENY', 'ACCEPT')]) {
    const b = browser({ consent });
    b.callbacks.onInitialized();
    const google = [...b.window.dataLayer.at(-1)][2];
    assert.equal(google.analytics_storage, consent.ANALYTICS === 'ACCEPT' ? 'granted' : 'denied');
    assert.equal(google.personalization_storage, consent.PERSONALIZATION === 'ACCEPT' ? 'granted' : 'denied');
    for (const field of ['ad_storage', 'ad_user_data', 'ad_personalization']) assert.equal(google[field], 'denied');
  }
});
