# Vapi Workflows → Squads Migration Guide

A self-contained reference for migrating a Vapi **Workflow** to a **Squad** before Workflows is retired on **August 18, 2026**.

**How to use this file:** Attach it to an AI coding assistant (Claude Code, Composer, Cursor, or any LLM) as context, along with your existing workflow's configuration (the workflow JSON, or a description of its nodes and edges). Ask the assistant to draft the equivalent Squad. The mapping table, steps, and rules below give the model everything it needs to produce a correct, focused Squad without re-reading the docs site.

**Deadline:** Workflows stop running on **August 18, 2026**. From **August 19, 2026** onward, existing workflows will no longer run. Migrate before then to avoid disruption.

**Canonical web version:** https://docs.vapi.ai/workflows/legacy-migration

---

## Table of contents

1. [What's changing](#1-whats-changing)
2. [Mental model](#2-mental-model)
3. [Concept mapping (Workflows → Squads)](#3-concept-mapping-workflows--squads)
4. [Rules an agent should follow](#4-rules-an-agent-should-follow)
5. [Migration steps](#5-migration-steps)
6. [Squad configuration reference](#6-squad-configuration-reference)
7. [Variable extraction](#7-variable-extraction)
8. [Validation checklist](#8-validation-checklist)
9. [FAQs](#9-faqs)
10. [Resources](#10-resources)

---

## 1. What's changing

- Workflows will be retired by **August 18, 2026**. From **August 19, 2026** onward, existing workflows will no longer run.
- Workflows are no longer recommended for new builds. Use **Assistants** for most cases, or **Squads** for multi-assistant setups.
- **Squads** is the recommended replacement for Workflows.
- If you are no longer using Workflows, no action is required.

**Why the change:** current AI systems aren't reliable as fully autonomous graph-walking agents — they struggle to simultaneously hold the current node's instructions and reason about every possible next step and its trigger conditions. The Squads pattern (specialized assistants that hand off to each other) has consistently produced better results.

---

## 2. Mental model

Instead of a visual graph of nodes and edges, a Squad is a set of specialized **assistants** that **hand off** to each other during one continuous conversation. Each assistant owns one focused part of the conversation, with clear handoff conditions in between. Conversation context is preserved across handoffs.

---

## 3. Concept mapping (Workflows → Squads)

| Workflows | Squads |
| --- | --- |
| Conversation Node | Squad member (assistant with its own prompt, voice, model, and tools) |
| Edge condition | Handoff tool with a description of when to transfer |
| Global Node | Assistant with a broad handoff condition (e.g. "user wants to speak to a human" or "user says hotword") |
| Extract Variables | Variable extraction in the Handoff tool, passed across the full Squad |
| API Request Node | Custom or API Request tool attached to a Squad member |
| Transfer Call Node | Transfer call tool attached to a Squad member |
| Start Node | First member in the Squad `members` array |

---

## 4. Rules an agent should follow

These are the most important judgment rules — apply them before generating any Squad:

1. **Do NOT do a 1:1 node-to-assistant mapping.** Workflows often have dozens of nodes (e.g. IVR menus). A 1:1 migration creates too many assistants and is hard to maintain.
2. **Bundle as much as possible into a single assistant.** Squads work best for **linear, unidirectional** flows. Start with one assistant and only split when there is a clear functional boundary.
3. **Avoid cyclical handoffs.** If two stages would hand off back and forth repeatedly within one conversation, consolidate them into a single assistant. Frequent cyclical handoffs add latency and can introduce hallucinations.
   - Good fit for separate assistants: a predictable one-directional path like `triage → voicemail → SDR`.
   - Bad fit (consolidate instead): a pair like `SDR ↔ FAQ` that would bounce back and forth many times in a single call.
4. **Keep each assistant focused.** One clear responsibility, a short prompt, 1–3 goals maximum. Attach only the tools that stage needs.
5. **One handoff tool per transition.** Replace each edge with a handoff tool on the source assistant, with a plain-language description of when to hand off.
6. **The first member is the entry point** (equivalent to the Start Node).

---

## 5. Migration steps

### Step 1 — Map the existing workflow

Document what the workflow does before building anything:

- List each node and its purpose.
- Note the condition on each edge.
- Identify every extracted variable and where it's used downstream.
- Note any API calls or transfers to phone numbers.

### Step 2 — Decide on assistants (consolidate aggressively)

Apply the rules in section 4. Group related nodes into a small number of well-defined **stages** (e.g. `intake → triage → scheduling → human handoff`), then create **one assistant per stage**. Bundle stages that would hand off cyclically into one assistant.

For each assistant: give it a clear responsibility, a focused prompt (1–3 goals), and only the tools it needs (API requests, transfers, etc.).

Stage-based example: https://docs.vapi.ai/squads/examples/clinic-triage-scheduling-handoff-tool

### Step 3 — Add handoff tools (replace edges)

For each transition between stages, add a [Handoff tool](https://docs.vapi.ai/squads/handoff) on the source assistant:

- Set the destination to the next assistant (or a phone number for transfers).
- Write a clear description of **when** to hand off — this replaces the edge condition.
- For AI-based conditions (e.g. "user wants to talk about pricing"), describe the condition in plain language.
- For logical conditions (e.g. `{{ customer_tier == "VIP" }}`), extract the value first (see Step 4), then reference it in the handoff tool description.

### Step 4 — Handle variable extraction

Configure variable extraction in each handoff so key data passes to the next assistant. Variables extracted mid-conversation are available across the full Squad. See section 7 for the important caveats.

### Step 5 — Assemble the Squad

- The first member in the `members` array is the entry point.
- Use `memberOverrides` to standardize settings across **all** members (e.g. the same voice throughout). To override a **single** member, use `assistantOverrides` on that member.

See section 6 for config.

### Step 6 — Test

Use the built-in calling feature to test all conversation paths before going live. Check:

- Handoff conditions trigger at the right time.
- Variables pass correctly between assistants.
- Edge cases: confused users, unexpected inputs, human-escalation paths.

---

## 6. Squad configuration reference

Minimal Squad with a squad-wide voice override (`memberOverrides`):

```json
{
  "squad": {
    "members": [
      { "assistantId": "your-first-assistant-id" },
      { "assistantId": "your-second-assistant-id" }
    ],
    "memberOverrides": {
      "voice": {
        "provider": "vapi",
        "version": 2,
        "voiceId": "Elliot"
      }
    }
  }
}
```

- `members` — ordered array; index 0 is the entry point (Start Node equivalent). Each member is either `{ "assistantId": "..." }` (saved assistant) or `{ "assistant": { ... } }` (transient, inline assistant).
- `memberOverrides` — overrides applied to **all** members without modifying the underlying assistants. Use for squad-wide settings like voice.
- `assistantOverrides` — set **on an individual member** to override just that one assistant.

Using Workflows via API? Replace `workflowId` with `squadId` in your call configuration. Squads API reference: https://docs.vapi.ai/api-reference/squads/create

---

## 7. Variable extraction

Configure variable extraction in each [Handoff tool](https://docs.vapi.ai/squads/handoff#variable-extraction) to pass data to the next assistant.

**How it differs from Workflows:** Squads extract variables with an LLM at handoff time (a schema-driven extraction against the conversation transcript), then pass them to the next assistant. This is **best-effort, not deterministic**:

- If a value isn't clearly present in the conversation, or a transient model error occurs, extraction can return empty — and the handoff still proceeds.
- Define clear extraction schemas, and **test that business-critical variables are reliably captured** before depending on them downstream.
- For strictly deterministic values, capture them via a tool or API response rather than relying on transcript extraction.

Control what conversation context carries across a handoff with context engineering: https://docs.vapi.ai/squads/handoff#context-engineering

---

## 8. Validation checklist

Before going live, verify:

- [ ] Each Conversation Node's logic is captured (stages consolidated where appropriate).
- [ ] Assistants are kept to the minimum needed; no cyclical handoff pairs remain split.
- [ ] Every handoff condition triggers at the right time.
- [ ] Variable extraction passes the right data between assistants.
- [ ] Tools, API requests, and transfers are attached to the correct assistant.
- [ ] Business-critical variables are reliably extracted (tested, not assumed).
- [ ] Test calls cover **all** conversation paths, including edge cases.
- [ ] API integrations send `squadId` instead of `workflowId`.

---

## 9. FAQs

**Why is Workflows being retired?** Squads consistently produces better results for customers. Rather than maintaining two parallel products, Vapi is going all-in on Squads.

**Will my workflows stop working immediately on the deprecation date?** Yes. After August 18, 2026, existing workflows will no longer run. Complete your migration before then.

**Do I need to rebuild everything from scratch?** No — the concepts map closely. Each Conversation Node becomes a Squad member and each edge becomes a Handoff tool. The main work is rewriting prompts to be more focused and configuring handoff tools with clear transfer conditions.

**What if I need deterministic routing?** For strict logical conditions (e.g. `{{ customer_tier == "VIP" }}`), extract the relevant variable first and reference it in the handoff tool description. For edge cases, contact support@vapi.ai.

**What happens to my workflow data?** Historical call data remains accessible in your call logs. Workflows-specific post-call data (nodes traversed, extracted variables from Workflow runs) remains viewable for existing calls.

**I'm using Workflows via API — do I need to change my integration?** Yes. Switch from passing `workflowId` to passing `squadId`. See https://docs.vapi.ai/api-reference/squads/create

**Can I get help migrating?** Contact support@vapi.ai. High-volume users can arrange a walkthrough. Vapi also added a **Composer skill** that auto-drafts a Squad from your existing workflow — open Composer in your dashboard and ask "help me migrate my workflows to squads." It's a best-effort starting point; always review and test before going live.

---

## 10. Resources

- Migration guide (web): https://docs.vapi.ai/workflows/legacy-migration
- Squads overview: https://docs.vapi.ai/squads
- Squads quickstart: https://docs.vapi.ai/squads-example
- Handoff tool: https://docs.vapi.ai/squads/handoff
- Variable extraction: https://docs.vapi.ai/squads/handoff#variable-extraction
- Context engineering: https://docs.vapi.ai/squads/handoff#context-engineering
- Squads API reference: https://docs.vapi.ai/api-reference/squads/create
- Clinic triage & scheduling example: https://docs.vapi.ai/squads/examples/clinic-triage-scheduling-handoff-tool
