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

function initializeSubscribeForm() {
  // Fern's MDX renderer strips JSX event handlers (onSubmit, onClick), so the
  // form's validation and submission logic must be attached from plain JS.
  // Without this, the form falls through to a native HTML POST that silently
  // redirects back to the same page with no user feedback.

  var form = document.querySelector('form.subscribe-form');
  if (!form) {
    return;
  }

  // Avoid attaching the handler twice on SPA navigations
  if (form.dataset.enhanced === 'true') {
    return;
  }
  form.dataset.enhanced = 'true';

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var emailInput = form.querySelector('input[name="email"]');
    var submitBtn = form.querySelector('button[type="submit"]');
    var messageDiv = form.querySelector('.subscribe-form-message');

    if (!emailInput || !submitBtn) {
      return;
    }

    var email = emailInput.value.trim();
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      if (messageDiv) {
        messageDiv.textContent = 'Please enter a valid email address.';
        messageDiv.className = 'subscribe-form-message error';
        messageDiv.style.display = 'block';
      }
      return;
    }

    // Hide any previous message and disable the button while submitting
    if (messageDiv) {
      messageDiv.style.display = 'none';
    }
    submitBtn.disabled = true;
    var originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';

    var formAction = form.getAttribute('action');
    // Customer.io's submit_action endpoint expects application/x-www-form-urlencoded
    // (the encoding native HTML form POSTs use). FormData sends multipart/form-data,
    // which the endpoint accepts but does not record as a form_submit event.
    var body = new URLSearchParams();
    body.append('email', email);

    fetch(formAction, {
      method: 'POST',
      body: body,
      redirect: 'manual',
    })
      .then(function (response) {
        // Customer.io returns 302 on success which becomes an opaque redirect
        // with redirect:'manual'. Both 302 and opaque (type 0) indicate success.
        if (response.ok || response.status === 302 || response.status === 0 || response.type === 'opaqueredirect') {
          if (messageDiv) {
            messageDiv.textContent = 'Thanks for subscribing! You will receive product updates at ' + email + '.';
            messageDiv.className = 'subscribe-form-message success';
            messageDiv.style.display = 'block';
          }
          emailInput.value = '';
        } else {
          throw new Error('Unexpected response: ' + response.status);
        }
      })
      .catch(function () {
        if (messageDiv) {
          messageDiv.textContent = 'Something went wrong. Please try again.';
          messageDiv.className = 'subscribe-form-message error';
          messageDiv.style.display = 'block';
        }
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      });
  });
}

function initializeAll() {
  initializeHockeyStack();
  initializeReo();
  initializeHubSpot();
  configurePostHog();
  initializeSubscribeForm();
  if (ENABLE_VOICE_WIDGET) {
    injectVapiWidget();
  }
}

// Fern uses client-side routing, so the form may appear after the initial page
// load. Re-attach the handler whenever the DOM changes on the whats-new page.
var subscribeFormObserver = new MutationObserver(function () {
  if (window.location.pathname.indexOf('whats-new') !== -1) {
    initializeSubscribeForm();
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    initializeAll();
    subscribeFormObserver.observe(document.body, { childList: true, subtree: true });
  });
} else {
  initializeAll();
  subscribeFormObserver.observe(document.body, { childList: true, subtree: true });
}