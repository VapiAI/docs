---
title: Session management
subtitle: Maintain conversation context using previousChatId vs sessionId
slug: chat/session-management
---

## Overview

Vapi provides two approaches for maintaining conversation context across multiple chat interactions.

**Two Context Management Methods:**
* **`previousChatId`** - Links individual chats in sequence
* **`sessionId`** - Groups multiple chats under a persistent session

<Warning>
`previousChatId` and `sessionId` are **mutually exclusive**. You cannot use both in the same request.
</Warning>

## Prerequisites

* Completed [Chat quickstart](/chat/quickstart) tutorial
* Basic understanding of chat requests and responses

---

## Method 1: Using previousChatId

Link chats together by referencing the ID of the previous chat.

<Steps>
  <Step title="Send first message">
    ```bash title="Initial Chat"
    curl -X POST https://api.vapi.ai/chat \
      -H "Authorization: Bearer YOUR_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "assistantId": "your-assistant-id",
        "input": "Hello, my name is Sarah"
      }'
    ```
  </Step>
  <Step title="Get the chat ID from response">
    ```json title="Response"
    {
      "id": "chat_abc123",
      "output": [{"role": "assistant", "content": "Hello Sarah!"}]
    }
    ```
  </Step>
  <Step title="Reference previous chat in next request">
    ```bash title="Follow-up Chat"
    curl -X POST https://api.vapi.ai/chat \
      -H "Authorization: Bearer YOUR_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "assistantId": "your-assistant-id",
        "previousChatId": "chat_abc123",
        "input": "What was my name again?"
      }'
    ```
  </Step>
</Steps>

Here's a TypeScript implementation of the conversation chain:

```typescript title="conversation-chain.ts"
function createConversationChain() {
  let lastChatId: string | null = null;

  return async function sendMessage(assistantId: string, input: string) {
    const requestBody = {
      assistantId,
      input,
      ...(lastChatId && { previousChatId: lastChatId })
    };

    const response = await fetch('https://api.vapi.ai/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const chat = await response.json();
    lastChatId = chat.id;
    
    return chat.output[0].content;
  };
}

// Usage
const sendMessage = createConversationChain();
await sendMessage("asst_123", "Hi, I'm Alice");
await sendMessage("asst_123", "What's my name?"); // Remembers Alice
```

---

## Method 2: Using sessionId

Create a persistent session that groups multiple chats.

<Steps>
  <Step title="Create a session">
    ```bash title="Create Session"
    curl -X POST https://api.vapi.ai/session \
      -H "Authorization: Bearer YOUR_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{"assistantId": "your-assistant-id"}'
    ```
  </Step>
  <Step title="Get session ID from response">
    ```json title="Session Response"
    {
      "id": "session_xyz789",
      "assistantId": "your-assistant-id"
    }
    ```
  </Step>
  <Step title="Use session ID in all related chats">
    ```bash title="First Chat in Session"
    curl -X POST https://api.vapi.ai/chat \
      -H "Authorization: Bearer YOUR_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "sessionId": "session_xyz789",
        "input": "Hello, I need help with billing"
      }'
    ```
  </Step>
</Steps>

<Note>
- Sessions expire automatically after 24 hours by default. After expiration, you'll need to create a new session to continue conversations.
- Web chat widget and SMS conversations automatically manage session creation and expiration. You don't need to manually create or manage sessions when using these channels.
</Note>

Here's a TypeScript implementation of the session manager:

```typescript title="session-manager.ts"
async function createSession(assistantId: string) {
  const response = await fetch('https://api.vapi.ai/session', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ assistantId })
  });

  const session = await response.json();
  
  return function sendMessage(input: string) {
    return fetch('https://api.vapi.ai/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionId: session.id, input })
    })
    .then(response => response.json())
    .then(chat => chat.output[0].content);
  };
}

// Usage
const sendMessage = await createSession("asst_123");
await sendMessage("I need help with my account");
await sendMessage("What was my first question?"); // Remembers context
```

---

## When to use each approach

Use `previousChatId` when:
* Dealing with simple back-and-forth conversations
* Looking for a minimal setup

Use `sessionId` when:
* Building complex multi-step workflows
* Long-running conversations
* Error resilience needed

<Note>
Sessions are tied to one assistant. You cannot specify `assistantId` when using `sessionId`.
</Note>

---

## Multi-Assistant Workflows

For workflows with multiple assistants, create separate sessions for each assistant.

```typescript title="multi-assistant-workflow.ts"
function createMultiAssistantWorkflow() {
  const sessions = new Map<string, string>();

  return async function sendToAssistant(assistantId: string, input: string) {
    let sessionId = sessions.get(assistantId);
    
    if (!sessionId) {
      const response = await fetch('https://api.vapi.ai/session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assistantId })
      });
      
      const session = await response.json();
      sessionId = session.id;
      sessions.set(assistantId, sessionId);
    }

    const response = await fetch('https://api.vapi.ai/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionId, input })
    });

    const chat = await response.json();
    return chat.output[0].content;
  };
}

// Usage
const sendToAssistant = createMultiAssistantWorkflow();
await sendToAssistant("support_agent", "I have a billing issue");
await sendToAssistant("billing_agent", "Can you help with this?");
```

---

## Webhook Support

<Note>
Sessions support the following webhook events through server messaging:
- **`session.created`** - Triggered when a new session is created
- **`session.updated`** - Triggered when a session is updated
- **`session.deleted`** - Triggered when a session is deleted

To receive these webhooks, go to your Assistant page in the Dashboard and navigate to "Server Messaging" and select the events you want to receive.

These webhooks are useful for tracking session lifecycle, managing session state in your own database, and triggering workflows based on session changes.
</Note>

---

## Next Steps

* **[Streaming responses](/chat/streaming)** - Add real-time responses to session-managed chats
* **[OpenAI compatibility](/chat/openai-compatibility)** - Use familiar OpenAI patterns with sessions
* **[Custom tools](/tools/custom-tools)** - Give assistants access to external APIs within sessions

<Callout>
Need help? Chat with the team on our [Discord](https://discord.com/invite/pUFNcf2WmH) or mention us on [X/Twitter](https://x.com/Vapi_AI).
</Callout>
