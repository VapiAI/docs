# Plan: Add BAA Eligibility Clarification for Canadian Companies (VAPSEC-136)

## Overview

This plan addresses a specific customer-facing gap identified in the broader Canadian compliance initiative (VAPSEC-133, Gap #9): Canadian companies that want to sign Vapi's Business Associate Agreement (BAA) but do not handle US Protected Health Information (PHI). Currently, Vapi's BAA is built on the Common Paper BAA Standard Terms Version 1.0, which is exclusively designed for HIPAA-covered relationships involving US PHI. There is no guidance for Canadian companies whose health data obligations fall under provincial privacy laws (PHIPA, Quebec Law 25, Alberta HIA, BC PIPA) or federal PIPEDA rather than HIPAA.

A Canadian customer is actively waiting for clarification on whether they can sign Vapi's BAA. This plan prioritizes the external-facing FAQ/eligibility clarification to unblock that customer, followed by internal guidance for the sales and security teams. The plan also recommends a policy position and flags the legal review requirements before any content is published.

This is a documentation and policy task, not a code change. All deliverables are markdown/MDX files in the `VapiAI/docs` repository. The plan aligns with and references the parent VAPSEC-133 initiative, specifically its planned deliverable paths and content outlines.

## Goals

- [x] Primary: Publish an external-facing FAQ/eligibility clarification that answers whether Canadian companies without US PHI can sign Vapi's BAA (unblocks waiting customer)
- [ ] Secondary: Create internal guidance for sales and security teams on handling BAA requests from Canadian companies
- [ ] Tertiary: Establish a clear, legally reviewed policy position on BAA eligibility for non-HIPAA scenarios

## Complexity

**Simple** -- This task involves creating 2 new documentation files and modifying 1 existing file (navigation config). There are no API changes, no database changes, no code changes, and no external service integrations. The complexity is in the policy/legal review process, not the technical implementation.

## Policy Recommendation

### Recommended Position

**Canadian companies without US PHI should NOT sign Vapi's BAA.** Instead, they should be directed to Vapi's Data Processing Agreement (DPA) as the appropriate contractual vehicle, with a roadmap reference to a future Canadian Privacy Addendum.

### Rationale

1. **Legal scope mismatch**: Vapi's BAA uses Common Paper BAA Standard Terms v1.0, which implements HIPAA requirements (45 CFR Parts 160 and 164). Signing a HIPAA BAA when no US PHI is involved creates contractual obligations that are irrelevant and potentially confusing — neither party benefits.

2. **Existing coverage**: Vapi's DPA (finalized January 20, 2026) covers GDPR with EU SCCs. Canadian personal information processing can be addressed through a similar addendum mechanism without misusing the BAA.

3. **Canadian law differences**: Provincial health privacy laws (PHIPA, Alberta HIA, Quebec Law 25, BC PIPA) have different requirements than HIPAA — different breach notification timelines, different consent models, different data residency expectations. A BAA does not address these.

4. **Future path**: VAPSEC-133 plans a Canadian Privacy Addendum (`docs/compliance/canadian-privacy-addendum.md`) that would be the correct contractual instrument for Canadian health data obligations.

> **LEGAL REVIEW REQUIRED**: This policy recommendation must be reviewed and approved by legal counsel before any external-facing content is published. The recommendation above is based on technical analysis of the BAA terms and Canadian privacy law requirements, not legal advice.

## Technical Approach

### Architecture

All deliverables are static documentation files (MDX for external, markdown for internal). They will live in the `VapiAI/docs` repository under paths aligned with the VAPSEC-133 parent plan.

The external FAQ content will be added to the existing planned deliverable `fern/security-and-privacy/canadian-compliance-faq.mdx` (note: VAPSEC-133 planned this at `docs/compliance/canadian-compliance-faq.md`, but the existing documentation convention uses `.mdx` files under `fern/`; this plan follows the actual repo convention). The internal guidance will be a markdown file at `docs/internal/canadian-baa-eligibility-guide.md`.

### File Locations

The `fern/security-and-privacy/` directory is the established home for compliance documentation (HIPAA, GDPR, PCI, SOC files all live there). Adding Canadian compliance content here follows the existing pattern.

**Deviation from VAPSEC-133 paths**: VAPSEC-133 planned files under `docs/compliance/` which does not exist. This plan recommends using `fern/security-and-privacy/` for external content (matching existing patterns) and `docs/internal/` for internal content. This deviation should be communicated back to the VAPSEC-133 parent initiative.

### Component Design

**New files:**

- `fern/security-and-privacy/canadian-compliance-faq.mdx` -- External-facing FAQ covering BAA eligibility for Canadian companies. This is the highest-priority deliverable. It addresses VAPSEC-133 Gap #9 and FAQ Question #9 directly.

- `docs/internal/canadian-baa-eligibility-guide.md` -- Internal guidance for sales and security teams on how to handle BAA requests from Canadian companies, including decision tree, talk tracks, and escalation paths.

**Modified files:**

- `fern/docs.yml` -- Navigation configuration to add the new Canadian compliance FAQ page to the Security & Privacy section sidebar. (Exact modification depends on the current structure of this file; the implementer should add an entry under the security-and-privacy navigation group.)

### Backward Compatibility

Not applicable -- these are new documentation pages with no existing content to preserve.

### Database Changes

None.

### API Changes

None.

## Implementation Steps

### Step 1: Legal Review of Policy Position

**Files:**
- None (process step)

**Description:**
Before writing any external content, the recommended policy position (Canadian companies without US PHI should use DPA, not BAA) must be reviewed by legal counsel. This step involves:

1. Share the policy recommendation section of this plan with legal counsel
2. Confirm or revise the position on BAA eligibility
3. Confirm the recommended alternative (DPA + future Canadian Privacy Addendum)
4. Get sign-off on the key messaging points for external FAQ

**IMPORTANT**: Steps 2 and 3 below contain draft content based on the recommended policy position. If legal review changes the position, the content must be updated accordingly.

**Testing:** N/A (process step)

**Dependencies:** None

### Step 2: Create External Canadian Compliance FAQ

**Files:**
- Create: `fern/security-and-privacy/canadian-compliance-faq.mdx`

**Description:**
Create the external-facing FAQ page with the following content structure. This is the highest-priority deliverable -- a customer is waiting for this clarification.

```mdx
---
title: Canadian Compliance FAQ
description: Frequently asked questions about using Vapi for Canadian health data and privacy requirements.
slug: security-and-privacy/canadian-compliance-faq
---

# Canadian Compliance FAQ

## Overview

This FAQ addresses common questions from Canadian organizations about Vapi's compliance
posture as it relates to Canadian federal and provincial privacy legislation, including
PIPEDA, PHIPA (Ontario), Quebec Law 25, Alberta HIA, and BC PIPA.

## BAA Eligibility

### Can Canadian companies sign a BAA even if they don't handle US patient data?

Vapi's Business Associate Agreement (BAA) is built on the Common Paper BAA Standard
Terms Version 1.0, which specifically implements requirements under the US Health
Insurance Portability and Accountability Act (HIPAA). The BAA is designed for
relationships where US Protected Health Information (PHI) is involved.

**If your organization does not handle US PHI**, the BAA is not the appropriate
contractual instrument. Instead, we recommend:

1. **Vapi's Data Processing Agreement (DPA)** -- Our DPA covers general data processing
   obligations and includes GDPR provisions with EU Standard Contractual Clauses. This
   provides a contractual framework for personal information processing.

2. **Canadian Privacy Addendum (coming soon)** -- We are developing a dedicated Canadian
   Privacy Addendum that will address requirements specific to Canadian federal and
   provincial privacy legislation. Contact your account representative for timeline
   updates.

**If your organization handles both Canadian health information AND US PHI** (for
example, cross-border telehealth services), you may need both a BAA (for the US PHI
component) and additional contractual coverage for Canadian obligations. Contact our
security team at security@vapi.ai to discuss your specific situation.

### When should a Canadian company sign Vapi's BAA?

Sign the BAA only if your organization:
- Is a HIPAA Covered Entity or Business Associate
- Processes, stores, or transmits US Protected Health Information (PHI)
- Requires BAA coverage as part of your HIPAA compliance obligations

### What about Canadian health information that is not US PHI?

Canadian health information governed by provincial privacy laws (such as Ontario's
PHIPA or Quebec's Law 25) has different requirements than US PHI under HIPAA.
These include:

- Different breach notification timelines and thresholds
- Province-specific consent requirements
- Potential data residency requirements (varies by province)
- Different individual access and correction rights

Our upcoming Canadian Privacy Addendum will address these specific requirements.
In the interim, Vapi's DPA provides baseline data processing protections.

## Data Residency

### Where is Canadian data processed?

Vapi's primary infrastructure runs on AWS US-West-2 (Oregon). For organizations
with data residency concerns, Vapi offers:

- **Zero Data Retention (ZDR) mode** -- No call audio, transcripts, or recordings
  are stored on Vapi's servers
- **Bring Your Own Storage (BYOS)** -- Direct call data to your own AWS S3 buckets,
  including ca-central-1 (Montreal) for Canadian data residency

Note: Even with ZDR and BYOS enabled, certain metadata (call logs, configuration
data) is processed in US-West-2. Contact security@vapi.ai if your provincial
regulations require full data residency within Canada.

## Vapi's Compliance Posture

### What certifications and compliance frameworks does Vapi support?

| Framework | Status |
|-----------|--------|
| SOC 2 Type II | Completed |
| HIPAA | Operationally compliant; third-party assessment Dec 2025 |
| GDPR | Covered via DPA with EU SCCs |
| ISO 27001 | In progress (target Q2 2026) |
| Canadian Provincial Privacy Laws | Roadmap (see PIPEDA/PHIPA/Law 25 sections above) |

## Contact

For questions about Canadian compliance requirements, data residency options, or
contractual agreements, contact Vapi's security team at **security@vapi.ai**.
```

**Testing:**
- Verify MDX renders correctly (no syntax errors)
- Verify all links are valid
- Confirm the page appears in the sidebar navigation
- Review content accuracy against legal-approved policy position

**Dependencies:** Step 1 (legal review must approve policy position before publishing)

### Step 3: Create Internal BAA Eligibility Guide

**Files:**
- Create: `docs/internal/canadian-baa-eligibility-guide.md`

**Description:**
Create internal guidance for sales and security teams. This file is NOT published to the external docs site.

```markdown
# Canadian BAA Eligibility Guide (Internal)

> **Internal Use Only** -- Do not share this document externally.
> Last updated: [DATE]
> Legal review status: [PENDING/APPROVED]

## Quick Decision Tree

When a Canadian company asks about signing a BAA:

1. **Do they handle US PHI?**
   - YES -> Proceed with standard BAA process (Common Paper BAA Standard Terms v1.0)
   - NO -> Continue to question 2

2. **Do they handle Canadian health information (under PHIPA, Law 25, HIA, PIPA)?**
   - YES -> Direct to DPA; note Canadian Privacy Addendum is on the roadmap
   - NO -> Standard DPA is likely sufficient

3. **Do they handle both US PHI and Canadian health information?**
   - YES -> BAA for US PHI component + DPA + note future Canadian Privacy Addendum
   - Escalate to security@vapi.ai for complex cross-border scenarios

## Talk Tracks

### "We want to sign your BAA but we don't have US patients"

> "Our BAA specifically covers US Protected Health Information under HIPAA. Since
> your organization works with Canadian health information rather than US PHI, the
> BAA isn't the right fit. Instead, we recommend our Data Processing Agreement,
> which provides contractual data processing protections. We're also developing a
> dedicated Canadian Privacy Addendum to address provincial health privacy
> requirements specifically -- I can keep you updated on the timeline."

### "We need something that covers PHIPA/Law 25/HIA"

> "We understand the importance of provincial health privacy compliance. Currently,
> our DPA provides baseline data processing protections. We're actively developing a
> Canadian Privacy Addendum that will specifically address provincial requirements
> including [PHIPA/Law 25/HIA as applicable]. In the interim, we also offer Zero
> Data Retention mode and Bring Your Own Storage to help with data residency
> concerns."

### "Our legal team insists on a BAA"

> "I'd recommend connecting our security team directly with your legal team to
> discuss the specific contractual needs. The BAA's HIPAA-specific obligations may
> not align with your Canadian privacy requirements, and we want to make sure we
> provide the right contractual coverage. Let me set up that call."
>
> Escalate to: security@vapi.ai

## Data Residency Talking Points

- Primary infra: AWS US-West-2 (Oregon)
- ZDR mode: No audio/transcript/recording storage on Vapi servers
- BYOS: Customer can use ca-central-1 (Montreal) S3 buckets
- Caveat: Metadata (call logs, config) still in US-West-2
- EU option: AWS eu-central-1 (Frankfurt) available but not Canadian-specific

## Escalation

For complex scenarios involving:
- Cross-border US/Canada health data
- Quebec Law 25 specific requirements (strictest provincial regime)
- Customer legal teams requesting contract modifications
- Regulatory inquiries from Canadian privacy commissioners

Escalate to: security@vapi.ai with subject line "Canadian Compliance Escalation"

## Reference

- External FAQ: [link to published canadian-compliance-faq page]
- Parent initiative: VAPSEC-133 (Canadian Compliance Documentation)
- Vapi DPA: [link to DPA]
- Common Paper BAA Standard Terms v1.0: [link]
```

**Testing:**
- Verify markdown renders correctly
- Confirm file is NOT included in the external docs build
- Review talk tracks with sales and security teams for accuracy

**Dependencies:** Step 1 (legal review), Step 2 (external FAQ link needed for reference)

### Step 4: Update Navigation Configuration

**Files:**
- Modify: `fern/docs.yml`

**Description:**
Add the Canadian Compliance FAQ to the Security & Privacy section in the docs navigation. The implementer should:

1. Read `fern/docs.yml` to understand the current navigation structure
2. Find the security-and-privacy navigation group
3. Add an entry for `canadian-compliance-faq` in an appropriate position (after the existing compliance pages like HIPAA and GDPR)

The exact YAML will depend on the current structure of `docs.yml`, but the entry should follow the same pattern as existing pages in that section.

**Testing:**
- Verify the page appears in the sidebar navigation
- Verify the link resolves correctly
- Verify it does not break existing navigation

**Dependencies:** Step 2 (the page must exist before adding to navigation)

### Step 5: Communicate Deviation to VAPSEC-133

**Files:**
- None (communication step)

**Description:**
Notify the VAPSEC-133 initiative owner that VAPSEC-136 used `fern/security-and-privacy/` for external content instead of the planned `docs/compliance/` path. Recommend that VAPSEC-133 update its planned deliverable paths to match the actual repository conventions:

- `docs/compliance/canadian-compliance-faq.md` -> `fern/security-and-privacy/canadian-compliance-faq.mdx`
- Other VAPSEC-133 external deliverables should similarly target `fern/security-and-privacy/`

**Testing:** N/A (communication step)

**Dependencies:** Step 2

## Testing Strategy

**Content review:**
- Legal counsel reviews all external-facing content for accuracy and risk
- Security team reviews internal guide for completeness
- Sales team reviews talk tracks for usability

**Technical verification:**
- MDX file renders without syntax errors in the docs build
- Navigation entry resolves correctly
- Page appears in search results
- Internal file is excluded from external docs build

**Edge cases:**
- Customer who handles BOTH US PHI and Canadian health data (covered in FAQ and internal guide)
- Quebec Law 25 scenarios (strictest provincial regime, flagged for escalation)
- Customer whose legal team insists on BAA regardless (escalation path provided)

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Legal counsel rejects recommended policy position | Medium | High | Plan includes flexibility -- content can be updated based on legal guidance; policy section is clearly marked as requiring review |
| Customer cannot wait for legal review | Medium | High | Share draft FAQ with customer marked as "subject to final review" via direct communication; do not publish unreviewed content publicly |
| VAPSEC-133 path deviation causes confusion | Low | Low | Step 5 explicitly communicates the deviation and recommends path updates |
| Canadian Privacy Addendum timeline slips | Medium | Medium | FAQ content uses "coming soon" language without specific dates; internal guide directs to security team for timeline updates |
| Provincial law requirements are misstated | Low | High | Legal review step catches inaccuracies; FAQ uses general language rather than specific legal interpretations |

## Dependencies

**External:**
- Legal counsel: Must review and approve policy position before external publication
- Security team (security@vapi.ai): Escalation contact and content reviewer
- VAPSEC-133 initiative: Parent plan alignment and path deviation communication

**Internal prerequisites:**
- Access to `VapiAI/docs` repository with write permissions to `tasker/*` branches
- Understanding of `fern/docs.yml` navigation structure (implementer should read the file)

## Success Criteria

- [ ] Legal counsel has reviewed and approved the policy position on BAA eligibility for Canadian companies
- [ ] External FAQ page is published and accessible at the canonical URL
- [ ] FAQ clearly answers whether Canadian companies without US PHI should sign a BAA
- [ ] FAQ provides actionable alternatives (DPA, future Canadian Privacy Addendum)
- [ ] Internal guide is available to sales and security teams
- [ ] Internal guide includes decision tree, talk tracks, and escalation paths
- [ ] Waiting customer has been unblocked with a clear answer
- [ ] Navigation includes the new FAQ page in the Security & Privacy section
- [ ] VAPSEC-133 team is notified of path deviation
