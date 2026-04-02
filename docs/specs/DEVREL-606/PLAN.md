# Plan: Retell AI to VAPI Migration Documentation

## Overview

This plan covers the creation of comprehensive documentation guiding users through converting Retell AI JSON conversation flow configurations to VAPI equivalents. The documentation targets users migrating from Retell AI's graph-based conversation flow system to VAPI's multi-assistant architecture.

Both Retell AI and VAPI use graph-based architectures for conversation flows, making the conceptual mapping relatively straightforward. Retell uses nodes with instructions and edges with transition conditions, while VAPI offers two approaches: Squads (recommended, using handoff tools between assistants) and Workflows (deprecated, using node/edge graphs). The documentation will prioritize Squads as the recommended migration path while providing a legacy reference for Workflows.

The documentation will live in the existing VapiAI/docs repository, following the Fern MDX documentation framework already in use. It will be placed in a new `fern/migration/` directory with a corresponding navigation section in `docs.yml`.

## Goals

- [ ] Primary: Create a clear, step-by-step migration guide that maps every Retell AI JSON configuration element to its VAPI equivalent
- [ ] Secondary: Provide complete before/after conversion examples for common patterns (branching logic, variable extraction, multilingual support, tool calling)
- [ ] Secondary: Recommend VAPI Squads as the primary migration path while documenting Workflows as a legacy alternative
- [ ] Secondary: Integrate seamlessly into the existing Vapi documentation site navigation

## Complexity

**Assessment: Simple**

This is a documentation-only change involving 4 new MDX files and 1 modified YAML file. No API endpoints, database changes, or service integrations are involved. Total files: 5 (4 create + 1 modify). All changes are content additions with no risk to existing functionality.

## Technical Approach

### Architecture

The documentation will follow the existing Fern MDX framework patterns used throughout the VapiAI/docs repository. Content will be organized as a new top-level navigation section called "Migration guides" in `docs.yml`.

Key architectural decisions:
- **New directory `fern/migration/`**: Keeps migration content separate from feature documentation, following the pattern of `fern/workflows/`, `fern/squads/`, etc.
- **Squads-first approach**: Since VAPI Workflows are deprecated, the Squads guide is the primary document while Workflows gets a shorter legacy reference
- **Element mapping table**: A central reference table maps every Retell JSON property to both VAPI Squads and Workflows equivalents
- **Progressive examples**: From simple (single node) to complex (multi-step interview with variable extraction)

### Component Design

**New files:**
- `fern/migration/retell-overview.mdx` (~200-300 lines): Landing page with platform comparison, element mapping table, and decision guide
- `fern/migration/retell-to-squads.mdx` (~350-450 lines): Primary 6-step migration guide with detailed instructions
- `fern/migration/retell-to-workflows.mdx` (~150-250 lines): Legacy reference with deprecation notice
- `fern/migration/retell-examples.mdx` (~300-400 lines): 5 complete before/after conversion examples

**Modified files:**
- `fern/docs.yml`: Add new "Migration guides" navigation section

### Navigation Changes

Add the following section to `docs.yml` at the top level, after the existing main sections:

```yaml
- section: Migration guides
  icon: fa-light fa-right-left
  contents:
    - page: Migrating from Retell AI
      path: migration/retell-overview.mdx
      icon: fa-light fa-arrow-right-arrow-left
    - page: "Retell to Squads (recommended)"
      path: migration/retell-to-squads.mdx
      icon: fa-light fa-people-group
    - page: "Retell to Workflows (legacy)"
      path: migration/retell-to-workflows.mdx
      icon: fa-light fa-diagram-project
    - page: Complete conversion examples
      path: migration/retell-examples.mdx
      icon: fa-light fa-code
```

### Element Mapping Reference

The core mapping table between platforms:

| Retell AI JSON Property | VAPI Squads Equivalent | VAPI Workflows Equivalent |
|---|---|---|
| `global_prompt` | System message in each assistant's `model.messages[]` | `globalNode.prompt` |
| `start_node_id` | First member in `squad.members[]` | Node with `isStart: true` |
| `nodes[].instruction.text` | `assistant.model.messages[].content` | `nodes[].systemPrompt` |
| `nodes[].edges[]` | Handoff tool `destinations[]` | `edges[]` array |
| `edges[].transition_condition` (type: "prompt") | Handoff tool `description` (natural language) | `edges[].condition` with `type: "ai"` |
| `edges[].transition_condition` (type: "equation") | Handoff rejection plan conditions | `edges[].condition` with `type: "logic"` |
| `edges[].destination_node_id` | `destinations[].assistantId` | `edges[].to` |
| `model_temperature` | `assistant.model.temperature` | `nodes[].model.temperature` |
| `tools[]` | `assistant.model.tools[]` | `nodes[].tools[]` |
| `knowledge_base_ids` | `assistant.model.knowledgeBase` | N/A |
| N/A (manual) | `variableExtractionPlan` with JSON schema | `extractVariables` |
| N/A | `contextEngineeringPlan` | N/A |

## Implementation Steps

### Step 1: Create retell-overview.mdx (Landing Page)

**Files:**
- Create: `fern/migration/retell-overview.mdx`

**Description:**
Create the migration landing page that serves as the entry point for Retell AI users. This page should include:

1. **Introduction** (~30 lines): Welcome message for Retell users, brief explanation of VAPI's capabilities, and note that VAPI Squads is the recommended migration path
2. **Platform Comparison** (~40 lines): Side-by-side comparison of Retell AI and VAPI architectures:
   - Retell: Nodes with instructions + edges with transition conditions
   - VAPI Squads: Multiple assistants with handoff tools
   - VAPI Workflows: Node/edge graph (deprecated)
3. **Element Mapping Table** (~50 lines): The complete mapping table from the Technical Approach section above
4. **Migration Path Decision Guide** (~30 lines): Help users choose between Squads (recommended for new migrations) and Workflows (only if specific legacy requirements exist)
5. **Prerequisites** (~20 lines): What users need before starting (VAPI account, API key, Retell JSON export)
6. **Quick Start** (~30 lines): Links to the detailed guides with brief descriptions

**Testing:**
- Verify MDX renders correctly in Fern preview
- Verify all internal links resolve
- Verify mapping table is accurate against both platforms' current APIs

**Dependencies:** None

### Step 2: Create retell-to-squads.mdx (Primary Guide)

**Files:**
- Create: `fern/migration/retell-to-squads.mdx`

**Description:**
Create the primary migration guide using VAPI Squads. This is the most important document and should be comprehensive. Structure as a 6-step process:

1. **Step 1: Analyze Your Retell Configuration** (~50 lines)
   - How to export/examine your Retell JSON
   - Identify nodes, edges, global prompt, tools, and variables
   - Count conversation stages for squad member planning

2. **Step 2: Map Nodes to Assistants** (~80 lines)
   - Each Retell node becomes a VAPI assistant (squad member)
   - Convert `nodes[].instruction.text` to `assistant.model.messages[].content`
   - Map `global_prompt` to system messages in each assistant
   - Configure `model.temperature` from Retell's `model_temperature`
   - Show JSON before/after for a single node conversion

3. **Step 3: Configure Handoff Tools (Transition Logic)** (~80 lines)
   - Convert Retell `edges[]` to handoff tool `destinations[]`
   - Map `transition_condition.type: "prompt"` to handoff `description`
   - Map `transition_condition.type: "equation"` to rejection plan conditions
   - Map `destination_node_id` to `assistantId` in destinations
   - Show JSON before/after for edge conversion

4. **Step 4: Set Up Variable Extraction** (~60 lines)
   - Use `variableExtractionPlan` with JSON schema to capture structured data
   - Map Retell's manual variable handling to VAPI's automatic extraction
   - Configure `aliases` using Liquid templates for cross-assistant data sharing
   - Show example for extracting name, age, location from conversation

5. **Step 5: Configure Context Engineering** (~40 lines)
   - Set `contextEngineeringPlan` for each handoff (all/lastNMessages/userAndAssistantMessages/none)
   - Best practices for long interviews: use `lastNMessages` to avoid context overflow
   - How context flows between squad members during handoffs

6. **Step 6: Assemble the Squad** (~60 lines)
   - Combine all assistants into a squad via API
   - Set the first member (maps to `start_node_id`)
   - Configure squad-level settings
   - Show complete squad creation API call
   - Testing and validation checklist

**Testing:**
- All JSON examples must be valid and match current VAPI API schema
- Step-by-step flow should be followable by a developer with no prior VAPI experience
- Cross-reference handoff configuration against `fern/squads/handoff.mdx`

**Dependencies:** Step 1 (overview page for cross-linking)

### Step 3: Create retell-to-workflows.mdx (Legacy Reference)

**Files:**
- Create: `fern/migration/retell-to-workflows.mdx`

**Description:**
Create a shorter legacy reference for users who specifically need Workflows. Include a prominent deprecation notice at the top.

1. **Deprecation Notice** (~10 lines): Clear callout that Workflows are deprecated, link to Squads guide as recommended alternative
2. **When to Use Workflows** (~20 lines): Only if you have specific requirements that Squads cannot meet (increasingly rare)
3. **Quick Mapping Guide** (~60 lines):
   - `start_node_id` → node with `isStart: true`
   - `global_prompt` → `globalNode.prompt`
   - `nodes[].instruction.text` → `nodes[].systemPrompt`
   - `edges[].transition_condition` → `edges[].condition` (ai/logic types)
   - `tools[]` → `nodes[].tools[]`
4. **Simple Conversion Example** (~60 lines): One complete before/after example
5. **Limitations vs Squads** (~30 lines): What you miss by using Workflows (variable extraction, context engineering, etc.)

**Testing:**
- Deprecation notice must be visually prominent
- JSON examples must match current Workflows API schema
- Cross-reference against `fern/workflows/overview.mdx` and `fern/workflows/quickstart.mdx`

**Dependencies:** Step 1 (overview page for cross-linking)

### Step 4: Create retell-examples.mdx (Complete Examples)

**Files:**
- Create: `fern/migration/retell-examples.mdx`

**Description:**
Create a page with 5 complete before/after conversion examples, progressing from simple to complex:

1. **Example 1: Simple Greeting + Transfer** (~50 lines)
   - Retell: 2 nodes (greeting → transfer)
   - VAPI Squad: 2 assistants with one handoff

2. **Example 2: Branching Logic (FAQ Bot)** (~60 lines)
   - Retell: 1 node with 3 conditional edges
   - VAPI Squad: 1 assistant with 3 handoff destinations

3. **Example 3: Data Collection with Variable Extraction** (~70 lines)
   - Retell: 3 nodes collecting name, email, phone
   - VAPI Squad: 3 assistants with variableExtractionPlan

4. **Example 4: Multilingual Support (English + Swahili)** (~60 lines)
   - Retell: Language detection node → language-specific branches
   - VAPI Squad: Language detector assistant → language-specific assistants with appropriate voice/model config

5. **Example 5: Complex Interview Flow** (~80 lines)
   - Retell: 5+ nodes with conditional branching, tool calls, and data collection
   - VAPI Squad: Full squad with context engineering, variable extraction, tools, and handoff chains
   - Includes contextEngineeringPlan configuration for long conversations

Each example includes:
- Complete Retell JSON input
- Complete VAPI Squad JSON output
- Brief explanation of the mapping decisions

**Testing:**
- All Retell JSON examples must follow the documented Retell format
- All VAPI JSON examples must be valid against current API schema
- Examples should be copy-pasteable (with minor edits for API keys/IDs)

**Dependencies:** Steps 1-3 (for cross-linking)

### Step 5: Update docs.yml Navigation

**Files:**
- Modify: `fern/docs.yml`

**Description:**
Add the "Migration guides" navigation section to `docs.yml`. Place it after the main feature documentation sections. The section should include all 4 migration pages with appropriate icons.

The exact YAML to add is specified in the Navigation Changes section above. Place it after the "Phone numbers" section and before "Server URLs" (or a similarly appropriate location near the end of the main navigation).

**Testing:**
- Verify YAML is valid (no syntax errors)
- Verify all `path:` values match actual file locations
- Verify navigation renders correctly in Fern preview
- Verify icons display properly

**Dependencies:** Steps 1-4 (all MDX files must exist)

## PR Strategy

Due to the 500-line PR limit enforced by tasker guardrails, the implementation will be split across 2-3 PRs:

- **PR 1** (~400-500 lines): `retell-overview.mdx` + `retell-to-workflows.mdx` + `docs.yml` changes
- **PR 2** (~350-450 lines): `retell-to-squads.mdx`
- **PR 3** (~300-400 lines): `retell-examples.mdx`

Each PR should be independently reviewable and mergeable. PR 1 includes the `docs.yml` changes so navigation is available from the first merge.

## Testing Strategy

**Content validation:**
- All JSON examples are syntactically valid
- All Retell JSON follows documented Retell format
- All VAPI JSON matches current VAPI API schema
- Element mapping table is accurate and complete

**Documentation quality:**
- MDX renders correctly in Fern framework
- All internal cross-links resolve
- Code blocks have correct language tags
- Callouts and admonitions render properly

**User experience:**
- A developer unfamiliar with VAPI can follow the Squads guide end-to-end
- Examples are copy-pasteable with minimal modification
- Navigation is intuitive and discoverable

**Edge cases:**
- Retell configurations with no edges (single-node flows)
- Retell configurations with circular/looping edges
- Retell configurations using knowledge bases (partial VAPI mapping)
- Very large Retell configs (20+ nodes) — address with context engineering guidance

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Retell AI JSON format changes | Low | Medium | Document the format version; note that examples are based on current Retell format |
| VAPI Workflows fully removed | Medium | Low | Workflows guide already marked as legacy; Squads guide is primary |
| VAPI Squads API changes | Low | Medium | Use current API schema; document API version |
| 500-line PR limit exceeded | Medium | Low | Pre-planned PR split strategy; monitor line counts during implementation |
| Retell format documentation gaps | Medium | Medium | Used real Retell configs and code search to verify format; note any assumptions |

## Dependencies

**External documentation:**
- Retell AI JSON conversation flow format (verified via code search and real configs)
- VAPI Squads API documentation (`fern/squads/handoff.mdx`)
- VAPI Workflows API documentation (`fern/workflows/overview.mdx`, `fern/workflows/quickstart.mdx`)

**Internal prerequisites:**
- VapiAI/docs repository access
- Fern framework MDX rendering pipeline

## Success Criteria

- [ ] All 4 MDX files created and rendering correctly in Fern
- [ ] Navigation section added to docs.yml and functional
- [ ] Element mapping table covers all major Retell JSON properties
- [ ] At least 5 complete before/after conversion examples provided
- [ ] Squads guide is clearly positioned as the recommended migration path
- [ ] Workflows guide includes prominent deprecation notice
- [ ] All JSON examples are syntactically valid
- [ ] A developer can follow the Squads guide to convert a real Retell config
- [ ] Documentation is general enough for any Retell user (not project-specific)
