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

## Deliverables (fern/observability/)
- simulations-overview-stub.mdx — Conceptual/Explainer. WRITTEN (Lead, Key concepts, How it works, Simulations vs Evals, Related). 1 PENDING: run/live-monitoring wording.
- simulations-quickstart-stub.mdx — Quickstart. CONTENT-COMPLETE end-to-end. Populated results confirmed from a PASSING chat run: Evaluations show "<name> — Passed. Expected = true and got true." (boolean); Transcript is turn-by-turn tester/assistant. Concrete eval example added (appointment_booked = true). Example names cleaned (test artifacts were "Steve Test"/"My Test"). Remaining for V&V: voice-run recording playback (chat run has none); screenshots; un-stub/frontmatter polish at launch.
- simulations-advanced-stub.mdx — Feature Guide. FIRST DRAFT written: How it works, Mock tool responses, Send webhooks on run start/end (voice-only), Reuse structured outputs, Add variables, Testing strategies, Run in CI/CD, Related.
  - TOOL MOCKS confirmed (Stephen): dropdown = target assistant's tools; Enabled toggle; mock returns a RESULT STRING to the assistant; REAL TOOLS NEVER EXECUTE (can't test real tool behavior in a sim). ⚠ This CORRECTS the current LIVE advanced page, which claims you can mock error responses/timeouts/partial success — not accurate; a mock is just a string. Fix at rewrite.
  - VARIABLES confirmed from code: draft.variables -> scenario.targetOverrides.variableValues = the TARGET assistant's dynamic-variable values for the run (fill {{placeholders}} in the target's prompt). Applies to target, not tester. Docs now link /assistants/dynamic-variables.
  - WEBHOOK PAYLOAD confirmed from code (libs/core/src/types/message.types.ts: SimulationRunStartedMessage / SimulationRunEndedMessage, base OutboundMessageBase). Fields: type, simulationId, runId?, simulationRunItemId, iterationNumber, isSimulation:true, calls{testerCallId?,targetCallId?,listenUrl?}, timestamp?, call?. Ended adds: endedReason?, canceled?, failureReason?, startedAt?, endedAt?, transcript?, messages?, recordingUrl?. ⚠ CORRECTS live doc (uses `type` not `event`; not just timestamp). calls.listenUrl = live-listen WSS (ties to live-listening gap).
  - Still PENDING: exact tool-mock result-input field label/format; enumerate endedReason values; CI/CD (API). May SPLIT into how-tos later.
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
