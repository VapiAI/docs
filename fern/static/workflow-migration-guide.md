# Task: migrate a Vapi Workflow to a Squad

You are migrating a Vapi **Workflow** (a graph of nodes and edges) into a **Squad** (a set of specialized assistants that hand off to each other). This file is the complete spec: input schema, output schema, the transform procedure, and a worked example. Produce a valid Squad config and the assistant configs it references.

> **Why this migration is needed:** Vapi Workflows are retired on **August 18, 2026**. From **August 19, 2026** onward, existing workflows stop running. Squads are the replacement.

**How a human should use this file:** paste it into your AI coding assistant (Claude Code, Cursor, Composer, or any LLM) together with your workflow's JSON (`GET https://api.vapi.ai/workflow/{id}`), and ask it to produce the equivalent Squad. The assistant has everything it needs below.

---

## Inputs you will be given

A Workflow object. Relevant shape:

```jsonc
{
  "name": "string",
  "nodes": [
    {
      "id": "string",
      "type": "conversation | gather | apiRequest | transferCall | endCall | hangup",
      "firstMessage": "string?",        // spoken on entering the node
      "systemPrompt": "string?",        // node instructions (may contain {{variables}})
      "extractVariables": [             // variables captured at this node
        { "name": "string", "type": "string | number | boolean", "description": "string" }
      ],
      "isGlobal": "boolean?",           // global node: reachable from anywhere
      "condition": "string?",           // entry condition for a global node
      "destination": "string?",         // transferCall: phone number
      "transferPlan": { "message": "string" }  // transferCall only
    }
  ],
  "edges": [
    { "from": "nodeId", "to": "nodeId", "condition": "string?" }  // no condition = automatic
  ]
}
```

## Output you must produce

A Squad plus the assistants it references. Squad shape:

```jsonc
{
  "squad": {
    "members": [
      { "assistantId": "string" },              // a saved assistant, OR
      { "assistant": { /* transient assistant */ } }  // an inline assistant
    ],
    "memberOverrides": { /* settings applied to ALL members, e.g. shared voice */ }
  }
}
```

- **The first member is the entry point** (equivalent to the workflow's Start Node).
- `memberOverrides` overrides **all** members (use for squad-wide settings like one voice). To override a **single** member, put `assistantOverrides` on that member.

Assistant shape (each member). The node's `systemPrompt` becomes `model.messages[0].content`; handoff tools live in `model.tools`:

```jsonc
{
  "name": "string",
  "firstMessage": "string?",
  "model": {
    "provider": "openai",
    "model": "gpt-4o",
    "messages": [ { "role": "system", "content": "the assistant's instructions" } ],
    "tools": [ /* handoff tools, transferCall tools, apiRequest/custom tools */ ]
  }
}
```

Handoff tool shape (this is how an edge is represented):

```jsonc
{
  "type": "handoff",
  "destinations": [
    {
      "type": "assistant",
      "assistantName": "string",        // or "assistantId"
      "description": "when to hand off here — this is the edge condition, in plain language",
      "contextEngineeringPlan": { "type": "all" },   // or lastNMessages + maxMessages, etc.
      "variableExtractionPlan": {        // only if data must cross to the next assistant
        "schema": { "type": "object", "properties": { /* ... */ }, "required": [ /* ... */ ] }
      }
    }
  ]
}
```

---

## Transform procedure

Run these in order.

1. **Parse the graph.** Build the node list, the adjacency from `edges`, and note every `extractVariables` and where each variable is referenced (`{{name}}`) downstream.

2. **Group nodes into stages, then collapse stages into assistants — minimize the count.** Do **not** map one node to one assistant. Walk each linear (non-branching, one-directional) chain of `conversation`/`gather` nodes and merge it into a **single** assistant whose system prompt covers the whole chain's behavior in order. A 6-node linear workflow is usually 1 assistant, not 6.

3. **Split only at real boundaries.** Create a separate assistant only where there is a clear functional boundary (different job, different tools) **and** the conversation flows one way into it. If two stages would hand off back and forth repeatedly within one call, **keep them in one assistant** — cyclical handoffs add latency and cause hallucinations.
   - Good split (one-directional): `triage → voicemail → SDR`.
   - Bad split (consolidate): `SDR ↔ FAQ` that bounces back and forth.

4. **Turn each retained edge into a handoff tool** on the source assistant. The edge's `condition` becomes the destination's `description` (plain language). An edge with no condition = automatic progression; if it crosses an assistant boundary, still make a handoff with a description like "after collecting X". Multiple outgoing edges from one node → one handoff tool with multiple `destinations`.

5. **Map `extractVariables`:**
   - If the variable is only used **within the same assistant**, you do **not** need a `variableExtractionPlan` — it's already in that assistant's context. Just reference `{{name}}` in the prompt.
   - If the variable is referenced in a **different** assistant, add a `variableExtractionPlan.schema` to the handoff destination(s) that cross that boundary, so the value is passed across. Access it downstream as `{{name}}`.
   - A variable used only to *choose a branch* doesn't need extraction — that decision is encoded in which destination the model picks.

6. **Map the remaining node types:**
   - `apiRequest` → an apiRequest/custom tool on the assistant that owns that stage.
   - `transferCall` → a transferCall tool on the relevant assistant (`destination` = phone number, `transferPlan.message` carried over).
   - `endCall` / `hangup` → fold "end the call" into the terminal assistant's prompt (no separate member needed).
   - **Global node** (`isGlobal: true`) → give the relevant assistant(s) a handoff/transfer whose `description` is the node's `condition` (e.g. "caller asks to speak to a human"). It applies from anywhere that assistant is active.

7. **Assemble the Squad.** Put the entry assistant first in `members`. Use `assistantName` references between members (or `assistantId` for saved assistants). Add `memberOverrides` for any setting that should be identical across all members (e.g. voice).

8. **Validate** against the checklist at the bottom.

### Node → Squad construct (quick reference)

| Workflow | Squad |
| --- | --- |
| `conversation` / `gather` node | Folded into an assistant's system prompt (group linear chains into one assistant) |
| Edge `condition` | `destination.description` on a handoff tool |
| Edge with no condition (crossing a boundary) | Handoff with a "when done with X" description |
| `extractVariables` used downstream in another assistant | `variableExtractionPlan.schema` on the crossing handoff |
| `extractVariables` used only locally | Just `{{name}}` in the same assistant's prompt — no plan needed |
| `apiRequest` node | apiRequest/custom tool on the owning assistant |
| `transferCall` node | transferCall tool on the relevant assistant |
| `endCall` / `hangup` node | "end the call" instruction in the terminal assistant's prompt |
| Global node (`isGlobal`) | A broad-condition handoff/transfer on the relevant assistant(s) |
| Start node | First member of `members` |

---

## Worked example

### Input workflow

```json
{
  "name": "Acme Dental Front Desk",
  "nodes": [
    { "id": "greet", "type": "conversation", "firstMessage": "Hi! Thanks for calling Acme Dental. How can I help?", "systemPrompt": "Greet the caller and ask what they need." },
    { "id": "collect", "type": "conversation", "systemPrompt": "Ask for the caller's full name and whether they're calling about an appointment or a billing question.",
      "extractVariables": [
        { "name": "patientName", "type": "string", "description": "the caller's full name" },
        { "name": "intent", "type": "string", "description": "appointment or billing" }
      ] },
    { "id": "schedule", "type": "conversation", "systemPrompt": "Ask {{patientName}} for a preferred date/time, confirm the appointment, and mention a text confirmation." },
    { "id": "billing", "type": "conversation", "systemPrompt": "Answer {{patientName}}'s billing question." },
    { "id": "bye", "type": "endCall", "firstMessage": "You're all set, have a great day!" }
  ],
  "edges": [
    { "from": "greet", "to": "collect", "condition": "caller states what they need" },
    { "from": "collect", "to": "schedule", "condition": "caller wants an appointment" },
    { "from": "collect", "to": "billing", "condition": "caller has a billing question" },
    { "from": "schedule", "to": "bye" },
    { "from": "billing", "to": "bye" }
  ]
}
```

### Transform decisions

- `greet` + `collect` are sequential, same job (intake) → merge into one **Intake** assistant.
- `collect` branches to two stages (`schedule`, `billing`) with different jobs and one-directional flow → keep **Scheduling** and **Billing** as separate members. The two branch edges become one handoff tool with two destinations; the edge conditions become the destination descriptions.
- `bye` is a trivial terminal `endCall` → fold "end the call" into the Scheduling and Billing prompts. No separate member.
- `patientName` is captured in Intake but used in Scheduling/Billing (a different assistant) → pass it via `variableExtractionPlan` on both handoff destinations; reference `{{patientName}}` downstream.
- `intent` only chooses the branch → no extraction needed; it's encoded in which destination the model picks.
- One shared voice across all members → `memberOverrides.voice`.

### Output squad

```json
{
  "squad": {
    "members": [
      {
        "assistant": {
          "name": "Intake",
          "firstMessage": "Hi! Thanks for calling Acme Dental. How can I help?",
          "model": {
            "provider": "openai",
            "model": "gpt-4o",
            "messages": [
              { "role": "system", "content": "[Identity]\nYou are the intake agent for Acme Dental.\n\n[Task]\n1. Ask for the caller's full name.\n2. Ask whether they're calling about scheduling an appointment or a billing question.\n3. When their intent is clear, hand off: use the Scheduling destination for appointments, or the Billing destination for billing questions. Do not mention the handoff to the caller." }
            ],
            "tools": [
              {
                "type": "handoff",
                "destinations": [
                  {
                    "type": "assistant",
                    "assistantName": "Scheduling",
                    "description": "caller wants to book, reschedule, or cancel an appointment",
                    "contextEngineeringPlan": { "type": "all" },
                    "variableExtractionPlan": {
                      "schema": {
                        "type": "object",
                        "properties": {
                          "patientName": { "type": "string", "description": "the caller's full name" }
                        },
                        "required": ["patientName"]
                      }
                    }
                  },
                  {
                    "type": "assistant",
                    "assistantName": "Billing",
                    "description": "caller has a question about an invoice, payment, or refund",
                    "contextEngineeringPlan": { "type": "all" },
                    "variableExtractionPlan": {
                      "schema": {
                        "type": "object",
                        "properties": {
                          "patientName": { "type": "string", "description": "the caller's full name" }
                        },
                        "required": ["patientName"]
                      }
                    }
                  }
                ]
              }
            ]
          }
        }
      },
      {
        "assistant": {
          "name": "Scheduling",
          "model": {
            "provider": "openai",
            "model": "gpt-4o",
            "messages": [
              { "role": "system", "content": "[Identity]\nYou are the scheduling agent for Acme Dental. The caller's name is {{patientName}}.\n\n[Task]\n1. Greet {{patientName}} by name.\n2. Ask for their preferred date and time and confirm the appointment.\n3. Tell them they'll receive a text confirmation, then end the call." }
            ]
          }
        }
      },
      {
        "assistant": {
          "name": "Billing",
          "model": {
            "provider": "openai",
            "model": "gpt-4o",
            "messages": [
              { "role": "system", "content": "[Identity]\nYou are the billing agent for Acme Dental. The caller's name is {{patientName}}.\n\n[Task]\n1. Greet {{patientName}} by name.\n2. Answer their billing question, then end the call." }
            ]
          }
        }
      }
    ],
    "memberOverrides": {
      "voice": { "provider": "vapi", "version": 2, "voiceId": "Elliot" }
    }
  }
}
```

Five nodes with a branch collapsed to **three** members: one intake, two one-directional destinations, the terminal `endCall` folded into prompts, and the cross-boundary variable passed via extraction.

---

## Variable extraction reference

- Put `variableExtractionPlan.schema` (a JSON Schema object) on the handoff **destination** when data must cross to the next assistant. Top-level properties become globals: schema property `patientName` → `{{patientName}}` (not `{{root.patientName}}`).
- Access patterns: nested object `{{name.first}}`; array `{{ids[0]}}`; array of objects `{{people[0].name}}`.
- `aliases` derive new variables with Liquid: `{ "key": "fullName", "value": "{{firstName}} {{lastName}}" }`. Alias keys: start with a letter, letters/numbers/underscores, ≤40 chars.
- **Extraction is best-effort, not deterministic.** It runs an LLM against the transcript at handoff time. If a value isn't clearly present, or a transient error occurs, it can return empty and the handoff still proceeds. For business-critical or strictly deterministic values, capture them via a tool/API response instead of transcript extraction, and test that they're reliably populated.
- For OpenAI models, prefer one handoff tool per destination ("multiple tools" pattern); for Anthropic models, prefer one handoff tool with multiple destinations.

## When to stop and ask the human

Flag these instead of guessing:

- The workflow uses logical/deterministic edge conditions (e.g. `{{ tier == "VIP" }}`) that need exact routing — confirm whether to extract the value first and reference it, or capture it deterministically via a tool.
- A business-critical variable must never be missing — confirm a deterministic capture method.
- Two stages look like they hand off cyclically — confirm consolidation vs. keeping them split.
- Phone-transfer destinations, API endpoints, or auth headers aren't present in the input — ask for them.

## Output requirements / validation

- [ ] The first `members` entry is the workflow's start.
- [ ] Assistant count is minimized; linear chains are merged; no cyclical handoff pair is left split.
- [ ] Every retained edge is represented by a handoff destination whose `description` captures the edge condition.
- [ ] Every variable referenced across an assistant boundary has a `variableExtractionPlan` on the crossing handoff; locally-used variables don't.
- [ ] `apiRequest`, `transferCall`, and tool nodes are attached to the correct assistant.
- [ ] `endCall`/`hangup` behavior is folded into terminal prompts.
- [ ] All referenced `assistantName`/`assistantId` values resolve to a member.
- [ ] JSON is valid and matches the shapes above.
- [ ] If migrating an API integration, the caller sends `squadId` instead of `workflowId`.

## Resources (canonical docs)

- Migration guide: https://docs.vapi.ai/workflows/legacy-migration
- Squads overview: https://docs.vapi.ai/squads
- Handoff tool (full schema): https://docs.vapi.ai/squads/handoff
- Variable extraction: https://docs.vapi.ai/squads/handoff#variable-extraction
- Context engineering: https://docs.vapi.ai/squads/handoff#context-engineering
- Squads API reference: https://docs.vapi.ai/api-reference/squads/create
- Worked stage-based example: https://docs.vapi.ai/squads/examples/clinic-triage-scheduling-handoff-tool
