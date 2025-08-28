---
title: Assistants quickstart
subtitle: Build your first assistant and make a phone call in minutes
slug: assistants/quickstart
---

## Overview

Create a voice assistant with a simple prompt, attach a phone number, and make your first call. You’ll also learn how to add tools to take real actions.

**In this quickstart, you’ll:**
- Create an assistant (Dashboard or SDK)
- Attach a phone number
- Make inbound and outbound calls

## Prerequisites

- A Vapi account and API key

## 1) Create an assistant

<Tabs>
  <Tab title="Dashboard">
    <Steps>
      <Step title="Open Assistants">
        Go to the [Vapi Dashboard](https://dashboard.vapi.ai) → Assistants → Create Assistant.
      </Step>
      <Step title="Add a system prompt">
        ```txt title="System Prompt" maxLines=8
        You are a friendly phone support assistant. Greet the caller and offer help. Keep responses under 30 words. If a transfer is requested, confirm reason first.
        ```
      </Step>
      <Step title="Publish and test">
        Click Publish and then “Talk to Assistant” to validate behavior.
      </Step>
    </Steps>
  </Tab>
  <Tab title="TypeScript (Server SDK)">
    ```typescript
    import { VapiClient } from "@vapi-ai/server-sdk";

    const vapi = new VapiClient({ token: process.env.VAPI_API_KEY! });

    const assistant = await vapi.assistants.create({
      name: "Support Assistant",
      firstMessage: "Hello! How can I help you today?",
      model: {
        provider: "openai",
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a friendly phone support assistant. Keep responses under 30 words." }
        ]
      }
    });
    ```
  </Tab>
</Tabs>

## 2) Add a phone number

<Tabs>
  <Tab title="Dashboard">
    In the Dashboard, go to Phone Numbers → Create Phone Number → assign your assistant.
  </Tab>
  <Tab title="TypeScript (Server SDK)">
    ```typescript
    const number = await vapi.phoneNumbers.create({
      name: "Support Line",
      assistantId: assistant.id
    });
    ```
  </Tab>
</Tabs>

## 3) Make your first calls

<Steps>
  <Step title="Inbound call">
    Call the phone number you created. Your assistant will answer with the first message.
  </Step>
  <Step title="Outbound call (SDK)">
    ```typescript
    await vapi.calls.create({
      assistantId: assistant.id,
      customer: { number: "+1234567890" }
    });
    ```
  </Step>
</Steps>

## Next steps

- **Add tools**: [Custom tools](/tools/custom-tools)
- **Tune speech**: [Speech configuration](/customization/speech-configuration)
- **Structure data**: [Structured outputs](/assistants/structured-outputs)
- **Move to multi-assistant**: [Squads](/squads)

