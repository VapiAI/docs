// Fern's pinned Algolia integration has no public pre-initialization opt-out.
// Keep necessary search, but disable its optional analytics for every visitor.
// Audit these transport/storage contracts whenever the Fern bundle changes.
(function () {
  if (window.__vapiDocsSearchPrivacy) return;
  window.__vapiDocsSearchPrivacy = true;
  var optional = ['userToken', 'authenticatedUserToken', 'analyticsTags'];
  var success = JSON.stringify({ status: 200, message: 'OK' });
  function target(input) {
    try {
      var url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, window.location.href);
      var host = url.hostname.toLowerCase();
      if (url.origin === window.location.origin && url.pathname === '/api/fern-docs/search/v2/key') return { url: url, key: true };
      if (url.protocol !== 'https:' || url.port) return { url: url };
      if (/^(insights|insights\.(us|de))\.algolia\.io$/.test(host) && url.pathname === '/1/events') return { url: url, insights: true };
      if (/^p6vyurbgg0(?:-dsn)?\.algolia\.net$|^p6vyurbgg0-[123]\.algolianet\.com$/.test(host) && /^\/1\/indexes\/[^/]+\/(queries|query)$/.test(url.pathname)) return { url: url, search: true };
      return { url: url };
    } catch (_) { return {}; }
  }
  function object(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('Unsupported Algolia search encoding');
    optional.forEach(function (name) { delete value[name]; });
    if ('requests' in value) {
      if (!Array.isArray(value.requests)) throw new TypeError('Unsupported Algolia search encoding');
      delete value.analytics;
      delete value.clickAnalytics;
      value.requests = value.requests.map(object);
    } else {
      value.analytics = false;
      value.clickAnalytics = false;
    }
    if ('params' in value) value.params = typeof value.params === 'string' ? parameters(value.params).toString() : object(value.params);
    return value;
  }
  function parameters(value) {
    var params = new URLSearchParams(value);
    optional.forEach(function (name) { params.delete(name); });
    params.set('analytics', 'false');
    params.set('clickAnalytics', 'false');
    if (params.has('params')) params.set('params', parameters(params.get('params')).toString());
    if (params.has('requests')) params.set('requests', JSON.stringify(JSON.parse(params.get('requests')).map(object)));
    return params;
  }
  function body(value) {
    if (value == null || value === '') return value;
    if (value instanceof URLSearchParams) return parameters(value);
    if (typeof value !== 'string') throw new TypeError('Unsupported Algolia search encoding');
    try { return JSON.stringify(object(JSON.parse(value))); }
    catch (error) {
      // The pinned client sends JSON. Also support documented form parameters;
      // an unknown future encoding must not silently restore optional collection.
      if (!value.includes('=') || /^[\s]*[\[{]/.test(value)) throw error;
      return parameters(value).toString();
    }
  }
  function searchURL(info) {
    info.url.search = parameters(info.url.search).toString();
    return info.url.href;
  }
  function optionalHeader(name) { return /^x-algolia-(user-token|usertoken|authenticated-user-token|authenticatedusertoken)$/i.test(name); }
  if (typeof window.fetch === 'function') {
    var fetch = window.fetch;
    window.fetch = function (input, init) {
      var info = target(input);
      if (info.insights) return Promise.resolve(new Response(success, { status: 200, headers: { 'Content-Type': 'application/json' } }));
      if (!info.search && !info.key) return fetch.call(this, input, init);
      var receiver = this;
      return Promise.resolve().then(async function () {
        var request = new Request(input instanceof Request ? input : info.url.href, init);
        var headers = new Headers(request.headers);
        if (info.key) headers.delete('X-User-Token');
        if (info.search) Array.from(headers.keys()).forEach(function (name) { if (optionalHeader(name)) headers.delete(name); });
        var next = new Request(info.search ? searchURL(info) : info.url.href, request);
        var options = { headers: headers };
        if (info.search && request.method !== 'GET' && request.method !== 'HEAD') options.body = body(await request.clone().text());
        return fetch.call(receiver, new Request(next, options));
      });
    };
  }
  if (navigator && typeof navigator.sendBeacon === 'function') {
    var beacon = navigator.sendBeacon;
    navigator.sendBeacon = function (url, data) {
      if (target(url).insights) return true; // Accepted locally: do not trigger SDK fallback.
      return beacon.call(this, url, data);
    };
  }
  if (typeof XMLHttpRequest !== 'undefined') {
    var targets = new WeakMap();
    var localResponses = new WeakSet();
    function clearLocalResponse(xhr) {
      if (!localResponses.has(xhr)) return;
      ['readyState', 'status', 'statusText', 'responseText', 'response'].forEach(function (name) { delete xhr[name]; });
      localResponses.delete(xhr);
    }
    var open = XMLHttpRequest.prototype.open;
    var send = XMLHttpRequest.prototype.send;
    var header = XMLHttpRequest.prototype.setRequestHeader;
    var abort = XMLHttpRequest.prototype.abort;
    XMLHttpRequest.prototype.open = function (method, url) {
      // Remove a prior local response before reusing this native XHR instance.
      clearLocalResponse(this);
      var info = target(url);
      targets.set(this, info);
      var args = Array.prototype.slice.call(arguments);
      if (info.search) args[1] = searchURL(info);
      try { return open.apply(this, args); }
      catch (error) { targets.delete(this); throw error; }
    };
    XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
      var info = targets.get(this);
      if (info && ((info.key && /^x-user-token$/i.test(name)) || (info.search && optionalHeader(name)))) return;
      return header.call(this, name, value);
    };
    XMLHttpRequest.prototype.abort = function () {
      targets.delete(this);
      clearLocalResponse(this);
      return abort.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function (data) {
      var info = targets.get(this);
      if (!info || !info.insights) return send.call(this, info && info.search ? body(data) : data);
      var xhr = this;
      // The SDK's XHR sender requires readyState=4, HTTP 200, and JSON success.
      // Settle asynchronously without invoking native send or a retrying error.
      setTimeout(function () {
        if (targets.get(xhr) !== info) return;
        localResponses.add(xhr);
        Object.defineProperties(xhr, {
          readyState: { configurable: true, value: 4 }, status: { configurable: true, value: 200 },
          statusText: { configurable: true, value: 'OK' },
          responseText: { configurable: true, value: success },
          response: { configurable: true, value: xhr.responseType === 'json' ? JSON.parse(success) : success }
        });
        ['readystatechange', 'load', 'loadend'].forEach(function (name) {
          if (targets.get(xhr) === info) xhr.dispatchEvent(new Event(name));
        });
      }, 0);
    };
  }
  // Only audited optional keys: do not disturb Algolia's necessary host cache.
  var keys = ['algolia-user-token', 'AlgoliaObjectQueryCache'];
  if (typeof Storage !== 'undefined') {
    var get = Storage.prototype.getItem;
    var set = Storage.prototype.setItem;
    var remove = Storage.prototype.removeItem;
    ['localStorage', 'sessionStorage'].forEach(function (name) {
      try { keys.forEach(function (key) { remove.call(window[name], key); }); } catch (_) { /* Storage may be unavailable. */ }
    });
    Storage.prototype.getItem = function (key) { return keys.includes(String(key)) ? null : get.apply(this, arguments); };
    Storage.prototype.setItem = function (key) { if (!keys.includes(String(key))) return set.apply(this, arguments); };
  }
  if (typeof Document !== 'undefined') {
    var cookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    if (cookie && cookie.get && cookie.set && cookie.configurable) {
      // Remove the known cookie at the current and ancestor domain scopes.
      var domains = window.location.hostname.split('.');
      try {
        cookie.set.call(document, '_ALGOLIA=; Max-Age=0; Path=/');
        while (domains.length > 1) {
          cookie.set.call(document, '_ALGOLIA=; Max-Age=0; Path=/; Domain=' + domains.join('.'));
          domains.shift();
        }
      } catch (_) { /* Cookies may be unavailable. */ }
      Object.defineProperty(Document.prototype, 'cookie', {
        configurable: true, enumerable: cookie.enumerable,
        get: function () { return cookie.get.call(this).split(';').filter(function (part) { return !/^\s*_ALGOLIA=/.test(part); }).join(';'); },
        set: function (value) { if (!/^\s*_ALGOLIA=/.test(String(value))) cookie.set.call(this, value); }
      });
    }
  }
})();
