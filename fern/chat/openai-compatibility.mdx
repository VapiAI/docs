---
title: OpenAI compatibility
subtitle: Seamlessly migrate existing OpenAI integrations to Vapi with zero code changes
slug: chat/openai-compatibility
---

## Overview

Migrate your existing OpenAI chat applications to Vapi without changing a single line of code. Perfect for teams already using OpenAI SDKs, third-party tools expecting OpenAI API format, or developers who want to leverage existing OpenAI workflows.

**What You'll Build:**
* Drop-in replacement for OpenAI chat endpoints using Vapi assistants
* Migration path from OpenAI to Vapi with existing codebases
* Integration with popular frameworks like LangChain and Vercel AI SDK
* Production-ready server implementations with both streaming and non-streaming

## Prerequisites

* Completed [Chat quickstart](/chat/quickstart) tutorial
* Existing OpenAI integration or familiarity with OpenAI SDK

## Scenario

We'll migrate "TechFlow's" existing OpenAI-powered customer support chat to use Vapi assistants, maintaining all existing functionality while gaining access to Vapi's advanced features like custom voices and tools.

---

## 1. Quick Migration Test

<Steps>
  <Step title="Install the OpenAI SDK">
    If you don't already have it, install the OpenAI SDK:
    
    <CodeBlocks>
    ```bash title="npm"
    npm install openai
    ```

    ```bash title="yarn"
    yarn add openai
    ```

    ```bash title="pnpm"
    pnpm add openai
    ```

    ```bash title="bun"
    bun add openai
    ```
    </CodeBlocks>
  </Step>
  <Step title="Test with OpenAI-compatible endpoint">
    Use your existing OpenAI code with minimal changes:
    
    ```bash title="Test OpenAI Compatibility"
    curl -X POST https://api.vapi.ai/chat/responses \
      -H "Authorization: Bearer YOUR_VAPI_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "model": "gpt-4o",
        "input": "Hello, I need help with my account",
        "stream": false,
        "assistantId": "your-assistant-id"
      }'
    ```
  </Step>
  <Step title="Verify response format">
    The response follows OpenAI's structure with Vapi enhancements:
    
    ```json title="OpenAI-Compatible Response"
    {
      "id": "response_abc123",
      "object": "chat.response",
      "created": 1642678392,
      "model": "gpt-4o",
      "output": [
        {
          "role": "assistant",
          "content": [
            {
              "type": "text",
              "text": "Hello! I'd be happy to help with your account. What specific issue are you experiencing?"
            }
          ]
        }
      ],
      "usage": {
        "prompt_tokens": 12,
        "completion_tokens": 23,
        "total_tokens": 35
      }
    }
    ```
  </Step>
</Steps>

---

## 2. Migrate Existing OpenAI Code

<Steps>
  <Step title="Update your OpenAI client configuration">
    Change only the base URL and API key in your existing code:
    
    ```typescript title="Before (OpenAI)"
    import OpenAI from 'openai';

    const openai = new OpenAI({
      apiKey: 'your-openai-api-key'
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hello!' }],
      stream: true
    });
    ```

    ### With Vapi (No Code Changes)

    ```typescript title="After (Vapi)"
    import OpenAI from 'openai';

    const openai = new OpenAI({
      apiKey: 'YOUR_VAPI_API_KEY',
      baseURL: 'https://api.vapi.ai/chat',
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hello!' }],
      stream: true
    });
    ```
  </Step>
  <Step title="Update your function calls">
    Change `chat.completions.create` to `responses.create` and add `assistantId`:
    
    ```typescript title="Before (OpenAI Chat Completions)"
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'user', content: 'What is the capital of France?' }
      ],
      stream: false
    });
    
    console.log(response.choices[0].message.content);
    ```
    
    ```typescript title="After (Vapi Compatibility)"
    const response = await openai.responses.create({
      model: 'gpt-4o',
      input: 'What is the capital of France?',
      stream: false,
      assistantId: 'your-assistant-id'
    });
    
    console.log(response.output[0].content[0].text);
    ```
  </Step>
  <Step title="Test your migrated code">
    Run your updated code to verify the migration works:
    
    ```typescript title="migration-test.ts"
    import OpenAI from 'openai';
    
    const openai = new OpenAI({
      apiKey: 'YOUR_VAPI_API_KEY',
      baseURL: 'https://api.vapi.ai/chat'
    });
    
    async function testMigration() {
      try {
        const response = await openai.responses.create({
          model: 'gpt-4o',
          input: 'Hello, can you help me troubleshoot an API issue?',
          stream: false,
          assistantId: 'your-assistant-id'
        });
        
        console.log('Migration successful!');
        console.log('Response:', response.output[0].content[0].text);
      } catch (error) {
        console.error('Migration test failed:', error);
      }
    }
    
    testMigration();
    ```
  </Step>
</Steps>

---

## 3. Implement Streaming with OpenAI SDK

<Steps>
  <Step title="Migrate streaming chat completions">
    Update your streaming code to use Vapi's streaming format:
    
    ```bash title="Streaming via curl"
    curl -X POST https://api.vapi.ai/chat/responses \
      -H "Authorization: Bearer YOUR_VAPI_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "model": "gpt-4o",
        "input": "Explain how machine learning works in detail",
        "stream": true,
        "assistantId": "your-assistant-id"
      }'
    ```
  </Step>
  <Step title="Update streaming JavaScript code">
    Adapt your existing streaming implementation:
    
    ```typescript title="streaming-migration.ts"
    async function streamWithVapi(userInput: string): Promise<string> {
      const stream = await openai.responses.create({
        model: 'gpt-4o',
        input: userInput,
        stream: true,
        assistantId: 'your-assistant-id'
      });

      let fullResponse = '';
      
      const reader = stream.body?.getReader();
      if (!reader) return fullResponse;
      
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        
        // Parse and process SSE events
        const lines = chunk.split('\n').filter(line => line.trim());
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              if (event.path && event.delta) {
                process.stdout.write(event.delta);
                fullResponse += event.delta;
              }
            } catch (e) {
              console.error('Invalid JSON line:', line);
              continue;
            }
          }
        }
      }
      
      console.log('\n\nComplete response received.');
      return fullResponse;
    }

    streamWithVapi('Write a detailed explanation of REST APIs');
    ```
  </Step>
  <Step title="Handle conversation context">
    Implement context management using Vapi's approach:
    
    ```typescript title="context-management.ts"
    function createContextualChatSession(apiKey: string, assistantId: string) {
      const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://api.vapi.ai/chat'
      });
      let lastChatId: string | null = null;

      async function sendMessage(input: string, stream: boolean = false) {
        const requestParams = {
          model: 'gpt-4o',
          input: input,
          stream: stream,
          assistantId: assistantId,
          ...(lastChatId && { previousChatId: lastChatId })
        };

        const response = await openai.responses.create(requestParams);

        if (!stream) {
          lastChatId = response.id;
          return response.output[0].content[0].text;
        }

        return response;
      }

      return { sendMessage };
    }

    // Usage example
    const session = createContextualChatSession('YOUR_VAPI_API_KEY', 'your-assistant-id');

    const response1 = await session.sendMessage("My name is Sarah and I'm having login issues");
    console.log('Response 1:', response1);

    const response2 = await session.sendMessage("What was my name again?");
    console.log('Response 2:', response2); // Should remember "Sarah"
    ```
  </Step>
</Steps>

---

## 4. Framework Integrations

<Steps>
  <Step title="Integrate with LangChain">
    Use Vapi with LangChain's OpenAI integration:
    
    ```typescript title="langchain-integration.ts"
    import { ChatOpenAI } from "langchain/chat_models/openai";
    import { HumanMessage } from "langchain/schema";

    const chat = new ChatOpenAI({
      openAIApiKey: "YOUR_VAPI_API_KEY",
      configuration: {
        baseURL: "https://api.vapi.ai/chat"
      },
      modelName: "gpt-4o",
      streaming: false
    });

    async function chatWithVapi(message: string, assistantId: string): Promise<string> {
      const response = await fetch('https://api.vapi.ai/chat/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer YOUR_VAPI_API_KEY`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          input: message,
          assistantId: assistantId,
          stream: false
        })
      });

      const data = await response.json();
      return data.output[0].content[0].text;
    }

    // Usage
    const response = await chatWithVapi(
      "What are the best practices for API design?",
      "your-assistant-id"
    );
    console.log(response);
    ```
  </Step>
  <Step title="Integrate with Vercel AI SDK">
    Use Vapi with Vercel's AI SDK:
    
    ```typescript title="vercel-ai-integration.ts"
    import { openai } from '@ai-sdk/openai';
    import { generateText, streamText } from 'ai';

    const vapiOpenAI = openai({
      apiKey: 'YOUR_VAPI_API_KEY',
      baseURL: 'https://api.vapi.ai/chat'
    });

    // Non-streaming text generation
    async function generateWithVapi(prompt: string, assistantId: string): Promise<string> {
      const response = await fetch('https://api.vapi.ai/chat/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer YOUR_VAPI_API_KEY`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          input: prompt,
          assistantId: assistantId,
          stream: false
        })
      });

      const data = await response.json();
      return data.output[0].content[0].text;
    }

    // Streaming implementation
    async function streamWithVapi(prompt: string, assistantId: string): Promise<void> {
      const response = await fetch('https://api.vapi.ai/chat/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer YOUR_VAPI_API_KEY`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          input: prompt,
          assistantId: assistantId,
          stream: true
        })
      });

      const reader = response.body?.getReader();
      if (!reader) return;
      
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        
        // Parse and process SSE events
        const lines = chunk.split('\n').filter(line => line.trim());
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              if (event.path && event.delta) {
                process.stdout.write(event.delta);
              }
            } catch (e) {
              console.error('Invalid JSON line:', line);
              continue;
            }
          }
        }
      }
    }

    // Usage examples
    const text = await generateWithVapi(
      "Explain the benefits of microservices architecture",
      "your-assistant-id"
    );
    console.log(text);
    ```
  </Step>
  <Step title="Create a production server">
    Build a simple server that exposes Vapi through OpenAI-compatible endpoints:
    
    ```typescript title="simple-server.ts"
    import express from 'express';

    const app = express();
    app.use(express.json());

    app.post('/v1/chat/completions', async (req, res) => {
      const { messages, model, stream = false, assistant_id } = req.body;
      
      if (!assistant_id) {
        return res.status(400).json({ 
          error: 'assistant_id is required for Vapi compatibility' 
        });
      }

      const lastMessage = messages[messages.length - 1];
      const input = lastMessage.content;

      const response = await fetch('https://api.vapi.ai/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assistantId: assistant_id,
          input: input,
          stream: stream
        })
      });

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        const reader = response.body?.getReader();
        if (!reader) {
          return res.status(500).json({ error: 'Failed to get stream reader' });
        }
        
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            res.write('data: [DONE]\n\n');
            res.end();
            break;
          }
          
          const chunk = decoder.decode(value);
          res.write(chunk);
        }
      } else {
        const chat = await response.json();
        const openaiResponse = {
          id: chat.id,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: model || 'gpt-4o',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: chat.output[0].content
            },
            finish_reason: 'stop'
          }]
        };
        res.json(openaiResponse);
      }
    });

    app.listen(3000, () => {
      console.log('Vapi-OpenAI compatibility server running on port 3000');
    });
    ```
  </Step>
</Steps>

---

## Next Steps

Enhance your migrated system:

* **[Explore Vapi-specific features](/chat/quickstart)** - Leverage advanced assistant capabilities
* **[Add voice capabilities](/calls/outbound-calling)** - Extend beyond text to voice interactions
* **[Integrate tools](/tools/custom-tools)** - Give your assistant access to external APIs
* **[Optimize for streaming](/chat/streaming)** - Improve real-time user experience

<Callout>
Need help? Chat with the team on our [Discord](https://discord.com/invite/pUFNcf2WmH) or mention us on [X/Twitter](https://x.com/Vapi_AI).
</Callout>
