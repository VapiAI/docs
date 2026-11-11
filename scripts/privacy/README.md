# Docs consent

`fern/docs.yml` requires Fern native analytics consent. `fern/assets/privacy.js`
exports `window.vapiDocsConsent.getSnapshot()` and `subscribe(listener)` (returns
an unsubscribe function). A frozen snapshot contains `ready`, `analytics`,
`marketing`, `personalization`, and monotonically increasing `generation`.
Unresolved/malformed CMP state denies optional collection. Osano owns regional
rules and saved preferences; there are no public-site account lookups.

The adapter reconciles initialized/saved callbacks, including absent payloads
through `Osano.cm.getConsent()` (see the [official Osano API](https://developers.osano.com/cmp/javascript-api/developer-documentation-consent-javascript-api)). Unsaved acceptance does not grant permission;
a denial toggle stops immediately. Optional Analytics and Marketing both respect
GPC and Osano's explicit `OPT-OUT`/`OPT_OUT` Do Not Sell/Share choice. A plain
Marketing category denial leaves Analytics independent. Unsaved opt-out removal
cannot undo a pending restriction before save. Future asynchronous optional integrations must compare the initiating
snapshot generation with the current generation before startup/send; never
queue/replay denied events. Integrations without verified stop behavior stay off.

Fern 5.169.0's CLI schema documents `settings.require-analytics-consent` and
`window.fernAnalyticsConsent` followed by `window.dispatchEvent(new
Event('fern-analytics-consent'))`. The bridge writes the property before the
event. Initial/late grants activate collection; withdrawal sets false immediately
and latches Fern off until full reload, including withdrawal during SDK import.
The local Astro runtime implements a native denied transport guard and removes
PostHog cookies/local/session storage. Test that runtime on every Fern upgrade.
Necessary framework modules may load before Osano; their presence is not evidence
of optional SDK initialization. Fern emits remote head scripts before local head
scripts, so registration also handles Osano's immediate initialized replay.

`privacy-requests.js` stamps current effective consent at fetch/XHR dispatch only
to `https://api.vapi.ai` and `https://api.eu.vapi.ai`. Fern's
`settings.disable-explorer-proxy: true` sends native API playground requests
directly to those API origins so this adapter can stamp consent at dispatch.
Other origins, docs framework requests, and CDNs are untouched. Request/init
headers, auth, bodies, credentials, and signals retain native behavior. The two
consent headers are adapter-owned.
This is browser request context only; server optional dispatch enforcement belongs
to PRO-4276. No requests or account actions are created by this adapter.

Custom HockeyStack, Reo, HubSpot tracking, LinkedIn and cross-domain PostHog
configuration were removed. Native ungated GA4 was removed. GTM-MWQNDPQ2 and
unverified optional integrations remain disabled even after Accept All. Requested
subscription delivery and the existing disabled voice-widget flag are preserved.

`privacy-search.js` runs before the other local scripts and keeps Algolia optional
analytics off for everyone, including after Accept All/regrant. Necessary search
continues: the audited `P6VYURBGG0` search/retry hosts receive `analytics:false` and
`clickAnalytics:false`, without `userToken`, `authenticatedUserToken`, or
`analyticsTags` in URL, JSON query objects, or encoded query parameters. Query,
filter, ranking, language, authorization, and scoped API keys are retained.
Unknown bodies on these search endpoints fail locally instead of forwarding an
unverified encoding. Insights `/1/events` on `insights.algolia.io` and its audited
`us`/`de` regional hosts settles locally across beacon, fetch and XHR; beacon reports
success to prevent the SDK's fallback send. Existing and future `algolia-user-token`,
`AlgoliaObjectQueryCache` storage and `_ALGOLIA` cookies are suppressed. Necessary
`algolia-client-js-*` host availability storage is preserved. The exact same-origin
`/api/fern-docs/search/v2/key` request omits `X-User-Token`; authentication is preserved.
The adapter does not decode or modify signed scoped keys. Anonymous observed keys
had no embedded identity restriction; authenticated fallback restrictions still
require hosted verification and cannot be removed by changing signed credentials.

This is a scoped compatibility adapter for Fern's audited Algolia lite 5.49.1 /
Insights transport and Storage-method/cookie contracts, not a generic browser
privacy layer. On every Fern upgrade verify the generated bundle's app ID, retry
hosts, endpoints, payload encodings, cookie/storage access, early script order,
SDK completion/fallback behavior and real search results/click navigation. Do not
enable other search analytics transports without this audit.

## Validation

Use Node 22 with the SHA-verified Fern installation from the repository setup:

```sh
npm ci --ignore-scripts
npx playwright install chromium
npm run test:privacy
node fern/custom.spec.js
npm run test:privacy:browser
```

The browser command starts a local Fern docs preview on ports 3212/3213 using
`FERN_CLI_PATH`; no hosted preview or publication is created. Optionally use
`DOCS_CONSENT_URL=http://localhost:3212` with an existing local preview. Browser
coverage includes denied/unresolved storage and request initiation, late/initial
acceptance, withdrawal/reload, delayed SDK import, GPC, API headers, navigation,
search dialog availability, and a requested subscription against an exactly
intercepted endpoint. API-header tests use exactly intercepted synthetic paths;
they never exercise a call, payment, or account change. Local preview omits API
reference generation (`--skip-api`); full playground/auth/credential behavior and
search backend results require release preview verification.

Osano decisions and collection responses are fixtures; actual generated Fern
HTML, consent runtime, bundled SDK and custom scripts run in Chromium. All request
initiations and failures are recorded, including fulfilled requests. Optional
request checks classify vendor hosts and the Fern analytics proxy; they do not
abort trackers. Synthetic collection/config responses and remote extension scripts (empty JS)
are narrowly fulfilled to avoid sending test telemetry to a live analytics project. Subscription and API service
responses are also local fixtures. These tests prove local runtime enforcement,
not live Osano regional configuration, provider classification, or hosted release
behavior; live session-recorder extension behavior is not certified. CI stores request evidence for seven days. Local artifacts stay in the
temporary directory.

## Release and safe disablement

1. Before publication, preserve the existing hosted request/storage baseline and
   the published Osano version, regional rules, classifications, and Strict-mode
   snapshot. Coordinate disabling Osano's automatic Google-consent bridge so this
   adapter is the sole Google-consent writer; this repository change does not
   publish Osano settings. No GTM or other disabled tracker may be re-enabled.
2. Validate a hosted preview with the actual published CMP in applicable opt-in
   and opt-out regions, saved choices, category combinations, GPC, withdrawal,
   regrant/reload, SPA routing, search results and API playground. Confirm necessary
   framework/CDN code is allowed by Osano without broad Essential vendor exemptions.
   Observe request initiation, failed requests and storage with positive controls;
   do not use blanket tracker aborts. Do not submit real forms/calls/payments or
   persist production account opt-outs during validation.
3. Release only after hosted/provider checks pass and owners approve the separate
   publication. Confirm the served native consent meta, script/config propagation,
   absent GA4/GTM/unverified loaders, and withdrawal behavior after caches update.
   Current local evidence does not complete hosted/provider acceptance.
4. If analytics enforcement fails, publish a protective docs configuration that
   removes the `analytics.posthog` block and changes the bridge's `allowFern` to
   unconditional `false`, retaining `require-analytics-consent: true`, Osano, both
   consent adapters and necessary functionality. If the generated runtime still
   includes internal analytics, verify it stays denied before that publication.
   Never revert to an old ungated build or restore removed trackers. Validate the
   served artifact and cache propagation; a deployment cannot remotely stop scripts
   in tabs already running an old release. Do not add telemetry to measure denials.
