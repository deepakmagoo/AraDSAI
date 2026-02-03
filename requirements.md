# Regulatory Compliance ICH/CDSCO Co-Pilot - Requirements Document

## The Problem: What specific gap are you closing?

Indian pharmaceutical and biotech companies face a critical bottleneck in regulatory documentation. Life-sciences documents—clinical protocols, study reports, drug labels, SOPs, and submission dossiers—must comply with multiple overlapping regulatory standards:

- **ICH Guidelines** (International Council for Harmonisation)
- **CDSCO Guidelines** (Central Drugs Standard Control Organisation - India)

**The Current Reality:**
- Manual compliance checking takes **hours to days** per document
- Requires deep regulatory expertise that small-to-mid Indian firms often lack
- Error-prone process leads to submission delays, regulatory queries, and audit failures
- Limited adherence to ICH guidelines in other existing solutions
- Small gaps or omissions result in costly rejections and rework
- Regulatory teams spend 60-70% of their time on repetitive cross-referencing

**The Gap We're Closing:**
- Lack of niche AI-powered tool that focuses specifically on **public regulatory standards** for the Indian life-sciences sector, providing explainable, evidence-backed compliance checking with full audit traceability.

---

## The User: Various personas and thier pain statement

**1. Regulatory Affairs Managers**
- Work in Indian pharma/biotech companies
- Responsible for submission preparation and regulatory responses
- Pain: Manual clause checking across multiple guidelines, interpretation errors

**2. Quality Assurance (QA) Leads**
- Ensure documentation meets compliance standards before audits
- Pain: Lack of traceability, inconsistent reviews, audit preparation stress

**3. Clinical Research Organizations (CRO) Specialists**
- Prepare protocols, clinical study reports, and informed consent documents
- Pain: Repeated rework for different regulatory authorities

**4. Small-to-Medium Pharma Founders**
- Lack large regulatory teams but need submission-ready documentation
- Pain: Cannot afford expensive compliance consultants or enterprise tools

**5. Regulatory Consultants**
- Independent consultants serving multiple pharma clients
- Responsible for preparing submission dossiers and regulatory strategies
- Pain: Need to scale services without proportional increase in manual effort

**6. Auditors (Internal & External)**
- Conduct compliance audits and pre-submission reviews
- Responsible for verifying documentation meets regulatory standards
- Pain: Time-consuming manual verification, need for complete audit trails

**7. Academic Researchers & Clinical Trial Coordinators**
- Conduct investigator-initiated trials at academic institutions
- Responsible for protocol development and ethics submissions
- Pain: Limited regulatory expertise, need for educational guidance

**8. Documentation Writers**
- Medical writers preparing regulatory documents
- Responsible for creating compliant documentation for multiple clients
- Pain: Keeping up-to-date with changing regulations across jurisdictions

---

## The AI Edge: Why is AI the essential tool for this solution?

AI is not optional—it's the **only viable solution** for this problem:

### 1. Unstructured Document Complexity
- Regulatory documents are PDFs, scanned images, Word files with complex layouts
- Require **OCR + NLP** to extract text, tables, and semantic structure
- Human keyword search misses contextual compliance requirements

### 2. Semantic Understanding Required
- Compliance is not about keyword matching/lexical style search, it's about **intent and context/semantic search**
- Example: "primary endpoint definition" can be phrased 50+ ways
- AI embeddings capture semantic similarity across regulatory language variations

### 3. Knowledge-Intensive Cross-Referencing
- Checking a single protocol against ICH E6 involves comparing against **200+ pages** of guidance
- Requires **Retrieval-Augmented Generation (RAG)** to:
  - Find relevant clauses across thousands of pages
  - Ground AI responses in actual regulatory text
  - Provide exact citations to eliminate hallucinations

### 4. Scale & Consistency
- Manual reviews vary by reviewer expertise and fatigue, AI based automated review reduces maker-checker time
- AI provides **consistent, repeatable** checks across unlimited documents
- Learns from corrections via human-in-the-loop feedback

### 5. Explainability for Regulatory Trust
- Every finding must be **traceable to source text** for audit compliance
- AI can link document sections → regulatory clauses → suggested fixes with full provenance

---

## The Success Metric:

### Quantitative Metrics

**Accuracy**
- **≥85% precision** in detecting true compliance gaps (validated against expert reviews)
- **≥80% recall** in identifying all critical non-conformities
- **<15% false positive rate** to maintain user trust

**Efficiency**
- **50-60% reduction** in document review time (baseline: 4-6 hours → target: 2-3 hours)
- **3x faster** compliance report generation

**Quality Impact**
- **30% reduction** in regulatory queries post-submission (measured over 6 months)
- **90%+ of processed documents** pass simulated audits without major revisions

**Adoption**
- **70%+ user satisfaction** score in beta testing
- **80% of findings** accepted by users without modification

### Qualitative Metrics
- **90% explainability coverage**: Every finding includes source citation
- **Audit-ready outputs**: Exportable compliance reports with timestamps and evidence trails
- **User confidence**: Teams feel empowered to submit faster with AI-backed validation

<!-- ### Hackathon Demo Success
- Upload a sample clinical protocol
- Receive **5-10 actionable findings** with evidence citations in **<2 minutes**
- Show one end-to-end remediation: finding → evidence → suggested fix → export report -->

---

## The Features: The core functionality that delivers value

### MVP Features (Must-Have)

**F1: Intelligent Document Ingestion**
- Upload PDF, DOCX, or scanned documents
- OCR for scanned/image-based files
- Automatic section detection (title, methods, endpoints, safety monitoring, etc.)

**F2: Regulatory Knowledge Base**
- Pre-indexed public guidelines: ICH (E6, E3, Q7-Q14), CDSCO circulars, FDA guidances
- Versioned clause library with metadata (effective dates, applicability)
- Semantic search across 1000+ pages of regulatory text

**F3: Compliance Analysis Engine**
- Natural language queries: "Does this protocol meet ICH E6 informed consent requirements?"
- Automated checklist execution (e.g., "Run ICH Q10 quality system check")
- Clause-level mapping: document section ↔ regulatory requirement

**F4: Explainable Findings**
- Each finding shows:
  - **Document excerpt** (highlighted problematic text)
  - **Regulatory clause** (exact guideline text with citation)
  - **Gap explanation** (what's missing or incorrect)
  - **Confidence score** (High/Medium/Low)
  - **Suggested remediation** (AI-generated compliant text)

**F5: Audit-Ready Reporting**
- Downloadable compliance report (PDF/CSV)
- Timestamped audit trail (who checked what, when)
- Evidence package: all citations and source links
- Risk-prioritized findings (Critical/Major/Minor)

**F6: Interactive Review Interface**
- Side-by-side view: user document | regulatory text
- Accept/reject/modify AI suggestions
- Inline editing with tracked changes

**F7: Multi-Language Support**
- Translation of documents into local language for ease of readability

### Advanced Features

**F8: Batch Document Processing**
- Upload ZIP of multiple documents
- Consolidated dashboard with risk scores
- Bulk export of compliance reports

**F9: Continuous Compliance Monitoring**
- Alert users when guidelines are updated
- Re-scan existing documents against new standards
- Version comparison reports

**F10: Collaborative Workflows**
- Role-based access (Admin, Maker, Checker, Reviewer, Viewer)
- Team comments and resolution tracking
- Integration with document management systems and learning management systems

**F11: Learning & Improvement**
- Human-in-the-loop corrections feed back to improve retrieval
- Custom rule creation for company-specific standards
- Analytics & Adoption dashboard: most common gaps, time savings

---

## Publicly Available Datasets

### Primary Regulatory Sources

**ICH Guidelines**
- Source: [ICH Guidelines](https://www.ich.org/page/ich-guidelines),  [ICH eCTD](https://www.ich.org/page/ich-electronic-common-technical-document-ectd-v40)
- Coverage: Global gold standard as guidlines for Quality (Q1-Q14), Efficacy (E1-E20), Safety (S1-S12), Multidisciplinary (M1-M11) and eCTD
- Format: Public PDFs
- Use: Rich unstructured + semi‑structured regulatory text for training policy‑aware, guideline‑reasoning models. It also represents international harmonization principles that influence CDSCO

**CDSCO Resources**
- Source: [CDSCO](https://cdsco.gov.in/opencms/opencms/en/Acts-and-rules/Guidance-documents/)
- Coverage: Public guidance documents on clinical trials, GMP, IVD stability, quality monitoring, biologicals, export NOCs, port regulations, and good distribution practices.
- Format: PDFs, government notifications
- Use: Essential for aligning a model to India’s regulatory framework

**FDA Study Data Standards Resources (Structured Regulatory Datasets)**
- Source: [FDA](https://www.fda.gov/industry/fda-data-standards-advisory-board/study-data-standards-resources)
- Coverage: Richest source of structured data aligned with ICH expectations, especially for ICH E6 (GCP), E2E (PV), M4 (CTD), and RWD integration
- Format: PDF
- Use: To train structured reasoning for submissions, CTD, PV, GCP compliance

---

## Detailed Functional Requirements

### Epic 1: Document Upload & Preprocessing

**US-1.1: Single Document Upload**
- **As a** Regulatory Specialist
- **I want to** upload a protocol PDF via drag-and-drop or file picker
- **So that** the Co-Pilot can analyze it for compliance
- **Acceptance Criteria:**
  - Supports PDF, DOCX, DOC formats up to 50MB
  - Shows upload progress indicator
  - Validates file type and size before processing
  - Returns error message for unsupported formats

**US-1.2: Batch Document Upload**
- **As a** QA Manager
- **I want to** upload a ZIP containing multiple documents
- **So that** I can review compliance across an entire submission package
- **Acceptance Criteria:**
  - Accepts ZIP files up to 200MB
  - Extracts and processes each document individually
  - Displays processing status for each file
  - Generates consolidated compliance dashboard

**US-1.3: OCR for Scanned Documents**
- **As a** User with legacy scanned PDFs
- **I want to** upload image-based documents
- **So that** the system can extract text and check compliance
- **Acceptance Criteria:**
  - Detects scanned/image-based PDFs automatically
  - Applies OCR with ≥95% text accuracy
  - Preserves document structure (headings, tables)
  - Flags low-confidence OCR regions for review

### Epic 2: Regulatory Knowledge Base Management

**US-2.1: Guideline Ingestion**
- **As a** System Administrator
- **I want to** import official guideline PDFs and map them to named standards
- **So that** users can check documents against current regulations
- **Acceptance Criteria:**
  - Bulk import of ICH/CDSCO/FDA PDFs
  - Automatic clause extraction and indexing
  - Metadata tagging (standard name, version, effective date)
  - Searchable clause library

**US-2.2: View Canonical Clauses**
- **As a** User
- **I want to** view the exact regulatory text referenced in a finding
- **So that** I can verify the AI's interpretation
- **Acceptance Criteria:**
  - Click citation to open source guideline
  - Highlights relevant clause in context
  - Shows guideline metadata (version, page number)
  - Provides download link to full guideline PDF

### Epic 3: Compliance Analysis

**US-3.1: Natural Language Compliance Query**
- **As a** Regulatory Specialist
- **I want to** ask "Is the primary endpoint definition compliant with ICH E6?"
- **So that** I get an evidence-backed answer without manual searching
- **Acceptance Criteria:**
  - Accepts free-text questions
  - Returns answer with confidence score
  - Highlights relevant document sections
  - Cites specific regulatory clauses
  - Completes query in <30 seconds

**US-3.2: Automated Checklist Execution**
- **As a** QA User
- **I want to** run a predefined compliance checklist (e.g., "ICH E6 GCP Protocol Requirements")
- **So that** I receive a comprehensive gap analysis
- **Acceptance Criteria:**
  - Pre-built checklists for common standards
  - Checks all items automatically
  - Prioritizes findings by risk (Critical/Major/Minor)
  - Shows completion percentage and pass/fail status

**US-3.3: Risk-Prioritized Findings**
- **As a** Regulatory Manager
- **I want to** see compliance issues ranked by severity
- **So that** I can address critical gaps first
- **Acceptance Criteria:**
  - Risk scoring algorithm (based on regulatory impact)
  - Color-coded findings (Red/Yellow/Green)
  - Sortable/filterable findings list
  - Summary statistics (X critical, Y major, Z minor issues)

### Epic 4: Explainability & Remediation

**US-4.1: Evidence-Backed Findings**
- **As an** Auditor
- **I want to** see the exact guideline text, matched document sentence, and gap explanation
- **So that** I can verify the AI's reasoning
- **Acceptance Criteria:**
  - Three-column view: Document | Regulatory Text | Analysis
  - Exact quote from guideline with citation
  - Similarity score or matching logic explanation
  - Link to full guideline source

**US-4.2: AI-Suggested Remediation**
- **As a** User
- **I want to** receive suggested compliant text for each finding
- **So that** I can quickly fix issues without manual rewriting
- **Acceptance Criteria:**
  - Generates context-aware suggested text
  - Preserves document style and tone
  - Shows tracked changes (redline format)
  - Allows accept/reject/edit actions

**US-4.3: Downloadable Audit Trail**
- **As a** Compliance Officer
- **I want to** export a complete audit report with all findings and evidence
- **So that** I can submit it to regulators or auditors
- **Acceptance Criteria:**
  - PDF export with company branding
  - CSV export for data analysis
  - Includes: timestamp, user, document, findings, citations, actions taken
  - Digitally signable for authenticity

### Epic 5: Team Collaboration & Administration

**US-5.1: User Role Management**
- **As an** Admin
- **I want to** invite team members and assign roles (Admin/Reviewer/Viewer)
- **So that** I can control access and maintain security
- **Acceptance Criteria:**
  - Email invitation workflow
  - Three role types with defined permissions
  - User activity logging
  - Ability to revoke access

**US-5.2: Batch Processing Dashboard**
- **As a** Project Lead
- **I want to** view status of all documents in a submission package
- **So that** I can track progress and identify bottlenecks
- **Acceptance Criteria:**
  - Visual dashboard with document cards
  - Status indicators (Pending/Processing/Complete/Failed)
  - Aggregate compliance score
  - Export batch report

---

## AI Features Specification

### AI-1: OCR & Layout Analysis
- **Technology:** Amazon Textract or equivalent
- **Purpose:** Extract text, tables, and structure from scanned PDFs
- **Output:** Structured text with section headings, paragraphs, tables

### AI-2: Named Entity Recognition (NER)
- **Technology:** Amazon Comprehend Medical + custom models
- **Purpose:** Identify drugs, doses, endpoints, study populations, adverse events
- **Output:** Tagged entities with confidence scores

### AI-3: Semantic Embeddings & Vector Search
- **Technology:** Amazon Bedrock (Titan Embeddings) or SageMaker
- **Purpose:** Convert text chunks to dense vectors for similarity search
- **Output:** Top-K most relevant regulatory clauses for each document section

### AI-4: Retrieval-Augmented Generation (RAG)
- **Technology:** Amazon Bedrock (Claude) + vector database
- **Purpose:** Ground LLM responses in retrieved regulatory text to prevent hallucinations
- **Output:** Evidence-backed compliance findings with citations

### AI-5: Compliance Rule Engine
- **Technology:** Deterministic logic + NLP extractions
- **Purpose:** Encode specific checklist items (e.g., "informed consent must include X")
- **Output:** Pass/fail results for rule-based checks

### AI-6: Generative Remediation
- **Technology:** Amazon Bedrock (Claude)
- **Purpose:** Generate suggested compliant text based on regulatory requirements
- **Output:** Context-aware text suggestions in document style

### AI-7: Confidence Scoring
- **Technology:** Ensemble of similarity scores + model uncertainty
- **Purpose:** Flag low-confidence findings for human review
- **Output:** Confidence level (High/Medium/Low) for each finding

### AI-8: Human-in-the-Loop Learning
- **Technology:** Feedback loop to retrieval/ranking models
- **Purpose:** Improve accuracy based on user corrections
- **Output:** Updated retrieval weights and ranking models

---

## Target Users Summary

| User Type | Organization Size | Primary Need | Key Pain Point |
|-----------|------------------|--------------|----------------|
| Regulatory Affairs Manager | Mid-to-Large Pharma | Submission preparation | Manual cross-checking time |
| QA Documentation Specialist | All sizes | Audit readiness | Inconsistent reviews |
| CRO Regulatory Specialist | CROs | Multi-authority compliance | Repeated rework |
| Small Pharma Founder | Startups | Cost-effective compliance | Lack of expertise |
| Regulatory Consultant | Independent | Client deliverables | Scalability limits |

**Geographic Focus:** Indian pharmaceutical hubs (Hyderabad, Mumbai, Bangalore, Ahmedabad)

**Industry Verticals:** Pharmaceuticals, Biotechnology, Medical Devices, Clinical Research Organizations

---

## Success Criteria Summary

**For Hackathon Judges:**
- ✅ Clear problem with measurable impact
- ✅ Well-defined user personas
- ✅ AI is essential, not optional
- ✅ Quantitative success metrics defined
- ✅ Comprehensive feature set with MVP scope
- ✅ Public datasets identified and accessible
- ✅ Detailed user stories with acceptance criteria
- ✅ Explainability and trust built into design

**For End Users:**
- ✅ Saves 50%+ of compliance review time
- ✅ Reduces regulatory queries by 30%
- ✅ Provides audit-ready documentation
- ✅ Builds confidence in submission quality
- ✅ Accessible to small teams without deep expertise
