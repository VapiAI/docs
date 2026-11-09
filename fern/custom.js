const WIDGET_TAG = 'vapi-voice-agent-widget';
const ENABLE_VOICE_WIDGET = false; // Feature flag to enable/disable the floating voice widget
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
    var formData = new FormData();
    formData.append('email', email);

    fetch(formAction, {
      method: 'POST',
      body: formData,
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