const WIDGET_TAG = 'vapi-voice-agent-widget';
const ENABLE_VOICE_WIDGET = false; // Feature flag to enable/disable the floating voice widget
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const WIDGET_SCRIPT_URL = isLocalhost
  ? 'http://localhost:9001/widget.js'
  : 'https://docs-widget.vercel.app/widget.js';

const HOCKEYSTACK_API_KEY = '96e358f635f3f5ea7fda26023b10da';
const REO_CLIENT_ID = '0dc28e3fda800b9';

function injectVapiWidget() {
  console.log('[custom.js] injectVapiWidget called');
  if (document.querySelector(WIDGET_TAG)) {
    console.log('[custom.js] Widget already present in DOM');
    return;
  }

  const script = document.createElement('script');
  script.src = WIDGET_SCRIPT_URL;
  script.async = true;
  script.onload = () => {
    console.log('[custom.js] Widget script loaded');
    // Create the web component after the script loads
    const widget = document.createElement(WIDGET_TAG);
    const apiKey = '6d46661c-2dce-4032-b62d-64c151a14e0d';
    widget.setAttribute('apiKey', apiKey);
    widget.style.position = 'fixed';
    widget.style.bottom = '0';
    widget.style.right = '0';
    widget.style.zIndex = '9999';
    document.body.appendChild(widget);
    console.log('[custom.js] Widget element appended to DOM');
  };
  document.body.appendChild(script);
  console.log('[custom.js] Widget script appended to DOM');
}

function initializeHockeyStack() {
  if (isLocalhost) {
    console.log('[custom.js] Skipping HockeyStack on localhost');
    return;
  }

  var hsscript = document.createElement("script");
  hsscript.id = "wphs";
  hsscript.src = "https://cdn.jsdelivr.net/npm/hockeystack@latest/hockeystack.min.js";
  hsscript.async = 1;
  hsscript.dataset.apikey = HOCKEYSTACK_API_KEY;
  hsscript.dataset.cookieless = 1;
  hsscript.dataset.autoIdentify = 1;

  document.getElementsByTagName('head')[0].append(hsscript);
}

function initializeReo() {
  if (isLocalhost) {
    console.log('[custom.js] Skipping Reo on localhost');
    return;
  }

  var reoScript = document.createElement("script");
  reoScript.type = "text/javascript";
  reoScript.src = "https://static.reo.dev/" + REO_CLIENT_ID + "/reo.js";
  reoScript.defer = true;
  reoScript.onload = function() {
    if (typeof Reo !== 'undefined') {
      Reo.init({ clientID: REO_CLIENT_ID });
    }
  };
  document.head.appendChild(reoScript);
}

function configurePostHog() {
  if (isLocalhost) {
    console.log('[custom.js] Skipping PostHog configuration on localhost');
    return;
  }

  // Wait for PostHog to be initialized by Fern
  const checkPostHog = setInterval(() => {
    if (typeof window.posthog !== 'undefined') {
      clearInterval(checkPostHog);
      
      // Configure cross-domain tracking
      window.posthog.set_config({
        cross_subdomain_cookie: true,
        cross_domain: '.vapi.ai',
        persistence: 'localStorage+cookie'
      });
      
    }
  }, 100);
  
}

function initializeHubSpot() {

  if (isLocalhost) {
    console.log('[custom.js] Skipping HubSpot configuration on localhost');
    return;
  }

  var hubSpotScript = document.createElement("script");
  hubSpotScript.type = "text/javascript";
  hubSpotScript.id = "hs-script-loader";
  hubSpotScript.src = "https://js-na2.hs-scripts.com/244349038.js";
  hubSpotScript.async = true;
  hubSpotScript.defer = true;
  document.getElementsByTagName('head')[0].appendChild(hubSpotScript);
}

function initializeAll() {
  initializeHockeyStack();
  initializeReo();
  initializeHubSpot();
  configurePostHog();
  if (ENABLE_VOICE_WIDGET) {
    injectVapiWidget();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAll);
} else {
  initializeAll();
} 