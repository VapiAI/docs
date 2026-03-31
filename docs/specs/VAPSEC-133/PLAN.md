# Plan: Canadian Privacy Compliance and Data Residency Documentation

## Overview

This plan addresses the need for comprehensive Canadian privacy compliance documentation for Vapi's voice AI platform. A Canadian prospect (via TechComm partnership with 80+ member organizations) has raised 11 specific questions covering PIPEDA/PHIPA compliance, data residency, encryption, retention, access controls, audits, breach notification, pricing, BAA eligibility, cross-border transfers, and sub-processor protections.

Vapi currently holds SOC 2 Type II attestation, operational HIPAA compliance (third-party assessment completed December 2025), and ISO 27001:2022 readiness in progress (Q2 2026 ECD). The existing DPA (finalized January 20, 2026) covers GDPR and includes EU Standard Contractual Clauses but does not explicitly address Canadian privacy legislation (PIPEDA, PHIPA, or Quebec Law 25).

This documentation effort will close critical gaps in Vapi's compliance posture for the Canadian market, unblocking both the immediate TechComm deal and future Canadian enterprise sales.

## Goals

- [ ] Primary: Create customer-facing Canadian compliance FAQ that directly answers all 11 prospect questions
- [ ] Primary: Document Vapi's Canadian data residency options and limitations
- [ ] Secondary: Draft a Canadian Privacy Addendum template for the DPA
- [ ] Secondary: Create an internal compliance playbook for the sales and legal teams

## Complexity Assessment

**Complexity: Complex**

Rationale:
- Cross-functional dependencies (Legal, Compliance/GRC, Infrastructure, Product, Sales, Security Advisory)
- Requires new documentation deliverables (4 documents)
- Involves regulatory analysis across three jurisdictions (federal PIPEDA, Ontario PHIPA, Quebec Law 25)
- Requires stakeholder review and legal sign-off
- Infrastructure assessment needed for data residency options

## Section 1: Research Phase Findings

### 1.1 Canadian Privacy Law Landscape

**PIPEDA (Personal Information Protection and Electronic Documents Act)**
- Federal commercial privacy law applicable to private-sector organizations
- 10 Fair Information Principles governing collection, use, and disclosure of personal information
- Cross-border transfer permitted if adequate protections exist (no strict data localization requirement)
- Breach notification mandatory under PIPEDA since November 2018 (DORS/2018-64)
- Office of the Privacy Commissioner of Canada (OPC) enforces compliance

**PHIPA (Personal Health Information Protection Act, 2004)**
- Ontario-specific legislation for personal health information (PHI)
- Applies to "health information custodians" — doctors, hospitals, pharmacies, long-term care facilities
- Stricter than PIPEDA for health data: requires express consent for most collections
- Electronic health records must meet prescribed security standards
- Health Information Network Providers (HINPs) have additional obligations
- Does NOT have a strict data residalization requirement but OPC guidance discourages unnecessary cross-border transfers of health data

**Quebec Law 25 (Act to modernize legislative provisions as regards the protection of personal information)**
- Effective September 2023 (phased implementation through September 2024)
- Stricter than PIPEDA: mandatory Privacy Impact Assessments (PIAs) for cross-border transfers
- Requires "equivalent protection" analysis before transferring data outside Quebec
- Commission d'acces a l'information du Quebec (CAI) has enforcement authority
- Penalties up to $25M or 4% of worldwide turnover

### 1.2 Vapi's Current Compliance Posture

| Compliance Area | Status | Details |
|---|---|---|
| SOC 2 Type II | Completed | Attestation available under NDA |
| HIPAA | Operationally Compliant | Third-party assessment completed Dec 2025 |
| ISO 27001:2022 | In Progress | Q2 2026 ECD |
| GDPR | Covered in DPA | EU SCCs Module 2 and Module 3 |
| PIPEDA | Not Explicitly Covered | DPA does not reference PIPEDA |
| PHIPA | Not Explicitly Covered | No Ontario-specific provisions |
| Quebec Law 25 | Not Explicitly Covered | No Quebec-specific PIA process |

### 1.3 Infrastructure and Data Residency

**Current Infrastructure:**
- Primary: AWS US-West-2 (Oregon) — default for all customers
- EU Deployment: AWS eu-central-1 (Frankfurt) — available for EU customers
- Canadian Data Center: **None currently available**

**Data Residency Workarounds for Canada:**
1. **Zero Data Retention (ZDR) Mode**: Prevents persistent storage of call data — data processed in-memory only
2. **BYOS (Bring Your Own Storage)**: Customers can configure S3 buckets in AWS ca-central-1 (Montreal) for call recordings, transcripts, and logs
3. **Metadata Consideration**: Even with ZDR/BYOS, some operational metadata (API logs, billing data) may reside in US-West-2

### 1.4 Existing Documentation Inventory

| Document | Location | Canadian Coverage |
|---|---|---|
| Data Processing Agreement (DPA) | SafeBase Trust Center | No Canadian-specific terms |
| BAA (Business Associate Agreement) | CommonPaper (HIPAA add-on) | US-focused, no Canadian equivalent |
| Privacy Policy | vapi.ai/privacy | Generic, no Canadian section |
| Security Overview | security.vapi.ai | General security posture |
| Sub-processor List | SafeBase Trust Center | No Canadian compliance attestations |
| SOC 2 Type II Report | Available under NDA | General controls, no Canadian focus |

## Section 2: Gap Analysis

### Gap Matrix

| # | Customer Question | Current Coverage | Gap Identified | Severity |
|---|---|---|---|---|
| 1 | PIPEDA/PHIPA in DPA | DPA covers GDPR only | No Canadian privacy law references in DPA | High |
| 2 | Canadian data residency | US-West-2 default, no CA region | No Canadian data center; workarounds exist (ZDR, BYOS) | High |
| 3 | Encryption standards and key mgmt | AES-256 at rest, TLS 1.2+ in transit; AWS KMS | Keys managed in US regions | Medium |
| 4 | Data retention and deletion | Configurable retention; ZDR available | Documented but not Canadian-specific | Low |
| 5 | Internal access controls for PHI | RBAC, MFA, audit logging | Documented in SOC 2 but not in customer-facing Canadian docs | Low |
| 6 | Third-party audits (SOC 2 Type II) | Completed, available under NDA | Adequate — needs Canadian-specific FAQ entry | Low |
| 7 | Breach notification process | Exists per SOC 2 controls | Not mapped to PIPEDA/PHIPA notification timelines | Medium |
| 8 | HIPAA add-on covers Canadian needs? | $1,000/month HIPAA add-on exists | No Canadian-specific pricing or package | Medium |
| 9 | BAA for Canadian companies without US PHI | BAA available via HIPAA add-on | No Canadian equivalent agreement (e.g., data custodian agreement) | High |
| 10 | Cross-border data transfer compliance | EU SCCs in DPA | No Canadian cross-border transfer documentation | High |
| 11 | Sub-processor contractual protections | Sub-processor list on SafeBase | Canadian compliance status of sub-processors not documented | High |

### Summary of Gaps

**6 significant gaps identified:**
1. **No Canadian-specific privacy law coverage** in DPA or any agreement
2. **No Canadian data centers** (workarounds exist but need documentation)
3. **No Canadian-specific agreement** template (BAA equivalent for Canadian health data)
4. **Encryption keys not in Canada** (AWS KMS keys in US regions)
5. **No cross-border data transfer documentation** for Canada
6. **Sub-processor Canadian compliance not documented**

## Section 3: Documentation Deliverables

### Deliverable 1: Canadian Privacy Addendum to DPA
- **Purpose**: Legal addendum extending the existing DPA to cover PIPEDA, PHIPA, and Quebec Law 25
- **Audience**: Legal teams, compliance officers, procurement
- **Owner**: Legal team (with Compliance/GRC input)
- **Priority**: High
- **Estimated effort**: 2-3 weeks (requires legal review)

### Deliverable 2: Canadian Data Residency Guide
- **Purpose**: Technical document explaining data flow, residency options, and workarounds for Canadian customers
- **Audience**: Technical buyers, security teams, IT administrators
- **Owner**: Infrastructure/Engineering team (with Product input)
- **Priority**: High
- **Estimated effort**: 1-2 weeks

### Deliverable 3: Canadian Compliance FAQ
- **Purpose**: Direct answers to the 11 prospect questions; immediately shareable with sales team
- **Audience**: Prospects, sales team, customer success
- **Owner**: Compliance/GRC team (with Legal review)
- **Priority**: Highest (unblocks immediate deal)
- **Estimated effort**: 1 week

### Deliverable 4: Internal Canadian Compliance Playbook
- **Purpose**: Internal guide for sales, legal, and customer success teams handling Canadian deals
- **Audience**: Internal teams only
- **Owner**: Compliance/GRC team
- **Priority**: Medium
- **Estimated effort**: 1-2 weeks

## Section 4: Content Outlines

### Deliverable 1: Canadian Privacy Addendum

1. **Definitions and Interpretation**
   - Canadian Personal Information (per PIPEDA)
   - Personal Health Information (per PHIPA)
   - Quebec Personal Information (per Law 25)
   - Health Information Custodian
   - Applicable Canadian Privacy Laws

2. **Scope and Application**
   - When the addendum applies (Canadian customers or Canadian data subjects)
   - Relationship to base DPA
   - Precedence in case of conflict

3. **PIPEDA Compliance Provisions**
   - Accountability principle implementation
   - Consent mechanisms
   - Purpose limitation
   - Cross-border transfer safeguards
   - Individual access and correction rights
   - Breach notification (alignment with PIPEDA timelines)

4. **PHIPA-Specific Provisions** (where applicable)
   - Health information custodian obligations
   - Electronic health record requirements
   - Agent obligations under PHIPA
   - Express consent requirements

5. **Quebec Law 25 Provisions** (where applicable)
   - Privacy Impact Assessment commitment
   - Equivalent protection analysis
   - Data localization considerations
   - CAI notification requirements

6. **Data Residency Commitments**
   - Available deployment regions
   - ZDR mode description
   - BYOS configuration options
   - Metadata handling

7. **Sub-processor Management**
   - Canadian compliance requirements for sub-processors
   - Notification of sub-processor changes
   - Customer objection rights

### Deliverable 2: Canadian Data Residency Guide

1. **Architecture Overview**
   - Vapi platform data flow diagram
   - Data categories and classification
   - Processing vs. storage distinction

2. **Default Configuration (US-West-2)**
   - What data resides in US
   - Implications for Canadian compliance

3. **Canadian Data Residency Options**
   - Zero Data Retention (ZDR) mode — configuration steps, limitations, what is/isn't retained
   - Bring Your Own Storage (BYOS) — S3 bucket setup in ca-central-1, data types covered
   - Combined ZDR + BYOS approach

4. **Encryption and Key Management**
   - Encryption at rest (AES-256)
   - Encryption in transit (TLS 1.2+)
   - AWS KMS key management — current US-based, options for customer-managed keys in ca-central-1
   - Key rotation policies

5. **Cross-Border Data Flow Analysis**
   - Data types that cross borders (even with ZDR/BYOS)
   - Metadata and operational data
   - Safeguards in place for cross-border transfers

6. **Compliance Mapping**
   - How each configuration maps to PIPEDA requirements
   - PHIPA alignment assessment
   - Quebec Law 25 PIA considerations

### Deliverable 3: Canadian Compliance FAQ

**Format**: Question-and-answer, directly mapping to the 11 prospect questions

1. Does your DPA cover PIPEDA and PHIPA?
2. Can you guarantee that data will remain within Canada?
3. What encryption standards do you use and how are keys managed?
4. What are your data retention and deletion policies?
5. How do you control internal access to PHI?
6. Have you undergone third-party security audits?
7. What is your breach notification process?
8. Does the HIPAA add-on ($1,000/month) cover Canadian requirements?
9. Can Canadian companies sign a BAA even if they don't handle US patient data?
10. How do you comply with Canadian cross-border data transfer requirements?
11. What contractual protections exist with sub-processors?

Each answer will include:
- Direct response to the question
- Current status (what Vapi offers today)
- Planned enhancements (with timelines where applicable)
- Relevant documentation links

### Deliverable 4: Internal Canadian Compliance Playbook

1. **Canadian Market Overview**
   - Key regulations (PIPEDA, PHIPA, Quebec Law 25)
   - Common customer concerns
   - Competitive landscape

2. **Pre-Sales Checklist**
   - Questions to ask Canadian prospects
   - Data classification assessment
   - Province-specific requirements check
   - Healthcare vs. non-healthcare path

3. **Deal Configuration Guide**
   - When to enable ZDR
   - When to recommend BYOS
   - Pricing implications (HIPAA add-on applicability)
   - Agreement selection (DPA + Canadian Addendum vs. standalone)

4. **Objection Handling**
   - "We need data to stay in Canada" — response framework
   - "We need PIPEDA explicitly in the agreement" — response framework
   - "We can't use a US-based processor" — response framework

5. **Escalation Procedures**
   - When to involve Legal
   - When to involve Compliance/GRC
   - When to involve Infrastructure/Engineering
   - SLA for responses

## Section 5: Dependencies on Internal Teams

### Legal Team
- **Required for**: Deliverable 1 (Canadian Privacy Addendum), review of Deliverable 3 (FAQ)
- **Specific asks**:
  - Draft Canadian Privacy Addendum language
  - Review cross-border transfer analysis for legal accuracy
  - Confirm BAA applicability for Canadian entities
  - Review sub-processor contractual obligations under Canadian law
- **Timeline**: Needed in Week 1-2

### Compliance/GRC Team
- **Required for**: Deliverables 2, 3, 4 (primary owner of FAQ and Playbook)
- **Specific asks**:
  - PIPEDA/PHIPA gap analysis validation
  - Quebec Law 25 PIA process assessment
  - Breach notification process mapping to Canadian timelines
  - Sub-processor compliance status documentation
- **Timeline**: Needed in Week 1-3

### Infrastructure/Engineering Team
- **Required for**: Deliverable 2 (Data Residency Guide)
- **Specific asks**:
  - Validate ZDR mode data flow documentation
  - Confirm BYOS capabilities and limitations for ca-central-1
  - Assess feasibility of Canadian KMS key management
  - Document metadata that persists outside ZDR/BYOS
  - Provide accurate architecture diagrams
- **Timeline**: Needed in Week 1-2

### Product Team
- **Required for**: Deliverable 2 (Data Residency Guide), Deliverable 4 (Playbook)
- **Specific asks**:
  - Confirm ZDR feature scope and roadmap
  - Confirm BYOS feature scope and roadmap
  - Canadian region deployment timeline (if any)
  - Pricing structure for Canadian compliance package
- **Timeline**: Needed in Week 1

### Sales Team
- **Required for**: Deliverable 3 (FAQ), Deliverable 4 (Playbook)
- **Specific asks**:
  - Validate FAQ answers against prospect expectations
  - Review playbook for practical sales applicability
  - Identify additional objections or questions from Canadian prospects
  - Confirm TechComm deal timeline and urgency
- **Timeline**: Needed in Week 2-3

### Security Advisory
- **Required for**: All deliverables (review)
- **Specific asks**:
  - Review encryption and key management documentation
  - Validate access control descriptions
  - Confirm SOC 2 Type II scope covers Canadian-relevant controls
  - Review breach notification process documentation
- **Timeline**: Needed in Week 2-3

## Section 6: Stakeholder Review Plan

### Review Phases

**Phase 1: Internal Draft Review (Week 1)**
- Compliance/GRC team creates initial drafts of Deliverables 2, 3, 4
- Legal team begins drafting Deliverable 1
- Infrastructure team provides technical input for Deliverable 2

**Phase 2: Cross-Functional Review (Week 2)**
- All deliverables circulated to relevant teams
- Each team has 3 business days for review
- Comments collected via Google Docs or Linear issue threads
- Focus: factual accuracy, completeness, consistency

**Phase 3: Legal and Executive Sign-Off (Week 3)**
- Legal team provides final approval on all customer-facing documents
- VP of Engineering or CTO reviews technical claims
- Head of Compliance provides final compliance sign-off
- CEO/COO awareness for new market commitment implications

**Phase 4: Publication and Distribution (Week 3)**
- Approved FAQ shared with sales team for immediate use with TechComm prospect
- Data Residency Guide published to documentation site
- Canadian Privacy Addendum added to agreement templates
- Internal Playbook distributed to sales, legal, and customer success

### Approval Chain

| Deliverable | Primary Reviewer | Secondary Reviewer | Final Approver |
|---|---|---|---|
| Canadian Privacy Addendum | Legal Counsel | Compliance/GRC Lead | General Counsel |
| Data Residency Guide | Infrastructure Lead | Security Advisory | VP Engineering |
| Canadian Compliance FAQ | Compliance/GRC Lead | Sales Lead | Head of Compliance |
| Internal Playbook | Sales Lead | Legal Counsel | Head of Compliance |

### Timeline Summary

| Week | Activities |
|---|---|
| Week 1 | Draft all deliverables; collect technical input from Infrastructure and Product |
| Week 2 | Cross-functional review; iterate based on feedback; begin legal review |
| Week 3 | Final approvals; publish FAQ to unblock TechComm deal; publish remaining docs |

### Communication Plan

- **Kick-off**: Slack announcement in #compliance channel tagging all stakeholders
- **Daily standups**: 15-minute sync during Week 1 drafting phase
- **Review reminders**: Automated Linear reminders for review deadlines
- **Completion**: All-hands announcement when Canadian compliance documentation is live

## Implementation Steps

### Step 1: Research Validation and Gap Confirmation
**Files:**
- Create: None (research phase)
- Modify: None

**Description:**
Validate the research findings in Section 1 with the Compliance/GRC and Legal teams. Confirm that the gap analysis in Section 2 is accurate and complete. Identify any additional Canadian provincial requirements beyond PIPEDA, PHIPA, and Quebec Law 25 that may be relevant.

**Testing:**
- Gap matrix reviewed and confirmed by Legal and Compliance/GRC
- No missing regulatory requirements

**Dependencies:** Legal team availability, Compliance/GRC team availability

### Step 2: Draft Documentation Deliverables
**Files:**
- Create: `docs/compliance/canadian-compliance-faq.md`
- Create: `docs/compliance/canadian-data-residency-guide.md`
- Create: `docs/compliance/canadian-privacy-addendum.md`
- Create: `docs/internal/canadian-compliance-playbook.md`

**Description:**
Using the content outlines in Section 4, draft all four documentation deliverables. Begin with Deliverable 3 (FAQ) as it is the highest priority and directly unblocks the TechComm deal. Coordinate with Infrastructure/Engineering for technical accuracy in Deliverable 2, and with Legal for Deliverable 1.

**Testing:**
- Each document follows the content outline completely
- All 11 prospect questions answered in the FAQ
- Technical claims validated by Infrastructure team

**Dependencies:** Step 1 completion, Infrastructure team input

### Step 3: Cross-Functional Review Cycle
**Files:**
- Modify: All deliverables from Step 2 (based on review feedback)

**Description:**
Execute the review plan from Section 6. Circulate all deliverables to the designated reviewers, collect feedback within 3 business days, and iterate. Track review status in Linear.

**Testing:**
- All reviewers have provided sign-off
- No outstanding comments or objections
- Legal has approved all customer-facing language

**Dependencies:** Step 2 completion, reviewer availability

### Step 4: Publication and Distribution
**Files:**
- Modify: SafeBase Trust Center configuration (add Canadian docs)
- Modify: Documentation site navigation (add Canadian section)

**Description:**
Publish approved documentation to the appropriate channels. Update the SafeBase Trust Center with the Canadian Privacy Addendum. Share the FAQ with the sales team for immediate use. Distribute the internal playbook.

**Testing:**
- All documents accessible at expected URLs
- Sales team confirms FAQ is usable with TechComm prospect
- Internal playbook accessible to all relevant teams

**Dependencies:** Step 3 completion (all approvals obtained)

## Testing Strategy

**Document Review:**
- Each deliverable reviewed by at least 2 subject matter experts
- Legal review for all customer-facing documents
- Technical review for all infrastructure/data flow claims

**Accuracy Validation:**
- Cross-reference all regulatory citations with source legislation
- Validate all Vapi feature descriptions with Product and Engineering
- Confirm sub-processor list and compliance status is current

**Completeness Check:**
- All 11 prospect questions answered directly in FAQ
- All 6 identified gaps addressed across deliverables
- All content outline sections populated

**Stakeholder Acceptance:**
- Sales team confirms FAQ meets prospect needs
- Legal team confirms addendum is contractually sound
- Compliance/GRC confirms regulatory accuracy

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Legal team delays due to competing priorities | Medium | High | Escalate early; provide pre-drafted language for review |
| Infrastructure team cannot confirm Canadian KMS feasibility | Medium | Medium | Document current state honestly; note as planned enhancement |
| Quebec Law 25 requires PIA that Vapi hasn't conducted | High | Medium | Acknowledge gap; commit to PIA timeline in documentation |
| TechComm deal timeline shorter than 3-week plan | Medium | High | Prioritize FAQ (Deliverable 3) for Week 1 delivery |
| Sub-processor (Twilio/Telnyx) lacks Canadian compliance documentation | Medium | Medium | Contact sub-processors directly; document current status |
| Canadian data center demand exceeds BYOS/ZDR workaround acceptance | Low | High | Document roadmap for Canadian region; include in Product feedback |
| Regulatory requirements change during documentation period | Low | Low | Build review cadence into documentation maintenance plan |

## Success Criteria

- [ ] All 11 prospect questions answered with accurate, reviewed responses
- [ ] Canadian Privacy Addendum drafted and approved by Legal
- [ ] Data Residency Guide published with accurate technical details
- [ ] FAQ delivered to sales team within 1 week of plan approval
- [ ] All 4 deliverables published within 3 weeks of plan approval
- [ ] All 6 identified gaps have documented mitigations or timelines
- [ ] TechComm deal progresses past compliance review stage
- [ ] Internal playbook adopted by sales team for Canadian prospects