# Regulatory Compliance Co-Pilot - Design Document

## High-Level Architecture: The bird's-eye view of entire system

### Architecture Overview

The Regulatory Compliance Co-Pilot is built as a **serverless, event-driven, cloud-native application** on AWS. The architecture follows a **Retrieval-Augmented Generation (RAG) pattern** to ensure AI responses are grounded with authoritative regulatory text and company's SOP eliminating hallucinations and providing full audit traceability.

### Core Architecture Principles

1. **Serverless-First:** Zero infrastructure management, automatic scaling, pay-per-use
2. **Event-Driven:** Asynchronous processing pipelines triggered by user actions
3. **AI-Native:** Deep integration with AWS AI/ML services (Bedrock, Textract, Comprehend)
4. **Security-First:** Encryption at rest/transit, IAM-based access control, audit logging
5. **Explainability-First:** Every AI output includes source citations and confidence scores

### System Architecture Diagram (Conceptual)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER LAYER                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │   React Frontend (AWS Amplify Hosting)                       │  │
│  │   - Document Upload UI                                       │  │
│  │   - Compliance Dashboard                                     │  │
│  │   - Interactive Review Interface                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────────────┐
│                          API LAYER                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │   Amazon API Gateway (REST API)                              │  │
│  │   + Amazon Cognito (Authentication & Authorization)          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATION LAYER                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │   AWS Lambda (Orchestrator Functions)                        │  │
│  │   + AWS Step Functions (Workflow Coordination)               │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      PROCESSING LAYER                                │
│  ┌────────────────────┬────────────────────┬────────────────────┐  │
│  │  Document          │  AI/ML             │  Compliance        │  │
│  │  Processing        │  Services          │  Engine            │  │
│  │                    │                    │                    │  │
│  │  - Textract        │  - Bedrock         │  - Rule Engine     │  │
│  │  - Comprehend      │  - SageMaker       │  - RAG Pipeline    │  │
│  │  - Lambda          │  - Embeddings      │  - Scoring         │  │
│  └────────────────────┴────────────────────┴────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                    │
│  ┌────────────────────┬────────────────────┬────────────────────┐  │
│  │  Object Storage    │  Vector Database   │  Metadata Store    │  │
│  │                    │                    │                    │  │
│  │  Amazon S3         │  Aurora PostgreSQL │  DynamoDB          │  │
│  │  - Raw docs        │  with pgvector     │  - User data       │  │
│  │  - Processed text  │  - Embeddings      │  - Audit logs      │  │
│  │  - Reports         │  - Semantic search │  - Job status      │  │
│  └────────────────────┴────────────────────┴────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    MONITORING & GOVERNANCE                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │   CloudWatch (Metrics, Logs) + CloudTrail (Audit)            │  │
│  │   + X-Ray (Distributed Tracing)                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Major Components: Defined roles for the frontend, backend, and AI services

### 1. Frontend Layer

**Technology:** React.js + TypeScript
**Hosting:** AWS Amplify (CI/CD + Hosting)

**Responsibilities:**
- Document upload interface (drag-and-drop, file picker)
- Real-time processing status updates
- Interactive compliance dashboard with risk-prioritized findings
- Side-by-side document/regulatory text comparison view
- Accept/reject/edit AI suggestions with tracked changes
- Export compliance reports (PDF/CSV)
- User authentication and role-based UI rendering

**Key Features:**
- Responsive design (desktop-first, mobile-friendly)
- WebSocket connection for real-time updates
- Client-side file validation
- Progressive loading for large documents
- Accessibility compliance (WCAG 2.1 AA)

### 2. API Gateway & Authentication

**Technology:** Amazon API Gateway (REST) + Amazon Cognito

**Responsibilities:**
- Expose RESTful endpoints for all frontend operations
- JWT-based authentication via Cognito User Pools
- Rate limiting and throttling (1000 requests/min per user)
- Request validation and transformation
- CORS configuration for frontend domain
- API versioning (/v1/...)

### 3. Orchestration Layer

**Technology:** AWS Lambda (Python 3.11) + AWS Step Functions

**Lambda Functions:**

**a) Upload Handler (`upload-handler`)**
- Validates uploaded files (type, size, virus scan)
- Generates pre-signed S3 URLs for secure upload
- Creates job record in DynamoDB
- Triggers document processing pipeline

**b) Document Processor (`document-processor`)**
- Coordinates Textract OCR
- Chunks extracted text semantically
- Invokes NER extraction
- Stores processed data in S3 and metadata in DynamoDB

**c) Compliance Analyzer (`compliance-analyzer`)**
- Receives compliance check requests
- Orchestrates RAG pipeline
- Executes rule-based checks
- Aggregates findings and generates report

**d) Report Generator (`report-generator`)**
- Formats findings into PDF/CSV
- Includes citations and evidence
- Stores report in S3
- Returns signed URL to frontend

**Step Functions Workflows:**

**Workflow 1: Document Ingestion Pipeline**
```
Start → Validate Upload → OCR (Textract) → Text Extraction → 
Chunking → NER Extraction → Embedding Generation → 
Index to Vector DB → Update Status → End
```

**Workflow 2: Compliance Analysis Pipeline**
```
Start → Load Document → For Each Section:
  → Retrieve Similar Clauses (Vector Search) →
  → Run Rule Engine →
  → Generate RAG Response (Bedrock) →
  → Score Confidence →
→ Aggregate Findings → Generate Report → End
```

### 4. AI/ML Services Layer

**a) Amazon Textract**
- **Purpose:** Extract text, tables, forms from PDFs
- **Configuration:** Async processing for documents >5 pages
- **Output:** JSON with text blocks, bounding boxes, confidence scores

**b) Amazon Comprehend Medical**
- **Purpose:** Extract medical/pharma entities (drugs, doses, conditions)
- **Configuration:** Custom entity recognizer trained on regulatory terms
- **Output:** Entity list with types and confidence scores

**c) Amazon Bedrock**

**Model 1: Titan Embeddings G1 - Text**
- **Purpose:** Generate 1536-dim embeddings for semantic search
- **Input:** Text chunks (200-1000 tokens)
- **Output:** Dense vector representations

**Model 2: Claude 3 Sonnet**
- **Purpose:** RAG-based compliance analysis and remediation generation
- **Configuration:**
  - Temperature: 0.2 (low for factual accuracy)
  - Max tokens: 2048
  - System prompt: "You are a regulatory compliance expert..."
- **Input:** Retrieved regulatory text + document section + task prompt
- **Output:** Structured compliance finding with citation

**d) Amazon SageMaker (Optional - Advanced)**
- **Purpose:** Host custom fine-tuned models for regulatory NER
- **Model:** BioBERT fine-tuned on ICH/CDSCO/FDA corpus
- **Endpoint:** Real-time inference endpoint

### 5. Data Storage Layer

**a) Amazon S3 (Object Storage)**

**Buckets:**
- `regulatory-copilot-uploads` - Raw user documents (encrypted, lifecycle: 90 days)
- `regulatory-copilot-processed` - Extracted text and metadata (encrypted)
- `regulatory-copilot-guidelines` - Regulatory PDFs and indexed content
- `regulatory-copilot-reports` - Generated compliance reports (encrypted, lifecycle: 365 days)

**Security:**
- Server-side encryption (SSE-KMS)
- Bucket policies restricting access to Lambda execution roles
- Versioning enabled for audit trail
- Access logging to CloudTrail

**b) Amazon Aurora PostgreSQL with pgvector**

**Purpose:** Vector database for semantic search


**c) Amazon DynamoDB**

**Purpose:** Metadata, job tracking, audit logs

**Tables:**

**Table 1: `Documents`**

**Table 2: `ComplianceJobs`**

**Table 3: `AuditLogs`**

### 6. Compliance Engine (Custom Logic)

**Technology:** Python module deployed in Lambda

**Components:**

**a) Rule Engine**
- Deterministic checks encoded as JSON rules

**b) RAG Pipeline**
- Retrieves top-K relevant clauses from vector DB
- Constructs prompt for Bedrock Claude:

**c) Confidence Scorer**
- Combines:
  - Vector similarity score (0-1)
  - LLM confidence (extracted from response)
  - Rule match certainty
- Outputs: HIGH (>0.85), MEDIUM (0.6-0.85), LOW (<0.6)

### 7. Monitoring & Governance

**Amazon CloudWatch**
- Lambda execution metrics (duration, errors, concurrency)
- API Gateway metrics (latency, 4xx/5xx errors)
- Custom metrics (documents processed, findings generated)
- Log aggregation from all services

**AWS CloudTrail**
- Audit trail of all API calls
- S3 access logs
- IAM activity logs

**AWS X-Ray**
- Distributed tracing across Lambda → Bedrock → Aurora
- Performance bottleneck identification

---

## System & User Flows: A clear map of how data moves from input to output

### Flow 1: Document Upload & Processing (System Flow)

**Trigger:** User uploads document via frontend

**Steps:**
1. **Frontend** validates file (type, size) and calls `POST /v1/documents/upload`
2. **API Gateway** authenticates request via Cognito, invokes `upload-handler` Lambda
3. **upload-handler**:
   - Generates pre-signed S3 URL
   - Creates document record in DynamoDB (status: UPLOADED)
   - Returns upload URL to frontend
4. **Frontend** uploads file directly to S3 using pre-signed URL
5. **S3 Event** triggers Step Function: `DocumentIngestionPipeline`
6. **Step Function** orchestrates:
   - **Step A:** Invoke `document-processor` Lambda
   - **Step B:** Call Textract `StartDocumentTextDetection` (async)
   - **Step C:** Poll Textract until complete
   - **Step D:** Extract text blocks and structure
   - **Step E:** Chunk text semantically (by section headers, ~500 tokens/chunk)
   - **Step F:** For each chunk:
     - Call Comprehend Medical for NER
     - Generate embedding via Bedrock Titan
     - Store in Aurora `document_chunks` table
   - **Step G:** Update DynamoDB document status: COMPLETED
7. **Frontend** polls `GET /v1/documents/{id}/status` and displays "Ready for Analysis"

**Data Flow:**
```
User File → S3 (raw) → Textract → Text JSON → Lambda (chunking) → 
Bedrock (embeddings) → Aurora (vectors) → DynamoDB (metadata)
```

### Flow 2: Compliance Analysis (Primary User Flow)

**Trigger:** User selects document and clicks "Run Compliance Check" with guideline selection (e.g., ICH E6)

**Steps:**
1. **Frontend** calls `POST /v1/compliance/analyze` with:

2. **API Gateway** → `compliance-analyzer` Lambda → Starts Step Function: `ComplianceAnalysisPipeline`

3. **Step Function** orchestrates:
   - **Step A:** Load document chunks from Aurora
   - **Step B:** For each chunk (parallel execution):
     - **B1:** Vector search in `regulatory_clauses` table:
     - **B2:** Run rule engine checks (deterministic)
     - **B3:** If potential issue detected, invoke Bedrock Claude with RAG prompt
     - **B4:** Parse LLM response into structured finding
     - **B5:** Calculate confidence score
   - **Step C:** Aggregate all findings
   - **Step D:** Prioritize by risk (Critical > Major > Minor)
   - **Step E:** Store findings in DynamoDB `ComplianceJobs` table
   - **Step F:** Invoke `report-generator` Lambda

4. **report-generator**:
   - Formats findings into PDF using template
   - Includes: document metadata, findings table, evidence citations, suggested fixes
   - Uploads report to S3
   - Returns signed URL (expires in 7 days)

5. **Frontend** receives job completion notification (WebSocket or polling)
6. **User** views interactive findings dashboard:
   - Left panel: Document with highlighted sections
   - Right panel: Findings list with expand/collapse
   - Click finding → shows evidence modal with:
     - Document excerpt
     - Regulatory clause text
     - Gap explanation
     - Suggested fix
     - Accept/Reject buttons

**Data Flow:**
```
User Request → API Gateway → Lambda → Aurora (vector search) → 
Bedrock (RAG analysis) → Lambda (aggregation) → DynamoDB (findings) → 
S3 (report) → Frontend (display)
```

### Flow 3: Remediation & Export (User Flow)

**Trigger:** User reviews findings and accepts/modifies suggestions

**Steps:**
1. **User** clicks "Accept Suggestion" on a finding
2. **Frontend** calls `POST /v1/compliance/remediate` with:
3. **Lambda** updates finding status in DynamoDB
4. **User** clicks "Export Audit Report"
5. **Frontend** calls `POST /v1/reports/export` with format (PDF/CSV)
6. **report-generator** Lambda:
   - Retrieves all findings and actions from DynamoDB
   - Generates timestamped audit trail:
     - Document name and version
     - Analysis date and user
     - Guidelines checked
     - Findings with evidence
     - Actions taken (accepted/rejected/modified)
     - Digital signature (optional)
   - Uploads to S3, returns signed URL

7. **User** downloads report for submission or audit

**Audit Trail Example:**
```
Compliance Analysis Report
Generated: 2025-01-23 14:30 IST
User: regulatory.manager@pharma.in
Document: Clinical_Protocol_XYZ_v2.1.pdf

Guidelines Checked:
- ICH E6(R2) Good Clinical Practice
- CDSCO New Drugs and Clinical Trials Rules, 2019

Findings Summary:
- Critical: 2
- Major: 5
- Minor: 8

Finding #1 [CRITICAL]
Section: 4.2 Informed Consent
Issue: Missing explicit statement of study purpose
Evidence: ICH E6(R2) Section 4.8.1 requires "...a statement that the trial involves research..."
Suggested Fix: [Accepted]
Action Taken: Text added on 2025-01-23 14:35 IST
```

### Flow 4: Knowledge Base Update (Admin Flow)

**Trigger:** New regulatory guideline published

**Steps:**
1. **Admin** uploads new guideline PDF via admin panel
2. **Backend** triggers `guideline-ingestion` Lambda
3. **Lambda**:
   - Extracts text via Textract
   - Identifies sections and clauses using regex + NLP
   - Chunks text semantically
   - Generates embeddings via Bedrock
   - Inserts into Aurora `regulatory_clauses` table with version metadata
4. **System** notifies users of updated guidelines
5. **Users** can re-scan existing documents against new version

---

## AWS Integration: How you strategically leverage AWS services

### Service Selection Rationale

| AWS Service | Purpose | Why This Service |
|-------------|---------|------------------|
| **AWS Amplify** | Frontend hosting | Integrated CI/CD, CDN, SSL, custom domain support |
| **Amazon API Gateway** | API management | Managed service, built-in throttling, request validation |
| **Amazon Cognito** | Authentication | User pools, JWT tokens, MFA support, no server management |
| **AWS Lambda** | Compute | Serverless, auto-scaling, pay-per-invocation, event-driven |
| **AWS Step Functions** | Workflow orchestration | Visual workflows, error handling, parallel execution |
| **Amazon Textract** | OCR | Best-in-class document analysis, table extraction |
| **Amazon Comprehend Medical** | Medical NER | Pre-trained on medical/pharma terminology |
| **Amazon Bedrock** | Foundation models | Managed LLMs (Claude, Titan), no infrastructure, API access |
| **Amazon Aurora PostgreSQL** | Vector database | Managed, pgvector extension, SQL-native, ACID compliance |
| **Amazon S3** | Object storage | Unlimited scale, encryption, lifecycle policies, versioning |
| **Amazon DynamoDB** | NoSQL database | Single-digit ms latency, auto-scaling, serverless |
| **Amazon CloudWatch** | Monitoring | Centralized logs, metrics, alarms, dashboards |
| **AWS CloudTrail** | Audit logging | Compliance, security analysis, governance |
| **AWS X-Ray** | Distributed tracing | Performance optimization, bottleneck identification |

### Cost Optimization Strategies

1. **S3 Lifecycle Policies:** Move old documents to Glacier after 90 days
2. **Lambda Reserved Concurrency:** For predictable workloads
3. **Aurora Serverless v2:** Auto-scales based on load
4. **DynamoDB On-Demand:** Pay-per-request for variable traffic
5. **Bedrock Batch Inference:** For non-real-time processing (50% cost savings)

### Security Architecture

**Encryption:**
- At rest: S3 (SSE-KMS), Aurora (encryption enabled), DynamoDB (encryption enabled)
- In transit: TLS 1.2+ for all API calls

**Access Control:**
- IAM roles with least-privilege policies
- Cognito user pools with MFA
- S3 bucket policies restricting cross-account access
- VPC for Aurora (private subnets)

**Compliance:**
- CloudTrail logging for all API calls
- VPC Flow Logs for network monitoring
- AWS Config for resource compliance tracking

---

## Technical Logic: Proof that you've thought through how the pieces connect

### 1. Semantic Chunking Strategy

**Challenge:** How to split documents for optimal retrieval?

**Solution:**
- Use heading-based chunking (preserve semantic boundaries)
- Target chunk size: 200-1000 tokens
- Overlap: 50 tokens between chunks (preserve context)
- Metadata: section name, page number, chunk index

### 2. RAG Prompt Engineering

**Challenge:** Prevent hallucinations while maintaining helpful responses

**Solution:** Structured prompt with explicit constraints

**Prompt Template:**
```
System: You are a regulatory compliance expert for life-sciences documentation.

CRITICAL RULES:
1. Use ONLY the provided regulatory context below
2. If the context doesn't contain relevant information, say "Insufficient regulatory context"
3. Always cite the specific guideline section
4. Never invent regulatory requirements

Regulatory Context:
---
{retrieved_clause_1}
Source: {guideline_name_1}, Section {section_1}

{retrieved_clause_2}
Source: {guideline_name_2}, Section {section_2}
---

User Document Section:
---
{document_chunk}
---

Task:
Analyze if the user document section complies with the regulatory requirements in the context.

Output JSON:
{
  "compliant": boolean,
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "finding": "Brief description of compliance status",
  "evidence": "Exact quote from regulatory context",
  "citation": "Guideline name and section",
  "gap_details": "Specific missing or incorrect elements (if non-compliant)",
  "suggested_text": "Compliant text suggestion (if non-compliant)"
}
```

### 3. Confidence Scoring Algorithm

**Challenge:** How to determine if AI output is trustworthy?

**Solution:** Multi-factor confidence score

**Action:** Flag LOW confidence findings for mandatory human review

### 4. Vector Search Optimization

**Challenge:** Fast retrieval from 10,000+ regulatory clauses

**Solution:** Hybrid search with filters

**Performance:** <100ms for 10K clauses with IVFFlat index

### 5. Error Handling & Retry Logic

**Challenge:** Handle transient failures in distributed system

**Solution:** Exponential backoff with circuit breaker

**Step Functions:** Built-in retry and catch for workflow resilience

### 6. Scalability Considerations

**Bottleneck Analysis:**

| Component | Bottleneck | Mitigation |
|-----------|------------|------------|
| Textract | API rate limits | Async processing, queue-based |
| Bedrock | Token limits | Batch processing, chunking |
| Aurora | Connection pool | Connection pooling in Lambda |
| Lambda | Cold starts | Provisioned concurrency for critical functions |

**Load Testing Targets:**
- 100 concurrent users
- 1000 documents/day
- <30s average processing time per document

### 7. Data Versioning & Audit Trail

**Challenge:** Maintain compliance history for audits

**Solution:** Immutable audit log + document versioning

**Implementation:**
- Every finding stored with timestamp and user ID
- S3 versioning enabled (retain all document versions)
- DynamoDB streams → Lambda → Archive to S3 (long-term storage)
- Audit reports include full lineage: document version → guidelines version → findings → actions


---

## Implementation Roadmap

### Phase 1: Core Infrastructure
- Set up AWS account and IAM roles
- Deploy Amplify frontend skeleton
- Configure API Gateway + Cognito
- Create S3 buckets and DynamoDB tables
- Set up Aurora PostgreSQL with pgvector

### Phase 2: Document Processing Pipeline
- Implement upload handler Lambda
- Integrate Textract for OCR
- Build chunking logic
- Generate embeddings via Bedrock
- Store in Aurora vector DB

### Phase 3: Knowledge Base Ingestion
- Download sample ICH/CDSCO/FDA PDFs
- Process and index regulatory clauses
- Verify vector search functionality
- Create 5-10 test regulatory clauses

### Phase 4: Compliance Analysis
- Build RAG pipeline
- Implement rule engine (3-5 critical rules)
- Integrate Bedrock Claude for analysis
- Develop confidence scoring
- Create findings aggregation logic

### Phase 5: Frontend & Demo
- Build upload UI
- Create findings dashboard
- Implement evidence modal
- Add export functionality
- Prepare demo script with sample documents

### Phase 6: Testing & Polish
- End-to-end testing
- Performance optimization
- Error handling
- Demo rehearsal
- Documentation

---

## Success Metrics for Design

**Technical Metrics:**
- <30s document processing time (for 20-page PDF)
- <5s compliance query response time
- >95% uptime during demo
- <$50 AWS cost for hackathon period

**Architecture Quality:**
- Serverless (zero server management)
- Event-driven (asynchronous processing)
- Scalable (handles 10x load without code changes)
- Secure (encryption, IAM, audit logging)
- Observable (CloudWatch metrics, X-Ray tracing)

**AI Quality:**
- RAG-based (grounded responses)
- Explainable (citations for every finding)
- Confident (scoring mechanism)
- Accurate (>85% precision target)

---

## Conclusion

This design demonstrates a production-ready, cloud-native architecture that leverages AWS's AI/ML services strategically. The RAG-based approach ensures accuracy and explainability, critical for regulatory compliance use cases. The serverless design minimizes operational overhead while maintaining scalability and security. Every component is purpose-built to deliver the core value proposition: fast, accurate, evidence-backed compliance checking for Indian life-sciences teams.
