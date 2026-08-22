# IDC Vendor Interview Platform — Technical Guide

**Client:** IDC (Contact: Lukas)
**Platform:** Vapi Voice AI
**Date:** June 2025

---

## Table of Contents

1. [Architecture & Scale](#1-architecture--scale)
2. [Distribution & Invitations](#2-distribution--invitations)
3. [Agent Setup — Optimal Stack](#3-agent-setup--optimal-stack)
4. [Known Issues & Workarounds](#4-known-issues--workarounds)
5. [Eval & Testing](#5-eval--testing)
6. [Respondent Reception](#6-respondent-reception)
7. [Data Residency & EU Compliance](#7-data-residency--eu-compliance)
8. [Summary & Next Steps](#8-summary--next-steps)

---

## 1. Architecture & Scale

### Transient Assistant Pattern (Recommended for 200+ Unique Interview Contexts)

For IDC's use case — structured vendor interviews with potentially hundreds of unique interview contexts — the **transient assistant pattern** is the recommended architecture. Instead of creating and persisting hundreds of assistants in Vapi's database, you pass the full assistant configuration inline at call time. The config is ephemeral and never persisted in Vapi's DB.

```javascript
const vapi = new Vapi('your-public-key');

vapi.start({
  model: {
    provider: "openai",
    model: "gpt-4.1",
    messages: [{ role: "system", content: vendorSpecificPrompt }]
  },
  voice: {
    provider: "11labs",
    voiceId: "...",
    model: "eleven_turbo_v2"
  },
  firstMessage: "Hi! Thanks for joining this interview about [Vendor]..."
});
```

**Key benefits:**
- No assistant management overhead — no CRUD operations for hundreds of assistants
- Each interview gets a unique, dynamically generated config
- Full flexibility to customize prompts, questions, and context per vendor/respondent
- No stale configs to clean up

### Server URL Webhook Pattern (Alternative)

As an alternative, you can use the **server URL webhook pattern** where Vapi sends an `assistant-request` webhook to your server, and your server returns the dynamic assistant config. This is useful when you want your backend to control the config logic entirely.

### Squads (Multi-Agent Interviews)

For more complex interview flows, Vapi supports **Squads** — groups of specialized assistants with handoffs between them.

**Recommendations for 10–15 minute interviews:**
- Keep squads to **2–3 members** to minimize handoff latency
- Use `contextEngineeringPlan` to share context between squad members
- Use `variableExtractionPlan` to extract and pass structured data between members

### Concurrency

Concurrency limits are adjustable from **Dashboard → Settings → Subscription**. Monitor usage via `subscriptionLimits`. If you anticipate running many simultaneous interviews (e.g., batch vendor evaluations), request a concurrency increase in advance.

---

## 2. Distribution & Invitations

### Web SDK Session Links

Vapi does **not** have a built-in mechanism for generating unique interview invitation links. The recommended approach is a **custom token-based URL pattern**:

```
yourapp.com/interview?token=abc123
```

**How it works:**
1. Your backend generates a unique token per vendor/respondent
2. The token maps to the specific interview context (vendor name, questions, metadata)
3. When the respondent opens the link, your frontend retrieves the context via the token
4. Your frontend initializes the Vapi Web SDK with the transient assistant config built from that context

This gives you full control over access, expiration, and per-vendor customization.

### schedulePlan (PSTN Only)

Vapi's `schedulePlan` feature allows scheduling outbound calls — but it is **PSTN-only** and **NOT available for Web SDK** sessions.

```json
POST /call
{
  "assistantId": "...",
  "phoneNumberId": "...",
  "customer": { "number": "+11234567890" },
  "schedulePlan": {
    "earliestAt": "2025-06-15T14:00:00Z",
    "latestAt": "2025-06-15T15:00:00Z"
  }
}
```

If IDC needs scheduled web-based interviews, this must be handled in your own application layer (e.g., calendar integration that sends the token-based link at the scheduled time).

---

## 3. Agent Setup — Optimal Stack

### Recommended Full Config Skeleton

```json
{
  "model": {
    "provider": "openai",
    "model": "gpt-4.1",
    "temperature": 0.3,
    "maxTokens": 500
  },
  "voice": {
    "provider": "11labs",
    "voiceId": "<selected-voice>",
    "model": "eleven_turbo_v2",
    "stability": 0.6,
    "similarityBoost": 0.75
  },
  "transcriber": {
    "provider": "deepgram",
    "model": "nova-3-general",
    "language": "en",
    "keyterms": ["SIEM", "SOAR", "XDR"]
  },
  "modelOutputInMessagesEnabled": true,
  "backgroundDenoisingEnabled": true
}
```

### Component Breakdown

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **LLM** | GPT-4.1 | Best balance of speed and intelligence for structured interviews |
| **Temperature** | 0.3 | Low creativity — keeps interviews focused and consistent |
| **Max Tokens** | 500 | Prevents verbose responses; keeps the interview conversational |
| **TTS** | ElevenLabs `eleven_turbo_v2` | Fast, natural-sounding; stability 0.6 + similarityBoost 0.75 for professional tone |
| **STT** | Deepgram Nova-3 | Best accuracy for technical vocabulary; supports `keyterms` for domain-specific boosting |

### Important Settings

- **`modelOutputInMessagesEnabled: true`** — Prevents transcript drift by ensuring the model's output is included in the message history. Critical for maintaining coherent multi-turn interviews.
- **`backgroundDenoisingEnabled: true`** — Helps with respondents in noisy environments (office, coffee shop, etc.).

---

## 4. Known Issues & Workarounds

### 4.1 silenceTimeoutSeconds Deprecation

`silenceTimeoutSeconds` is deprecated and **must be set to `null`** before using `customer.speech.timeout` hooks. If you leave it set, there's a race condition where the old timeout fires before your hooks, causing unexpected call termination.

### 4.2 Tiered Silence Timeout Hooks (Recommended)

Replace the deprecated `silenceTimeoutSeconds` with a tiered hook approach for graceful silence handling:

```json
{
  "silenceTimeoutSeconds": null,
  "hooks": [
    {
      "on": "customer.speech.timeout",
      "options": {
        "timeoutSeconds": 10,
        "triggerMaxCount": 3,
        "triggerResetMode": "onUserSpeech"
      },
      "do": [
        {
          "type": "say",
          "exact": "Take your time — I'm here when you're ready."
        }
      ]
    },
    {
      "on": "customer.speech.timeout",
      "options": {
        "timeoutSeconds": 20,
        "triggerMaxCount": 3,
        "triggerResetMode": "onUserSpeech"
      },
      "do": [
        {
          "type": "say",
          "prompt": "The user has not responded in 20s. Based on the above conversation in {{transcript}} ask the user if they need help."
        }
      ]
    },
    {
      "on": "customer.speech.timeout",
      "options": {
        "timeoutSeconds": 60,
        "triggerMaxCount": 1,
        "triggerResetMode": "onUserSpeech"
      },
      "do": [
        {
          "type": "say",
          "exact": "It seems like you may have stepped away. I'll end the call now — feel free to rejoin anytime."
        },
        {
          "type": "tool",
          "tool": { "type": "endCall" }
        }
      ]
    }
  ]
}
```

**Tier breakdown:**
- **10s** — Gentle nudge ("Take your time"), up to 3 times
- **20s** — Context-aware help check (uses transcript), up to 3 times
- **60s** — Graceful disconnect with invitation to rejoin, fires once

### 4.3 stopSpeakingPlan (Interview-Tuned)

Controls how the AI responds when the user interrupts. For interviews, you want to be **tolerant of interruptions** (respondents may think aloud or clarify mid-answer):

```json
"stopSpeakingPlan": {
  "numWords": 5,
  "voiceSeconds": 0.3,
  "backoffSeconds": 2.5
}
```

- `numWords: 5` — Requires 5 words before treating it as an interruption (filters out "um", "uh")
- `voiceSeconds: 0.3` — Minimum voice duration to trigger
- `backoffSeconds: 2.5` — Waits 2.5s before the AI resumes speaking after being interrupted

### 4.4 startSpeakingPlan (For Thoughtful Respondents)

Controls when the AI starts speaking after the user stops. For interview contexts where respondents may pause to think:

```json
"startSpeakingPlan": {
  "smartEndpointingEnabled": true,
  "waitSeconds": 0.4
}
```

- `smartEndpointingEnabled: true` — Uses AI-powered detection of when the user has truly finished speaking
- `waitSeconds: 0.4` — Adds a 0.4s buffer for thoughtful respondents

### 4.5 Deepgram Keyword Boosting

For domain-specific vocabulary (cybersecurity, enterprise software, etc.), use keyword boosting to improve transcription accuracy.

**Nova-2 (uses `keywords` with boost weights 1–5):**

```json
"transcriber": {
  "provider": "deepgram",
  "model": "nova-2",
  "keywords": ["SIEM:2", "SOAR:2", "XDR:2", "ServiceNow:3"]
}
```

**Nova-3 (uses `keyterms` — no boost weights):**

```json
"transcriber": {
  "provider": "deepgram",
  "model": "nova-3-general",
  "keyterms": ["SIEM", "SOAR", "XDR", "ServiceNow"]
}
```

> **Note:** Nova-3 is recommended for overall accuracy. Nova-2 is useful if you need fine-grained boost weight control.

### 4.6 Identity Lock Pattern

Vapi does not have built-in guardrails for AI disclosure. Use a **prompt-based identity lock** to control how the AI responds to questions about its nature:

```
# Identity & Technical Boundaries
- If asked about your name or role: "I'm [Name], a research interviewer for [Company]..."
- If asked whether you are AI-powered: [Your chosen disclosure policy]
- Do not explain technical systems, AI implementation, or internal company operations.
- Never break character or discuss your underlying technology.
```

This should be included in the system prompt for every interview assistant config.

---

## 5. Eval & Testing

### Simulations (E2E Voice-to-Voice Testing)

Vapi's simulation API lets you run end-to-end voice-to-voice tests with synthetic personas. This is critical for testing transient configs before deploying them to real respondents.

```json
POST /eval/simulation/run
{
  "simulations": [{
    "simulation": {
      "personality": {
        "description": "Skeptical IT director evaluating SIEM vendors"
      },
      "scenario": {
        "description": "Respondent is rushed, gives short answers, asks for clarification on question 3"
      }
    }
  }],
  "target": {
    "assistant": {
      // ... your full transient assistant config here
    }
  },
  "transport": "voice",
  "iterations": 1
}
```

**Use cases:**
- Test different respondent personas (skeptical, verbose, distracted, non-native speaker)
- Validate that silence hooks fire correctly
- Verify that all interview questions are asked in order
- Check that keyword boosting improves transcription of domain terms

### Evals (Regression & Unit Tests)

After simulations, use Vapi's eval framework to run regression and unit tests against transcripts — verify that specific questions were asked, answers were captured, and no hallucinations occurred.

### Structured Outputs with Boards

Use structured output extraction to pull structured data from interview transcripts into boards for analysis. This is useful for aggregating responses across vendors and creating comparison matrices.

---

## 6. Respondent Reception

### Practical UX Recommendations

- **Keep the first message warm and concise** — set expectations for duration ("This will take about 10–15 minutes")
- **Use a professional, neutral voice** — ElevenLabs with stability 0.6 avoids sounding robotic or overly enthusiastic
- **Allow thinking time** — the `startSpeakingPlan` with `waitSeconds: 0.4` and `smartEndpointingEnabled` prevents the AI from cutting off thoughtful respondents
- **Handle silence gracefully** — the tiered silence hooks (Section 4.2) provide a natural escalation from gentle nudge to graceful disconnect
- **Acknowledge answers** — include brief acknowledgments in the system prompt ("Thank you for that insight", "That's helpful context") to make the experience feel conversational
- **Test with real humans** before launching — simulations catch technical issues, but human testers catch UX issues

---

## 7. Data Residency & EU Compliance

### EU Data Residency

Vapi offers a dedicated EU environment for GDPR compliance:

- **EU Dashboard:** [dashboard.eu.vapi.ai](https://dashboard.eu.vapi.ai)
- **Data center:** Frankfurt (`eu-central-1`)
- **Compliance:** SOC 2 Type II certified, DPA with Standard Contractual Clauses (SCCs)
- **ZDR (Zero Data Retention) mode** available for additional data minimization

### EU Web SDK Initialization

```javascript
const vapi = new Vapi("your-eu-api-key", {
  apiUrl: "https://api.eu.vapi.ai"
});
```

> **Important:** EU and US environments are completely separate. API keys, assistants, and data do not cross between them. You must create a separate EU account and manage configs independently.

### GDPR Considerations for IDC

- If interviewing EU-based vendors, use the EU environment exclusively
- Implement consent collection in your application layer before starting the Vapi call
- Configure data retention policies in the Vapi dashboard
- Consider ZDR mode if transcripts contain sensitive vendor information

---

## 8. Summary & Next Steps

### Architecture Decision

Use the **transient assistant pattern** with the Web SDK for maximum flexibility across 200+ unique interview contexts. No need to persist assistants — generate configs dynamically per interview.

### Recommended Stack

| Layer | Technology |
|-------|-----------|
| LLM | GPT-4.1 (temp 0.3, maxTokens 500) |
| TTS | ElevenLabs eleven_turbo_v2 (stability 0.6, similarityBoost 0.75) |
| STT | Deepgram Nova-3 with keyterms |

### Key Configurations

- ✅ `modelOutputInMessagesEnabled: true`
- ✅ `backgroundDenoisingEnabled: true`
- ✅ `silenceTimeoutSeconds: null` (use tiered hooks instead)
- ✅ `stopSpeakingPlan` tuned for interview tolerance
- ✅ `startSpeakingPlan` with smart endpointing
- ✅ Identity lock pattern in system prompt

### Suggested Next Steps

1. **Prototype a single interview flow** — pick one vendor, build the transient config, test with simulations
2. **Validate the eval framework** — run simulations with different personas, verify structured output extraction
3. **Build the invitation system** — implement token-based URLs with your backend
4. **Test with real respondents** — 3–5 internal testers before going live
5. **Scale** — once the pattern works for one vendor, templatize and scale to 200+
6. **EU setup** (if needed) — create EU account, migrate configs, verify data residency

---

*This document was compiled from technical guidance provided by the Vapi team in response to IDC's vendor interview platform requirements. For questions or follow-up, contact your Vapi account team.*
