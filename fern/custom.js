const WIDGET_TAG = 'vapi-voice-agent-widget';
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const WIDGET_SCRIPT_URL = isLocalhost
  ? 'http://localhost:9001/widget.js'
  : 'https://docs-widget.vercel.app/widget.js';

// HockeyStack configuration
const HOCKEYSTACK_API_KEY = '96e358f635f3f5ea7fda26023b10da';

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
  console.log('[custom.js] initializeHockeyStack called');
  
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

function initializeAll() {
  initializeHockeyStack();
  injectVapiWidget();
}

if (document.readyState === 'loading') {
  console.log('[custom.js] Waiting for DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', initializeAll);
} else {
  initializeAll();
} 