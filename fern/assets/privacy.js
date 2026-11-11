// Necessary consent control only. Optional SDKs must use this snapshot; do not
// add loaders here without verified startup-race and withdrawal controls.
(function () {
  if (window.vapiDocsConsent) return;

  var snapshot = Object.freeze({ ready: false, analytics: false, marketing: false, personalization: false, generation: 0 });
  var listeners = new Set();
  var pendingDenials = {};
  var fernGranted = false;
  var fernWithdrawn = false;
  window.fernAnalyticsConsent = false;

  // This adapter is the only application Google-consent writer. The Osano
  // automatic bridge must be disabled in the release configuration (runbook).
  window.dataLayer = window.dataLayer || [];
  function googleConsent(command, state) {
    function gtag() { window.dataLayer.push(arguments); }
    gtag('consent', command, {
      analytics_storage: state.analytics ? 'granted' : 'denied',
      ad_storage: state.marketing ? 'granted' : 'denied',
      ad_user_data: state.marketing ? 'granted' : 'denied',
      ad_personalization: state.marketing ? 'granted' : 'denied',
      personalization_storage: state.personalization ? 'granted' : 'denied'
    });
  }
  googleConsent('default', snapshot);

  window.vapiDocsConsent = Object.freeze({
    getSnapshot: function () { return snapshot; },
    subscribe: function (listener) {
      listeners.add(listener);
      return function () { listeners.delete(listener); };
    }
  });

  function readConsent() {
    try { return window.Osano.cm.getConsent(); } catch (_) { return undefined; }
  }
  function valid(value) { return value === 'ACCEPT' || value === 'DENY'; }
  function reconcile(consent) {
    consent = consent || readConsent();
    if (consent) consent = Object.assign({}, consent, pendingDenials);
    var ready = !!consent && valid(consent.ANALYTICS) && valid(consent.MARKETING) && valid(consent.PERSONALIZATION);
    // Explicit Do Not Sell/Share and GPC restrict both optional purposes.
    // A plain Marketing category denial does not imply a Do Not Sell/Share choice.
    var optedOut = !!consent && (consent['OPT-OUT'] === 'ACCEPT' || consent.OPT_OUT === 'ACCEPT') || navigator.globalPrivacyControl === true;
    var next = {
      ready: ready,
      analytics: ready && !optedOut && consent.ANALYTICS === 'ACCEPT',
      marketing: ready && !optedOut && consent.MARKETING === 'ACCEPT',
      personalization: ready && consent.PERSONALIZATION === 'ACCEPT',
      generation: snapshot.generation + 1
    };
    if (next.ready === snapshot.ready && next.analytics === snapshot.analytics && next.marketing === snapshot.marketing && next.personalization === snapshot.personalization) return;
    snapshot = Object.freeze(next);
    // Fern's native gate reads the property, not event.detail. Latch withdrawal
    // even during SDK import/idle startup: no regrant on this page after a grant.
    if (fernGranted && !next.analytics) fernWithdrawn = true;
    var allowFern = next.analytics && !fernWithdrawn;
    if (allowFern) fernGranted = true;
    window.fernAnalyticsConsent = allowFern;
    window.dispatchEvent(new Event('fern-analytics-consent'));
    googleConsent('update', next);
    listeners.forEach(function (listener) { listener(snapshot); });
  }

  // Official preload queue closes the late-CMP race without a polling timeout.
  window.Osano = window.Osano || function () { window.Osano.data.push(arguments); };
  window.Osano.data = window.Osano.data || [];
  window.Osano('onInitialized', reconcile);
  window.Osano('onConsentSaved', function (consent) {
    pendingDenials = {};
    reconcile(consent);
  });
  window.Osano('onOptOut', function () {
    // Documented payload-less signal is authoritative even if getConsent lags.
    pendingDenials.OPT_OUT = 'ACCEPT';
    reconcile();
  });
  window.Osano('onConsentChanged', function (change) {
    // Unsaved acceptance is not a grant. A toggle to denial takes effect now,
    // even if getConsent() still reports the last saved state.
    var consent = readConsent();
    if (change && consent) {
      ['ANALYTICS', 'MARKETING', 'PERSONALIZATION'].forEach(function (category) {
        if (change[category] === 'DENY') pendingDenials[category] = 'DENY';
      });
      if (change['OPT-OUT'] === 'ACCEPT') pendingDenials['OPT-OUT'] = 'ACCEPT';
      if (change.OPT_OUT === 'ACCEPT') pendingDenials.OPT_OUT = 'ACCEPT';
    }
    reconcile(consent);
  });
})();
