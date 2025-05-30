const WIDGET_TAG = 'vapi-voice-agent-widget';
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const WIDGET_SCRIPT_URL = isLocalhost
  ? 'http://localhost:9001/widget.js'
  : 'https://docs-widget.vercel.app/widget.js';

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

if (document.readyState === 'loading') {
  console.log('[custom.js] Waiting for DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', injectVapiWidget);
} else {
  injectVapiWidget();
} 