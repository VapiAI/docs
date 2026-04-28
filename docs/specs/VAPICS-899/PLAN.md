# Plan: AI Phone Agent with Knowledge Base Integration and Outbound Calling (VAPICS-899)

## Overview

This plan provides a complete implementation architecture for building AI Phone Agents on the Vapi platform that connect to a proprietary knowledge base via API and support both inbound and outbound calling. The customer (Ramik Mukherjee) needs to create voice AI agents that can answer questions from their proprietary knowledge base, make outbound calls for follow-ups and proactive outreach, and scale with a reliable phone provider.

The architecture leverages Vapi's core primitives: Assistants (the AI agent configuration), Phone Numbers (telephony integration via Twilio/Telnyx/Vonage), Custom Tools (for real-time API calls to external systems), and Custom Knowledge Bases (for webhook-based document retrieval from proprietary data sources). Together, these components form an end-to-end voice AI system that can handle both inbound customer inquiries and programmatic outbound calling campaigns.

This plan is designed as a reference implementation and integration guide rather than changes to the Vapi platform codebase itself. It produces a deployable server-side application (the knowledge base webhook server and orchestration layer), Vapi resource configurations (assistant, tools, phone numbers, knowledge base), and API integration code for triggering outbound calls.

## Goals

- [ ] Primary: Design and document a complete architecture for AI phone agents connected to a proprietary knowledge base via API, with both inbound and outbound calling capabilities
- [ ] Secondary: Provide a phone provider comparison and recommendation based on the customer's needs
- [ ] Secondary: Deliver working code examples for all key integration points (knowledge base server, outbound call triggering, assistant configuration)
- [ ] Secondary: Document compliance considerations (TCPA, STIR/SHAKEN) and operational best practices

## Technical Approach

### Architecture

The system consists of four layers that interact through the Vapi platform:

```
+-------------------+     +-------------------+     +------------------------+
|  Phone Provider   |     |   Vapi Platform   |     |  Customer's Backend    |
|  (Twilio/Telnyx)  |<--->|                   |<--->|                        |
|                   |     |  - Assistant       |     |  - KB Webhook Server   |
|  - Phone Numbers  |     |  - LLM (GPT-4o)   |     |  - Vector DB / Search  |
|  - SIP Trunking   |     |  - Voice (11Labs)  |     |  - Proprietary API     |
|  - STIR/SHAKEN    |     |  - Tools Config    |     |  - Call Orchestrator   |
+-------------------+     |  - Knowledge Base  |     +------------------------+
                          +-------------------+
                                   ^
                                   |
                          +-------------------+
                          | Outbound Call API  |
                          | (POST /call)       |
                          | - Single calls     |
                          | - Batch calls      |
                          | - Scheduled calls  |
                          +-------------------+
```

**Component placement:**
- **Vapi Platform (SaaS)**: Hosts the assistant configuration, orchestrates STT/LLM/TTS pipeline, manages call routing. No code deployed here -- configured via API/Dashboard.
- **Customer's Backend Server**: Hosts the knowledge base webhook endpoint and the outbound call orchestration logic. This is the primary codebase the customer builds and deploys.
- **Phone Provider (Twilio or Telnyx)**: Provides phone numbers and telephony infrastructure. Configured via provider's portal and imported into Vapi.

**Key patterns followed:**
- Webhook-based integration for knowledge base queries (Vapi sends POST to customer's server)
- REST API calls for outbound call initiation (customer's server calls Vapi's `/call` endpoint)
- Custom Tools with server URL for real-time API calls during conversations
- Saved (persistent) assistants for consistent behavior across calls

### Component Design

**New components (to be built by customer):**

- `KnowledgeBaseServer` (customer's infrastructure): Express/FastAPI server that receives `knowledge-base-request` webhooks from Vapi, queries the proprietary knowledge base, and returns relevant documents. This is the core integration point between Vapi and the customer's proprietary data.

- `OutboundCallOrchestrator` (customer's infrastructure): Service/module that programmatically initiates outbound calls via the Vapi `POST /call` API. Handles single calls, batch calls, and scheduled calls for use cases like follow-ups, notifications, and campaigns.

- `CustomToolHandler` (customer's infrastructure): Webhook endpoint that handles `tool-calls` events from Vapi for real-time actions during calls (e.g., CRM lookups, ticket creation, appointment booking). Optional but recommended for richer agent capabilities.

**Vapi resources to configure (via API/Dashboard):**

- `Assistant`: The AI agent configuration including system prompt, LLM model, voice, and attached tools/knowledge base
- `Phone Number`: Imported from chosen provider (Twilio or Telnyx), assigned to assistant
- `Custom Knowledge Base`: Webhook configuration pointing to customer's KB server
- `Custom Tool(s)`: Function definitions for real-time API calls during conversations

### API Changes

This plan does not modify any Vapi API endpoints. It consumes the following existing Vapi API endpoints:

**Consumed endpoints:**

- `POST https://api.vapi.ai/assistant` - Create assistant
- `PATCH https://api.vapi.ai/assistant/{id}` - Update assistant (attach KB, tools)
- `POST https://api.vapi.ai/knowledge-base` - Create custom knowledge base
- `POST https://api.vapi.ai/tool` - Create custom tool
- `POST https://api.vapi.ai/phone-number` - Create/import phone number
- `POST https://api.vapi.ai/call` - Initiate outbound call (single, batch, scheduled)

**Webhook endpoints to implement (on customer's server):**

- `POST /kb/search` - Receives `knowledge-base-request` from Vapi, returns documents
- `POST /tools/webhook` - Receives `tool-calls` from Vapi, returns results
- `POST /vapi/events` - (Optional) Receives server events (status-update, end-of-call-report, etc.)

### Database Changes

No changes to Vapi's databases. The customer's backend may need:

- A vector database (Pinecone, Weaviate, pgvector, etc.) or search index for their knowledge base
- An application database for call logs, customer records, and outbound campaign state

No schema changes are prescribed -- this depends entirely on the customer's existing infrastructure.

## Phone Provider Evaluation and Recommendation

### Provider Comparison

| Feature | Twilio | Telnyx | Vonage |
|---------|--------|--------|--------|
| **Vapi Integration** | Full (native import) | Full (native import) | Full (native import) |
| **Outbound Support** | Yes | Yes (requires Outbound Voice Profile config) | Yes |
| **SIP Trunking** | Yes (documented) | Yes (documented) | Yes |
| **STIR/SHAKEN** | Full support via Trust Hub | Supported | Supported |
| **International Calling** | 180+ countries | 140+ countries | 200+ countries |
| **CNAM Registration** | Yes | Yes | Yes |
| **Pricing (US local)** | ~$1/mo + $0.0085/min | ~$0.50/mo + $0.005/min | ~$0.50/mo + $0.006/min |
| **Documentation Quality** | Excellent (most Vapi docs reference Twilio) | Good | Moderate |
| **Setup Complexity** | Low (direct credential import) | Medium (requires Outbound Voice Profile setup) | Low |

### Recommendation

**Primary recommendation: Twilio** for the following reasons:
1. Most extensively documented integration with Vapi (Vapi's own docs use Twilio as the primary example)
2. STIR/SHAKEN Trust Hub provides the best caller reputation management
3. Comprehensive compliance tools (Voice Integrity, CNAM branding)
4. Largest global coverage and most mature platform
5. Customer already sees Twilio in Vapi docs, reducing onboarding friction

**Alternative recommendation: Telnyx** if the customer needs:
- Lower per-minute costs (Telnyx is typically 30-40% cheaper)
- The customer's current provider issues are cost-related
- Good option as secondary provider for redundancy

**Note on customer's current provider issues:** The customer mentioned issues with their current phone provider. If those issues are related to call quality, spam labeling, or limited international support, Twilio's Trust Hub and Voice Integrity features directly address these. If cost is the primary concern, Telnyx offers competitive rates with solid Vapi integration.

## Implementation Steps

### Step 1: Vapi Account and Phone Number Setup

**Files:**
- Create: `config/vapi-setup.ts` (setup script for Vapi resources)

**Description:**

Set up the foundational Vapi account configuration and import a phone number from the chosen provider.

1. **Obtain Vapi API Key**: Sign up at dashboard.vapi.ai and retrieve the API key from the dashboard
2. **Set up phone provider account** (Twilio recommended):
   - Create a Twilio account at twilio.com
   - Purchase a phone number in the Twilio console (select local number in target region)
   - Retrieve Account SID and Auth Token from Twilio Console > API Keys & Tokens
3. **Import phone number into Vapi**:

```typescript
import { VapiClient } from "@vapi-ai/server-sdk";

const vapi = new VapiClient({ token: process.env.VAPI_API_KEY! });

// Import Twilio number into Vapi
const phoneNumber = await vapi.phoneNumbers.create({
  provider: "twilio",
  number: "+1XXXXXXXXXX",           // Your Twilio phone number
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID!,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN!,
  name: "Main Support Line"
});

console.log(`Phone number imported: ${phoneNumber.id}`);
```

4. **Configure trusted calling** (for outbound):
   - Complete Twilio Trust Hub verification (5-7 business days)
   - Register CNAM for business name display
   - Consider registering with First Orion and Hiya for enhanced caller ID

**Testing:**
- Verify phone number appears in Vapi Dashboard > Phone Numbers
- Make a test inbound call to confirm the number is routed to Vapi

**Dependencies:** None (first step)

---

### Step 2: Knowledge Base Webhook Server

**Files:**
- Create: `src/server.ts` (main Express server)
- Create: `src/routes/knowledge-base.ts` (KB search endpoint)
- Create: `src/services/search.ts` (search/retrieval logic connecting to proprietary KB)
- Create: `src/middleware/auth.ts` (webhook signature verification)
- Create: `package.json` (Node.js project configuration)
- Create: `tsconfig.json` (TypeScript configuration)
- Create: `.env.example` (environment variable template)

**Description:**

Build the webhook server that receives knowledge base queries from Vapi and returns relevant documents from the customer's proprietary knowledge base.

**Server implementation (`src/routes/knowledge-base.ts`):**

```typescript
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { searchKnowledgeBase } from '../services/search';

const router = Router();

router.post('/kb/search', async (req: Request, res: Response) => {
  try {
    // 1. Verify webhook signature
    const signature = req.headers['x-vapi-signature'] as string;
    const secret = process.env.VAPI_WEBHOOK_SECRET;

    if (signature && secret) {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== `sha256=${expectedSignature}`) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // 2. Validate request type
    const { message } = req.body;
    if (message.type !== 'knowledge-base-request') {
      return res.status(400).json({ error: 'Invalid request type' });
    }

    // 3. Extract the latest user query from conversation history
    const userMessages = message.messages.filter(
      (msg: any) => msg.role === 'user'
    );
    const latestQuery = userMessages[userMessages.length - 1]?.content || '';

    // 4. Query the proprietary knowledge base
    const documents = await searchKnowledgeBase(latestQuery);

    // 5. Return documents for AI processing
    res.json({
      documents: documents.map(doc => ({
        content: doc.content,
        similarity: doc.score,
        uuid: doc.id
      }))
    });
  } catch (error) {
    console.error('Knowledge base search error:', error);
    // Gracefully degrade -- return empty documents rather than error
    res.json({ documents: [] });
  }
});

export default router;
```

**Search service (`src/services/search.ts`) -- Vector DB integration pattern:**

```typescript
import { PineconeClient } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new PineconeClient();

interface SearchResult {
  id: string;
  content: string;
  score: number;
}

export async function searchKnowledgeBase(query: string): Promise<SearchResult[]> {
  // Generate embedding for the query
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query
  });

  // Search vector database
  const index = pinecone.Index(process.env.PINECONE_INDEX!);
  const searchResults = await index.query({
    vector: embeddingResponse.data[0].embedding,
    topK: 5,
    includeMetadata: true
  });

  return searchResults.matches.map(match => ({
    id: match.id,
    content: match.metadata?.content as string || '',
    score: match.score || 0
  }));
}
```

**Alternative: Direct API integration if the customer's KB has a REST API:**

```typescript
export async function searchKnowledgeBase(query: string): Promise<SearchResult[]> {
  // Call the customer's proprietary knowledge base API directly
  const response = await fetch(`${process.env.KB_API_URL}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.KB_API_KEY}`
    },
    body: JSON.stringify({ query, limit: 5 })
  });

  const data = await response.json();

  return data.results.map((result: any) => ({
    id: result.id,
    content: result.text || result.content,
    score: result.relevance_score || result.similarity || 0.5
  }));
}
```

**Performance requirements:**
- Response time must be under 50ms ideally, with a hard ceiling of 10 seconds
- Implement caching for frequently queried documents
- Pre-compute embeddings for static content

**Testing:**
- Unit test the search service with mock KB responses
- Integration test the webhook endpoint with sample Vapi payloads
- Load test to verify sub-50ms response times under expected concurrency

**Dependencies:** None (can be built in parallel with Step 1)

---

### Step 3: Custom Tool for Real-Time KB Queries (Alternative Approach)

**Files:**
- Create: `src/routes/tool-calls.ts` (tool call webhook handler)
- Modify: `src/server.ts` (register new route)

**Description:**

In addition to (or instead of) the Custom Knowledge Base approach in Step 2, the customer can use Vapi's Custom Tool feature to make real-time API calls to their knowledge base during conversations. This approach gives more control over when and how the KB is queried (the LLM decides when to invoke the tool based on conversation context).

**Tool call webhook handler (`src/routes/tool-calls.ts`):**

```typescript
import { Router, Request, Response } from 'express';
import { searchKnowledgeBase } from '../services/search';

const router = Router();

router.post('/tools/webhook', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (message.type !== 'tool-calls') {
      return res.status(400).json({ error: 'Invalid request type' });
    }

    const results = [];

    for (const toolCall of message.toolCallList) {
      if (toolCall.name === 'search_knowledge_base') {
        const query = toolCall.arguments.query;
        const documents = await searchKnowledgeBase(query);

        results.push({
          toolCallId: toolCall.id,
          result: JSON.stringify({
            documents: documents.map(d => d.content),
            count: documents.length
          })
        });
      }

      if (toolCall.name === 'get_customer_info') {
        // Example: CRM lookup during call
        const customerId = toolCall.arguments.customer_id;
        const customerData = await lookupCustomer(customerId);

        results.push({
          toolCallId: toolCall.id,
          result: JSON.stringify(customerData)
        });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('Tool call error:', error);
    res.json({
      results: [{
        toolCallId: req.body.message.toolCallList?.[0]?.id,
        result: 'An error occurred while processing the request.'
      }]
    });
  }
});

export default router;
```

**Register the tool with Vapi (via API):**

```typescript
// Create the custom tool
const kbTool = await fetch('https://api.vapi.ai/tool', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.VAPI_API_KEY}`
  },
  body: JSON.stringify({
    type: "function",
    function: {
      name: "search_knowledge_base",
      description: "Search the proprietary knowledge base for information relevant to the customer's question. Use this when the customer asks about products, policies, procedures, or any domain-specific information.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to find relevant information in the knowledge base"
          }
        },
        required: ["query"]
      }
    },
    server: {
      url: "https://your-server.com/tools/webhook",
      secret: process.env.VAPI_WEBHOOK_SECRET
    },
    messages: [
      {
        type: "request-start",
        content: "Let me look that up for you..."
      },
      {
        type: "request-failed",
        content: "I'm sorry, I wasn't able to find that information right now."
      }
    ]
  })
});
```

**When to use Custom Tool vs Custom Knowledge Base:**

| Aspect | Custom Knowledge Base | Custom Tool |
|--------|----------------------|-------------|
| **Trigger** | Automatic (on every relevant query) | LLM-controlled (invoked when LLM decides) |
| **Control** | Less control over when queries happen | Full control via function description |
| **Setup** | Simpler (one endpoint) | More configuration (tool definition + endpoint) |
| **Use Case** | Always-on KB augmentation | Selective, context-aware queries |
| **Recommendation** | Good for general FAQ/knowledge | Better for specific data lookups |

**Recommendation:** Use BOTH approaches together. The Custom Knowledge Base handles general queries automatically, while Custom Tools handle specific, structured lookups (e.g., "look up order #12345", "check inventory for product X").

**Testing:**
- Test tool invocation with various query types
- Verify the LLM correctly invokes the tool based on conversation context
- Test error handling and fallback messages

**Dependencies:** Step 2 (reuses the search service)

---

### Step 4: Assistant Configuration

**Files:**
- Create: `src/setup/create-assistant.ts` (assistant creation script)
- Create: `src/setup/system-prompt.txt` (system prompt template)

**Description:**

Create and configure the Vapi assistant with the appropriate system prompt, LLM model, voice, attached knowledge base, and tools.

**Assistant creation script:**

```typescript
import { VapiClient } from "@vapi-ai/server-sdk";

const vapi = new VapiClient({ token: process.env.VAPI_API_KEY! });

async function createAssistant() {
  // Step 4a: Create the assistant
  const assistant = await vapi.assistants.create({
    name: "Customer Support Agent",
    firstMessage: "Hello! Thank you for calling. How can I help you today?",

    // LLM Configuration
    model: {
      provider: "openai",
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a knowledgeable and friendly customer support agent for [Company Name].

Your primary responsibilities:
1. Answer customer questions using information from the knowledge base
2. Help customers with product inquiries, order status, and general support
3. Escalate to a human agent when you cannot resolve an issue

Guidelines:
- Always be professional, concise, and helpful
- Keep responses under 2-3 sentences for conversational flow
- If you don't know the answer, say so honestly and offer to connect them with a specialist
- Never make up information -- only use verified data from the knowledge base
- Confirm important details by reading them back to the caller

When searching the knowledge base, formulate clear, specific queries to get the best results.`
        }
      ],
      // Attach tools by ID (created in Step 3)
      toolIds: ["SEARCH_KB_TOOL_ID"],
      // Attach knowledge base (created in Step 2 registration)
      knowledgeBaseId: "KNOWLEDGE_BASE_ID"
    },

    // Voice Configuration (ElevenLabs recommended for natural speech)
    voice: {
      provider: "11labs",
      voiceId: "21m00Tcm4TlvDq8ikWAM",  // "Rachel" -- professional female voice
      stability: 0.5,
      similarityBoost: 0.75
    },

    // Server URL for events (optional, for logging/analytics)
    serverUrl: "https://your-server.com/vapi/events",

    // Call behavior configuration
    endCallMessage: "Thank you for calling! Have a great day.",
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 600,    // 10 minute max call duration
    backgroundSound: "office",

    // Transcriber configuration
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en"
    }
  });

  console.log(`Assistant created: ${assistant.id}`);

  // Step 4b: Assign the phone number to this assistant
  await vapi.phoneNumbers.update("PHONE_NUMBER_ID", {
    assistantId: assistant.id
  });

  console.log("Phone number assigned to assistant");

  return assistant;
}
```

**System prompt design principles:**
- Keep it concise but comprehensive
- Define the agent's role, capabilities, and limitations
- Include instructions for knowledge base usage
- Specify escalation paths
- Set tone and response length guidelines

**Testing:**
- Test the assistant via Vapi's "Talk to Assistant" feature in the dashboard
- Make test inbound calls to verify end-to-end flow
- Verify knowledge base responses are being used correctly in conversations
- Test edge cases: unknown questions, silence, long conversations

**Dependencies:** Step 1 (phone number), Step 2 (knowledge base), Step 3 (custom tools)

---

### Step 5: Outbound Calling Integration

**Files:**
- Create: `src/services/outbound-calls.ts` (outbound call service)
- Create: `src/routes/campaigns.ts` (API endpoints for triggering outbound calls)
- Modify: `src/server.ts` (register campaign routes)

**Description:**

Implement the outbound calling capability using Vapi's `/call` API endpoint. Support single calls, batch calls, and scheduled calls.

**Outbound call service (`src/services/outbound-calls.ts`):**

```typescript
interface OutboundCallOptions {
  customerNumber: string;
  customerName?: string;
  assistantId?: string;           // Use saved assistant
  assistantOverrides?: object;    // Or transient overrides
  scheduledAt?: string;           // ISO date-time for scheduling
  metadata?: Record<string, any>;
}

interface BatchCallOptions {
  customers: Array<{ number: string; name?: string }>;
  assistantId: string;
  scheduledAt?: string;
  latestAt?: string;
}

export class OutboundCallService {
  private apiKey: string;
  private phoneNumberId: string;
  private defaultAssistantId: string;

  constructor() {
    this.apiKey = process.env.VAPI_API_KEY!;
    this.phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID!;
    this.defaultAssistantId = process.env.VAPI_ASSISTANT_ID!;
  }

  // Single outbound call
  async makeCall(options: OutboundCallOptions): Promise<any> {
    const payload: any = {
      phoneNumberId: this.phoneNumberId,
      customer: {
        number: options.customerNumber,
        name: options.customerName
      }
    };

    // Use saved assistant or transient override
    if (options.assistantId) {
      payload.assistantId = options.assistantId;
    } else if (options.assistantOverrides) {
      payload.assistant = options.assistantOverrides;
    } else {
      payload.assistantId = this.defaultAssistantId;
    }

    // Add scheduling if specified
    if (options.scheduledAt) {
      payload.schedulePlan = {
        earliestAt: options.scheduledAt
      };
    }

    const response = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Outbound call failed: ${response.status} ${error}`);
    }

    return response.json();
  }

  // Batch outbound calls
  async makeBatchCalls(options: BatchCallOptions): Promise<any> {
    const payload: any = {
      assistantId: options.assistantId || this.defaultAssistantId,
      phoneNumberId: this.phoneNumberId,
      customers: options.customers.map(c => ({
        number: c.number,
        name: c.name
      }))
    };

    if (options.scheduledAt) {
      payload.schedulePlan = {
        earliestAt: options.scheduledAt,
        ...(options.latestAt && { latestAt: options.latestAt })
      };
    }

    const response = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Batch call failed: ${response.status} ${error}`);
    }

    return response.json();
  }

  // Follow-up call with context from previous interaction
  async makeFollowUpCall(
    customerNumber: string,
    context: string
  ): Promise<any> {
    // Use transient assistant with context injected into system prompt
    return this.makeCall({
      customerNumber,
      assistantOverrides: {
        name: "Follow-Up Agent",
        firstMessage: `Hi, this is [Company Name] following up on your recent inquiry.`,
        model: {
          provider: "openai",
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a follow-up agent for [Company Name]. You are calling to follow up on a previous interaction.

Context from previous interaction:
${context}

Guidelines:
- Be brief and respectful of their time
- Reference the previous interaction specifically
- Ask if their issue was resolved or if they need further assistance
- Keep the call under 3 minutes`
            }
          ],
          knowledgeBaseId: process.env.VAPI_KB_ID
        },
        voice: {
          provider: "11labs",
          voiceId: "21m00Tcm4TlvDq8ikWAM"
        },
        maxDurationSeconds: 180,
        endCallMessage: "Thank you for your time. Goodbye!"
      }
    });
  }
}
```

**Campaign routes (`src/routes/campaigns.ts`):**

```typescript
import { Router, Request, Response } from 'express';
import { OutboundCallService } from '../services/outbound-calls';

const router = Router();
const callService = new OutboundCallService();

// Trigger a single outbound call
router.post('/calls/outbound', async (req: Request, res: Response) => {
  try {
    const { customerNumber, customerName, scheduledAt } = req.body;
    const result = await callService.makeCall({
      customerNumber,
      customerName,
      scheduledAt
    });
    res.json({ success: true, call: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger batch outbound calls
router.post('/calls/batch', async (req: Request, res: Response) => {
  try {
    const { customers, scheduledAt, latestAt } = req.body;
    const result = await callService.makeBatchCalls({
      customers,
      assistantId: process.env.VAPI_ASSISTANT_ID!,
      scheduledAt,
      latestAt
    });
    res.json({ success: true, calls: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger a follow-up call
router.post('/calls/follow-up', async (req: Request, res: Response) => {
  try {
    const { customerNumber, previousContext } = req.body;
    const result = await callService.makeFollowUpCall(
      customerNumber,
      previousContext
    );
    res.json({ success: true, call: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

**Use cases supported:**
1. **Appointment follow-ups**: Triggered by CRM/scheduling system after appointments
2. **Notification calls**: Triggered by events in the customer's system (order updates, alerts)
3. **Proactive outreach campaigns**: Batch calls with scheduling for marketing/sales
4. **Re-engagement**: Follow-up calls with context from previous interactions

**TCPA Compliance considerations:**
- Obtain prior express consent before making automated outbound calls
- Maintain a Do Not Call list and check it before each campaign
- Respect calling hour restrictions (8am-9pm in recipient's time zone)
- Provide opt-out mechanism during calls

**Testing:**
- Test single outbound call to a test number
- Test batch calling with 2-3 numbers
- Test scheduled calls and verify they trigger at the correct time
- Test follow-up calls with context injection
- Verify STIR/SHAKEN attestation on outbound calls (if Twilio Trust Hub is configured)

**Dependencies:** Step 1 (phone number), Step 4 (assistant)

---

### Step 6: Server Events and Call Analytics (Optional)

**Files:**
- Create: `src/routes/events.ts` (Vapi server events handler)
- Create: `src/services/analytics.ts` (call analytics/logging service)
- Modify: `src/server.ts` (register events route)

**Description:**

Implement optional server-side event handling to capture call lifecycle events, transcripts, and end-of-call reports for analytics and monitoring.

**Events handler (`src/routes/events.ts`):**

```typescript
import { Router, Request, Response } from 'express';

const router = Router();

router.post('/vapi/events', async (req: Request, res: Response) => {
  const { message } = req.body;

  switch (message.type) {
    case 'status-update':
      console.log(`Call ${message.call.id}: ${message.status}`);
      // Log call status transitions
      break;

    case 'end-of-call-report':
      // Store call transcript and recording
      await storeCallReport({
        callId: message.call.id,
        endedReason: message.endedReason,
        transcript: message.artifact?.transcript,
        recordingUrl: message.artifact?.recording?.url,
        duration: message.durationSeconds,
        cost: message.cost
      });
      break;

    case 'transcript':
      // Real-time transcript logging (if needed)
      break;

    case 'tool-calls':
      // Already handled by /tools/webhook endpoint
      break;

    default:
      console.log(`Unhandled event type: ${message.type}`);
  }

  res.status(200).json({ ok: true });
});

export default router;
```

**Testing:**
- Verify events are received during test calls
- Confirm end-of-call reports contain expected data
- Test with both inbound and outbound calls

**Dependencies:** Step 4 (assistant with serverUrl configured)

---

### Step 7: Deployment and End-to-End Testing

**Files:**
- Create: `Dockerfile` (container configuration)
- Create: `docker-compose.yml` (local development setup)
- Create: `.env.example` (environment variable documentation)
- Create: `tests/integration/e2e.test.ts` (end-to-end test suite)

**Description:**

Deploy the backend server and perform end-to-end testing of the complete system.

**Deployment checklist:**
1. Deploy the webhook server to a publicly accessible URL (e.g., AWS, GCP, Railway, Render)
2. Configure TLS/HTTPS (required for Vapi webhooks)
3. Set all environment variables (Vapi API key, phone number ID, assistant ID, KB credentials, webhook secret)
4. Update Vapi resources with production server URLs:
   - Custom Knowledge Base: update server URL
   - Custom Tools: update server URL
   - Assistant: update serverUrl for events

**Environment variables (`.env.example`):**

```
# Vapi Configuration
VAPI_API_KEY=your_vapi_api_key
VAPI_PHONE_NUMBER_ID=your_phone_number_id
VAPI_ASSISTANT_ID=your_assistant_id
VAPI_KB_ID=your_knowledge_base_id
VAPI_WEBHOOK_SECRET=your_webhook_secret

# Phone Provider (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token

# Knowledge Base
KB_API_URL=https://your-kb-api.com
KB_API_KEY=your_kb_api_key

# Optional: Vector DB
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX=your_index_name

# Server
PORT=3000
NODE_ENV=production
```

**End-to-end test scenarios:**
1. Inbound call -> assistant answers -> queries knowledge base -> provides accurate answer
2. Inbound call -> assistant answers -> invokes custom tool -> processes result
3. Outbound single call -> connects -> conversation with KB context -> ends gracefully
4. Outbound batch call -> multiple calls initiated -> all complete successfully
5. Outbound scheduled call -> scheduled for future -> triggers at correct time
6. Error handling -> KB server down -> assistant gracefully handles with fallback response

**Testing:**
- Run full E2E tests with real phone calls to test numbers
- Verify call quality and latency (KB response < 50ms target)
- Confirm all Vapi webhooks are received and processed correctly
- Monitor for any error responses in server logs

**Dependencies:** All previous steps

## Testing Strategy

**Unit tests:**
- Knowledge base search service (mock KB API, verify query construction and response parsing)
- Outbound call service (mock Vapi API, verify payload construction for single/batch/scheduled calls)
- Webhook signature verification (test valid/invalid signatures)
- Tool call handler (mock tool calls with various function names and arguments)

**Integration tests:**
- KB webhook endpoint: Send sample `knowledge-base-request` payloads, verify response format
- Tool call webhook: Send sample `tool-calls` payloads, verify response format
- Outbound call API: Verify correct Vapi API calls are made
- Event handler: Send sample server events, verify processing

**End-to-end tests:**
- Full inbound call flow with live KB queries
- Full outbound call flow with real phone numbers
- Batch calling with multiple recipients
- Scheduled calling with future timestamps
- Failover scenarios (KB down, Vapi API errors)

**Edge cases:**
- Empty search results from knowledge base
- KB server timeout (>10s)
- Concurrent tool calls in a single request
- Very long conversation exceeding maxDurationSeconds
- Customer hangs up during tool execution
- Invalid phone numbers in outbound calls
- Rate limiting on Vapi API during batch calls

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Knowledge base response latency >50ms degrades call quality | Medium | High | Implement caching, pre-compute embeddings, use in-memory search for hot data, deploy server in us-west-2 |
| Outbound calls flagged as spam | Medium | High | Complete Twilio Trust Hub verification, register CNAM, implement STIR/SHAKEN, register with First Orion and Hiya |
| TCPA compliance violation on outbound calls | Low | High | Implement consent tracking, maintain DNC list, enforce calling hour restrictions, document compliance procedures |
| Knowledge base webhook server downtime | Low | Medium | Deploy with redundancy, implement health checks, configure Vapi assistant with fallback behavior when KB is unavailable |
| Vapi API rate limiting during batch calls | Low | Medium | Implement exponential backoff, stagger batch call submissions, monitor rate limit headers |
| Customer's proprietary KB API changes breaking integration | Medium | Medium | Abstract KB integration behind a service layer, implement contract tests, add monitoring/alerting on KB responses |
| Phone number porting issues from current provider | Low | Low | Purchase new numbers from Twilio instead of porting; run both providers in parallel during transition |

## Dependencies

**External services:**
- **Vapi Platform**: SaaS -- API access required (api.vapi.ai)
- **Twilio** (recommended) or Telnyx: Phone number provisioning and telephony
- **OpenAI** (or other LLM provider): Powers the assistant's language model (configured via Vapi)
- **ElevenLabs** (or other TTS provider): Voice synthesis (configured via Vapi)
- **Customer's proprietary knowledge base API**: The data source for KB queries

**Internal prerequisites:**
- Vapi account with API key
- Twilio (or Telnyx) account with phone number
- Customer's KB API must be accessible via HTTPS
- Server infrastructure for hosting the webhook server (any cloud provider)
- Domain with TLS certificate for webhook endpoints

**SDK dependencies:**
- `@vapi-ai/server-sdk` -- Vapi TypeScript Server SDK
- `express` -- HTTP server framework
- `openai` -- For embedding generation (if using vector search)
- Vector DB client (e.g., `@pinecone-database/pinecone`) -- if customer uses vector search

## Success Criteria

- [ ] Phone number successfully imported from Twilio/Telnyx and assigned to Vapi assistant
- [ ] Inbound calls are answered by the AI assistant and correctly query the proprietary knowledge base
- [ ] Knowledge base webhook responds in under 50ms for 95th percentile of requests
- [ ] Custom tool calls are correctly invoked during conversations and return relevant data
- [ ] Single outbound calls can be programmatically initiated via the orchestration API
- [ ] Batch outbound calls successfully connect to multiple recipients
- [ ] Scheduled outbound calls trigger at the specified time
- [ ] Call transcripts and end-of-call reports are captured via server events
- [ ] STIR/SHAKEN attestation is active on outbound calls (Level A or B)
- [ ] All webhook endpoints validate signatures and handle errors gracefully
- [ ] The system handles KB server downtime gracefully without crashing the call

## Complexity

**Assessment: Complex**

**Reasoning:** This implementation involves:
- External service integrations (Vapi API, Twilio, customer's KB API, vector DB)
- Multiple API endpoints to implement (KB webhook, tool calls webhook, events handler, outbound call orchestration)
- Security-sensitive changes (webhook signature verification, API key management, TCPA compliance)
- More than 5 implementation steps (7 steps total)
- Multiple webhook integrations with specific request/response contracts
- Phone provider evaluation and configuration requiring external account setup

While no database schema changes or modifications to the Vapi platform itself are needed, the breadth of integrations and the number of moving parts make this a complex implementation.
