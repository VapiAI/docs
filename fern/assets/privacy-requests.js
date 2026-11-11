// Necessary Vapi API requests still run when optional collection is denied.
// Stamp only the audited API origins, at dispatch, without modifying auth,
// credentials, body, signal, or other caller headers.
(function () {
  if (window.__vapiDocsConsentRequests) return;
  window.__vapiDocsConsentRequests = true;
  function applicable(input) {
    try {
      var url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, window.location.href);
      return url.origin === 'https://api.vapi.ai' || url.origin === 'https://api.eu.vapi.ai';
    } catch (_) { return false; }
  }
  function values() {
    var state = window.vapiDocsConsent && window.vapiDocsConsent.getSnapshot();
    return {
      'X-Vapi-Consent-Analytics': state && state.ready && state.analytics ? 'granted' : 'denied',
      'X-Vapi-Consent-Marketing': state && state.ready && state.marketing ? 'granted' : 'denied'
    };
  }
  if (typeof window.fetch === 'function') {
    var fetch = window.fetch;
    window.fetch = function (input, init) {
      if (!applicable(input)) return fetch.call(this, input, init);
      var source = init && init.headers !== undefined ? init.headers : input && input.headers;
      var headers = new Headers(source);
      var consent = values();
      Object.keys(consent).forEach(function (name) { headers.set(name, consent[name]); });
      return fetch.call(this, input, Object.assign({}, init, { headers: headers }));
    };
  }
  if (typeof XMLHttpRequest !== 'undefined') {
    var targets = new WeakMap();
    var open = XMLHttpRequest.prototype.open;
    var setHeader = XMLHttpRequest.prototype.setRequestHeader;
    var send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function () {
      // open() can synchronously fire readystatechange; callers may send from
      // that callback, so classify before entering the native method.
      targets.set(this, applicable(arguments[1]));
      try { return open.apply(this, arguments); }
      catch (error) { targets.delete(this); throw error; }
    };
    XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
      // These two reserved headers are adapter-owned. Avoid XHR appending a
      // stale caller grant to the current value supplied immediately at send.
      if (targets.get(this) && /^x-vapi-consent-(analytics|marketing)$/i.test(name)) return;
      return setHeader.call(this, name, value);
    };
    XMLHttpRequest.prototype.send = function () {
      if (targets.get(this)) {
        var consent = values();
        var xhr = this;
        Object.keys(consent).forEach(function (name) { setHeader.call(xhr, name, consent[name]); });
      }
      return send.apply(this, arguments);
    };
  }
})();
