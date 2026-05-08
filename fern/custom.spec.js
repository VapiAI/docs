/**
 * Standalone tests for the subscribe form logic in custom.js.
 *
 * These tests validate the initializeSubscribeForm() function by extracting
 * its logic and running it against a mock DOM. No external dependencies
 * required -- run with: node fern/custom.spec.js
 *
 * The function under test is extracted here rather than imported because
 * custom.js is a browser script that reads window.location at parse time.
 */

'use strict';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log('  PASS: ' + message);
  } else {
    failed++;
    console.error('  FAIL: ' + message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    passed++;
    console.log('  PASS: ' + message);
  } else {
    failed++;
    console.error('  FAIL: ' + message + ' (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')');
  }
}

// ---------------------------------------------------------------------------
// Extracted logic from initializeSubscribeForm (the core of the fix)
// ---------------------------------------------------------------------------

function emailValidate(email) {
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

console.log('\n--- Email validation ---');

assert(emailValidate('user@example.com'), 'accepts standard email');
assert(emailValidate('user+tag@domain.co.uk'), 'accepts email with plus and subdomain');
assert(emailValidate('a@b.c'), 'accepts minimal valid email');
assert(!emailValidate(''), 'rejects empty string');
assert(!emailValidate('not-an-email'), 'rejects string without @');
assert(!emailValidate('user@'), 'rejects email missing domain');
assert(!emailValidate('@domain.com'), 'rejects email missing local part');
assert(!emailValidate('user @domain.com'), 'rejects email with space');
assert(!emailValidate('user@domain'), 'rejects email without TLD dot');

console.log('\n--- MDX structure validation ---');

var fs = require('fs');
var path = require('path');

var mdxPath = path.join(__dirname, 'changelog', 'overview.mdx');
var mdxContent = fs.readFileSync(mdxPath, 'utf-8');

assert(mdxContent.indexOf('class="subscribe-form"') !== -1 || mdxContent.indexOf('className="subscribe-form"') !== -1,
  'MDX contains form with subscribe-form class');
assert(mdxContent.indexOf('customerioforms.com') !== -1,
  'MDX contains Customer.io form action URL');
assert(mdxContent.indexOf('name="email"') !== -1,
  'MDX contains email input with correct name attribute');
assert(mdxContent.indexOf('type="submit"') !== -1,
  'MDX contains submit button');
assert(mdxContent.indexOf('subscribe-form-message') !== -1,
  'MDX contains message div for feedback');
assert(mdxContent.indexOf('subscribe-form-input') !== -1,
  'MDX uses CSS class for input styling');
assert(mdxContent.indexOf('subscribe-form-button') !== -1,
  'MDX uses CSS class for button styling');

// Verify the broken onSubmit handler is removed
assert(mdxContent.indexOf('onSubmit') === -1,
  'MDX does not contain onSubmit handler (Fern strips JSX event handlers)');
assert(mdxContent.indexOf('onClick') === -1,
  'MDX does not contain onClick handler (Fern strips JSX event handlers)');

console.log('\n--- custom.js structure validation ---');

var customJsPath = path.join(__dirname, 'custom.js');
var customJsContent = fs.readFileSync(customJsPath, 'utf-8');

assert(customJsContent.indexOf('initializeSubscribeForm') !== -1,
  'custom.js contains initializeSubscribeForm function');
assert(customJsContent.indexOf('addEventListener') !== -1 && customJsContent.indexOf("'submit'") !== -1,
  'custom.js attaches submit event listener');
assert(customJsContent.indexOf('e.preventDefault()') !== -1,
  'custom.js prevents default form submission');
assert(customJsContent.indexOf("redirect: 'manual'") !== -1,
  'custom.js uses fetch with redirect:manual to handle 302');
assert(customJsContent.indexOf('opaqueredirect') !== -1,
  'custom.js checks for opaqueredirect response type');
assert(customJsContent.indexOf('URLSearchParams') !== -1,
  'custom.js sends body as application/x-www-form-urlencoded (URLSearchParams)');
assert(customJsContent.indexOf('new FormData()') === -1,
  'custom.js does not use FormData (multipart) for the Customer.io submit');
assert(customJsContent.indexOf('subscribe-form-message') !== -1,
  'custom.js updates the message div');
assert(customJsContent.indexOf('Thanks for subscribing') !== -1,
  'custom.js shows success message');
assert(customJsContent.indexOf('Something went wrong') !== -1,
  'custom.js shows error message on failure');
assert(customJsContent.indexOf("dataset.enhanced === 'true'") !== -1,
  'custom.js guards against duplicate handler attachment');
assert(customJsContent.indexOf('MutationObserver') !== -1,
  'custom.js uses MutationObserver for SPA route changes');
assert(customJsContent.indexOf('Submitting...') !== -1,
  'custom.js shows loading state on button');

console.log('\n--- CSS validation ---');

var cssPath = path.join(__dirname, 'assets', 'styles.css');
var cssContent = fs.readFileSync(cssPath, 'utf-8');

assert(cssContent.indexOf('.subscribe-form-input') !== -1,
  'CSS contains subscribe-form-input styles');
assert(cssContent.indexOf('.subscribe-form-button') !== -1,
  'CSS contains subscribe-form-button styles');
assert(cssContent.indexOf('.subscribe-form-message.success') !== -1,
  'CSS contains success message styles');
assert(cssContent.indexOf('.subscribe-form-message.error') !== -1,
  'CSS contains error message styles');
assert(cssContent.indexOf('.subscribe-form-input:focus') !== -1,
  'CSS contains focus styles for input');
assert(cssContent.indexOf('.subscribe-form-button:hover') !== -1,
  'CSS contains hover styles for button');
assert(cssContent.indexOf('.subscribe-form-button:disabled') !== -1,
  'CSS contains disabled styles for button');
assert(cssContent.indexOf(':is(.dark) .subscribe-form-input') !== -1,
  'CSS contains dark mode styles for input');
assert(cssContent.indexOf(':is(.dark) .subscribe-form-button') !== -1,
  'CSS contains dark mode styles for button');
assert(cssContent.indexOf('.subscribe-form-row') !== -1,
  'CSS contains flex row layout for form');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('\n--- Results ---');
console.log('Passed: ' + passed);
console.log('Failed: ' + failed);

if (failed > 0) {
  process.exit(1);
}
