<!--
INTERNAL PLANNING DOC — NOT DOCS CONTENT. Lives at repo root, outside fern/, so Fern never builds it.
Remove this file before merging the Simulations GA docs to main.
-->

# Simulations Docs — Gap Tracker & Plan

## Repos / access
- DOCS: this repo (VapiDocs1, Fern). Branch: **docs/simulations-ga-stubs**.
- CODE: /Users/stephen-vapi/Vapi/vapi — SimulationsV2 on branch codex/pal-198-sims-ga-e2e.
- Browser tool (Claude-in-Chrome) is under a STRICT ADMIN ALLOWLIST: only pre-approved domains work. staging-dashboard.vapi.ai, dashboard.vapi.ai, dashboard-pr-15471, and bbc.com ALL blocked; old dashboard-pr-15224 was allowed but its env is torn down. → screenshots fed manually. Durable fix = admin allowlist *.preview.vapi-internal.com + *.vapi.ai.
- Style guide: Linear "Vapi Documentation Style Guide" (slug 6fbfcc3ed2e2).
- TEMPLATES: Linear project "Writing templates" (Steve Smith). Use these, NOT .cursor/rules/*.mdc (being updated/removed).
- MESSAGING SOURCE (value / "what it's good for" / use cases): Google Doc "Tier 2 Messaging Doc: Simulations" — https://docs.google.com/document/d/1VSvY7vPXu9lY8S3bwOMMT2JOKtwuLB_WgvMYitHBSQY/edit . Use for factual use cases (pre-launch validation, regression, guardrail, tool-call) + Evals distinction. DO NOT copy marketing taglines. SKIP "promote to production monitor" and "automated test recommendations" — not confirmed shipping. COST NOTE removed (Stephen); pricing-page LINKS deferred to later (don't state pricing in prose). Added "When to use Simulations" section to overview from these use cases.

## Deliverables (fern/observability/)
- simulations-overview-stub.mdx — Conceptual/Explainer. WRITTEN (Lead, Key concepts, How it works, Simulations vs Evals, Related). 1 PENDING: run/live-monitoring wording.
- simulations-quickstart-stub.mdx — Quickstart. CONTENT-COMPLETE end-to-end. Populated results confirmed from a PASSING chat run: Evaluations show "<name> — Passed. Expected = true and got true." (boolean); Transcript is turn-by-turn tester/assistant. Concrete eval example added (appointment_booked = true). Example names cleaned (test artifacts were "Steve Test"/"My Test"). Remaining for V&V: voice-run recording playback (chat run has none); screenshots; un-stub/frontmatter polish at launch.
- simulations-advanced-stub.mdx — Feature Guide. FIRST DRAFT written: How it works, Mock tool responses, Send webhooks on run start/end (voice-only), Reuse structured outputs, Add variables, Testing strategies, Run in CI/CD, Related.
  - TOOL MOCKS confirmed (Stephen): dropdown = target assistant's tools; Enabled toggle; mock returns a RESULT STRING to the assistant; REAL TOOLS NEVER EXECUTE (can't test real tool behavior in a sim). ⚠ This CORRECTS the current LIVE advanced page, which claims you can mock error responses/timeouts/partial success — not accurate; a mock is just a string. Fix at rewrite.
  - VARIABLES confirmed from code: draft.variables -> scenario.targetOverrides.variableValues = the TARGET assistant's dynamic-variable values for the run (fill {{placeholders}} in the target's prompt). Applies to target, not tester. Docs now link /assistants/dynamic-variables.
  - WEBHOOK PAYLOAD confirmed from code (libs/core/src/types/message.types.ts: SimulationRunStartedMessage / SimulationRunEndedMessage, base OutboundMessageBase). Fields: type, simulationId, runId?, simulationRunItemId, iterationNumber, isSimulation:true, calls{testerCallId?,targetCallId?,listenUrl?}, timestamp?, call?. Ended adds: endedReason?, canceled?, failureReason?, startedAt?, endedAt?, transcript?, messages?, recordingUrl?. ⚠ CORRECTS live doc (uses `type` not `event`; not just timestamp). calls.listenUrl = live-listen WSS (ties to live-listening gap).
  - TOOL-MOCK fields confirmed from code (ConfigureToolsPanel.tsx + CreateWizardToolMock {toolName, result:string, enabled}): Tool (select from target's tools), Mock result (string textarea, placeholder "Mock result string returned to the assistant"), Enabled (toggle). Result is plain text (JSON allowed but passed as string).
  - endedReason: LINKED to canonical /calls/call-ended-reason (not enumerated).
  - Added "Configure the tester" section: tester model/transcriber/voice (Personality tab → Advanced settings). Transcriber+voice = voice sims only; chat uses model only. Warning: personality is SHARED — changing model/transcriber/voice/behavior updates EVERY simulation using it; applies to future runs, not completed ones (propagation verified in code: wizardPersistenceExecute.ts updatePersonality).
  - Still PENDING: CI/CD section (Stephen getting API shapes access); confirm chat mode ignores transcriber/voice (inferred). May SPLIT into how-tos later.

PERSONALITY FORK-VS-MUTATE (verified in code, EXPECTED not a bug):
- "(Default)" label = personality.orgId === null (built-in/system presets: Skeptical Sam, Impatient Irene, Rambling Roger, Emotional Eva, Multitasking Maya, Decisive Derek, Confused Carl). PersonalitySelector.tsx:46.
- Editing a DEFAULT (orgId null) -> createPersonality = forks a NEW org-owned copy (drops "(Default)"). Does NOT change the default or other sims using it. (wizardPersistenceExecute.ts:44)
- CODE said: editing YOUR OWN personality (orgId set) -> updatePersonality (mutate in place). BUT ⚠ EMPIRICALLY (Stephen, screenshots) editing DEFAULTS spawns MULTIPLE owned copies over time (e.g. two "Multitasking Maya" + a "Rambling Roger", all non-default, same inherited names). So "forks once then updates" is WRONG in practice.
- NAME cannot be changed: PersonalitySelector is a Select (no text input); PersonalityPanel has no name field; wizardPayloadBuild uses originalPersonality.name (inherited). No personalities-management page (nav = Suites + Runs only). => duplicates share names, indistinguishable.
- DOC STANCE: pulled back to only the certain fact — "editing a (Default) saves a new personality you own; the default is unchanged." Removed all cross-simulation propagation + fork-once claims from quickstart Note + advanced (Warning->Note). Revisit once behavior confirmed.
- FLAGGED to team as possible bug (duplicate spawning + no rename). See spawn_task.
Also added: "Add more" = multiple simulations per suite (quickstart Step 2 note); Scenario name + Intent are REQUIRED (quickstart Step 2).

API (local extended spec at http://localhost:3001/api-extended-json; public at /api-json):
- Sim API (/eval/simulation/*) = EXTENDED-ONLY (not public). Public shows only /eval, /eval/run, /eval/run/{id}, /eval/{id} — byte-identical to extended (no drift). Legacy /test-suite/* also extended-only.
- Existing docs cURL VERIFIED accurate vs extended: personality{name,assistant}; scenario{name,instructions,evaluations[{structuredOutput|structuredOutputId,comparator,value,required}]}; simulation{scenarioId,personalityId}; suite{name,simulationIds}; run{simulations[{type:simulation+simulationId | simulationSuite+simulationSuiteId}],target{assistant+assistantId|squad+squadId},transport{provider:vapi.websocket|vapi.webchat},iterations}. comparator enum: = != > < >= <=. Run response: status(queued|running|ended), itemCounts{total,passed,failed,running,queued,canceled}.
- HOW #3 WORKS: fern/apis/api/generators.yml origin=https://api.vapi.ai/api-json -> docs openapi.json auto-synced via `fern api update`. Sim endpoints appear ONLY after backend makes them public; then overlay (openapi-overrides.yml, schema+property descriptions) attaches. Overlay for sim DTOs is inert/error until then. => draft overlay wording now, apply on sync.
- #2 quickstart: Dashboard + cURL now in a <Tabs> block ("## Build and run a simulation") — Dashboard tab = suite-first <Steps>; cURL tab = bottom-up sequence. Keeps page short (one tab shown at a time) + sidesteps the ordering mismatch. Tags balanced (1 Tabs / 2 Tab / 1 Steps).
- #2 quickstart: cURL steps now note RETURN DATA / id-chaining (step1 personality id -> personalityId; step2 scenario id -> scenarioId; step3 simulation id -> simulationId; step4 run id -> step5 poll).
- #2 advanced: 3 sections now Dashboard/cURL <Tabs> (Mock tool responses, Send webhooks, Reuse structured outputs); shared warnings + webhook payloads kept outside tabs. Tags balanced (3 Tabs/6 Tab).
- #2 advanced (orig): cURL added to Mock tool responses (PATCH scenario toolMocks[{toolName,result,enabled}]), Send webhooks (PATCH scenario hooks[{on,do:[{type:webhook,server:{url},include}]}]), Reuse structured outputs (PATCH scenario evaluations[{structuredOutputId,comparator,value,required}]). All shapes verified vs extended spec; PATCH scenario = UpdateScenarioDTO (all fields optional).
- Advanced CI/CD section: now UNBLOCKED (run POST + GET poll shapes verified: status, itemCounts.passed/failed). Not yet written.
- Overlay wording: ADDED sim DTO param descriptions to fern/apis/api/openapi-overrides.yml (CreatePersonalityDTO, CreateScenarioDTO, EvaluationPlanItem, ScenarioToolMock, CreateSimulationDTO, CreateSimulationSuiteDTO). YAML validated (parses; CreateAssistantDTO intact). Stephen testing whether the build tolerates overrides for schemas not yet in openapi.json (the real risk). If build breaks -> revert this block; fallback copy in SIMULATIONS-API-OVERLAY-DRAFT.yml (repo root, staging). Resolved: EvaluationPlanItem.required default=true; value=number|string|boolean; `path` OMITTED (nullable object, unclear). slackWebhookUrl/targetAssignments stated (light [verify]). Descriptions render only after endpoints sync into openapi.json.
- BUILD TEST PASSED (Stephen, 2026-07-28): Fern tolerates overlay overrides for schemas NOT yet in openapi.json — no errors. So the overlay approach works; staging file SIMULATIONS-API-OVERLAY-DRAFT.yml now redundant (keep as record or delete).
- OVERLAY EXPANDED (2026-07-28): added OPERATION descriptions for all sim endpoints (14 paths / ~30 ops; skipped /scenario/generate which already had one) via paths.<p>.<m>.description. Added RESPONSE-SCHEMA descriptions: SimulationRun (status/endedReason/itemCounts/simulations/target/iterations/transport), SimulationRunItemCounts (total/passed/failed/running/queued/canceled), SimulationRunItem (status/results/improvementSuggestions/callId/failureReason/iterationNumber/scenarioId/personalityId). YAML validated (parses; /call + CreateAssistantDTO intact).
  - ⚠ NEEDS BUILD RE-TEST: schema partials built clean before, but adding PARTIAL PATHS (description only, no responses) for endpoints not in base openapi.json is UNTESTED — may generate phantom/empty API-reference nav entries or warnings. If so, move operation descriptions to staging until endpoints sync.
  - RUN-ITEM PARAMS (id,itemId,simulationId,runId,status,force): NOT added. Fern docs don't define param-array merge for `overrides`; they RECOMMEND OpenAPI OVERLAYS (JSONPath-targeted `update` actions) for description-only edits that preserve required/type. But targeting needs the param to already exist in openapi.json — sim endpoints aren't synced yet. We never need to override required/type (comes from source); only descriptions missing. PLAN: once endpoints sync, add param descriptions via targeted overlay action (e.g. target $.paths[...].get.parameters[?(@.name=='status')] update.description) or at source. Can pre-draft actions in staging file if wanted. Pending.
- Quickstart cURL step intros rewritten: bold label + 1-3 sentence paragraph (was "— terse phrase"); dropped stray "caller" usages.

## PUBLISH PROCESS — adding the sim API to the reference once the backend exposes the endpoints
Trigger: backend publishes /eval/simulation/* into the PUBLIC api.vapi.ai/api-json (removes the audience/internal gating).
1. SYNC: in the docs repo run `fern api update` — pulls the updated public api-json into fern/apis/api/openapi.json. Sim endpoints + request/response schemas + params (type/required from source) now exist in the base spec.
2. AUTO-ATTACH: the descriptions already in openapi-overrides.yml (operation descriptions for all sim endpoints; DTO property descriptions; SimulationRun/ItemCounts/RunItem response-schema descriptions) merge by key onto the now-present endpoints/schemas. Nothing to re-add.
3. PARAMS: wire SIMULATIONS-API-PARAM-OVERLAY.yml in (move to fern/apis/api/sim-param-overlay.yml, add `overlays: [./sim-param-overlay.yml]` under the spec in generators.yml). JSONPath actions set only the run-item param descriptions, preserving type/required. [VERIFY force wording]
4. CLEAN UP: remove "(staged)" comments from openapi-overrides.yml; delete SIMULATIONS-API-OVERLAY-DRAFT.yml and SIMULATIONS-API-PARAM-OVERLAY.yml (once merged in).
5. VERIFY: `fern generate --docs --preview` (or local `fern docs dev`) — confirm sim endpoints render with all descriptions; run `fern check`.
6. UN-STUB GUIDES: finalize the 3 stubs (drop DRAFT markers/frontmatter, verify cURL vs production, fold into the real simulations-*.mdx pages, remove the temp "DRAFT stubs" nav in docs.yml).
7. Revisit pending decisions if resolved: tester/caller term, eval-plan rename.
Note: SDK generation also flows from openapi.json+overrides (generators.yml drives python/ts/go/etc.), so the sim API lands in the SDKs automatically on sync too.

PRINCIPLE (Stephen): LINK to the canonical reference page wherever possible instead of duplicating/enumerating (style-guide aligned). Applied: endedReason->call-ended-reason, variables->dynamic-variables, structured outputs->assistants/structured-outputs(-quickstart) across all 3 sim pages (inline links + wayfinding cards). Keep applying.
Structured-output canonical pages: /assistants/structured-outputs (concept), /assistants/structured-outputs-quickstart (how-to), /assistants/structured-outputs-examples.
- Quickstart prereq added: structured output required (can create during setup).
- Eval-plan RENAME: back burner — awaiting engineering decision. Keep current UI wording ("Evaluation plan") in docs meanwhile. Candidates parked: Success criteria / Assertions / Checks.
- docs.yml: temp nav "Simulations (DRAFT stubs)" under Observability. Remove before publish.

## Confirmed GA flow (PR 15471 screens)
Suite (name + targets assistant/squad) → Simulation [Scenario: name+Intent | Personality: preset/Behavior/Who-starts-first Tester|Target/Advanced Model+Transcriber+Voice] → Next → review [Evaluation plan (structured output + comparator; >=1 REQUIRED to run) | Variables (Name/Value) | Tool mocks & webhooks (mock tool outputs; Simulation start/end toggles, VOICE ONLY)] → Save & run [Mode Chat/Voice, Iterations 1/3/5/10] → Runs list (status queued->running->ended; filters; Re-run).
- Suite-first; Simulations sub-nav = only Suites + Runs.
- Confirms advanced stale-nav fix: hooks/tool mocks on the review step, NOT "Scenarios -> Hooks".
- EDIT-TO-MODIFY: a suite opens in VIEW mode; select **Edit** (top right) to make any changes. Added to quickstart Step 1.
- Runs not succeeding as of 2026-07-28 (Stephen) — likely beta/env, not a docs issue. A FAILED run still shows the run-detail view, so its screenshot is still useful (documents results view + the failed-run case).

## Key decisions (Stephen)
- Testing node (test/test-suites, chat-testing, voice-testing) = deprecated predecessor; DROP at launch. Dangling-content pass + 3 redirects in docs.yml (~line 888). NO migration guide.
- Evals NOT deprecated; coexists. Framing: Evals = test your framework/logic (scripted mock conversations, chat). Simulations = test real interaction (dynamic AI tester, voice+chat, structured-output eval). Overview vs-Evals section written & approved.
- cURL/API tabs in live docs: assume correct for now; verify when API exposed (only GET /eval public today).
- Composer = OUT OF SCOPE (AI setup agent).
- Simulations stays under Observability for now.
- server-url/events.mdx: NO change needed (sim events are hooks with {event:...} envelope, not server-message types).
- Ignore cursor rules for now.
- V&V pass planned closer to launch.

## Doc-set (style guide §3.2)
Overview (Conceptual) + Quickstart (Tutorial) + Advanced (Feature Guide, maybe split). Teardown/delete-suite coverage (§3.6) still to add.

## Dependency-doc gaps (outside the 3 sim pages)
- Live call listening / run monitoring — undocumented.
- Structured outputs AS simulation eval criteria — existing pages assistant-centric only.
- Dangling "test suite" prose: debugging.mdx (+video), info-hierarchy.mdx, calls/call-ended-reason.mdx, calls/troubleshoot-call-errors.mdx, assistants/examples/docs-agent.mdx. Changelogs = leave. Orphan media: create-test-suite.mp4, run-test-suite.mp4.

## Open items / next
- PENDING content: overview run-monitoring wording; quickstart run drill-in (needs a completed run's detail screen).
- Advanced page: rewrite from skeleton (fix stale nav; tool mocks + webhooks on review step).
- Get browser allowlisted OR keep getting screenshots.
- Set up a MINIMUM end-to-end sim run to capture results screens.
