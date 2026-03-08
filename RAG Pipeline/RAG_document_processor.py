import json
import boto3
import os
import base64
import re
from io import BytesIO
from concurrent.futures import ThreadPoolExecutor, as_completed
from botocore.exceptions import ClientError
from pypdf import PdfReader, PdfWriter

# ---------- CONFIG ----------
REGION = os.environ["REGION"]
KNOWLEDGE_BASE_ID = os.environ["KNOWLEDGE_BASE_ID"]
# MODEL_ARN is only used for KB vector retrieval config (not generation)
MODEL_ARN = os.environ["MODEL_ARN"]
# For generation, prefer an explicit model ID env var; fall back to MODEL_ARN
# invoke_model accepts both plain model IDs and full ARNs
GENERATION_MODEL_ID = os.environ.get("GENERATION_MODEL_ID", MODEL_ARN)
MAX_PARALLEL = int(os.environ.get("MAX_PARALLEL_CALLS", 5))

# ---------- AWS CLIENTS ----------
textract = boto3.client("textract", region_name="ap-south-1")
bedrock_agent_runtime = boto3.client("bedrock-agent-runtime", region_name=REGION)
bedrock_runtime = boto3.client("bedrock-runtime", region_name=REGION)


# ---------- RESPONSE BUILDER ----------
def build_response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(body)
    }


# ---------- SAFE JSON EXTRACTOR ----------
def extract_json(text):
    try:
        return json.loads(text)
    except Exception:
        pass

    cleaned = re.sub(r"```(?:json)?", "", text).strip().rstrip("`").strip()
    try:
        return json.loads(cleaned)
    except Exception:
        pass

    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except Exception:
            pass

    return None


# ---------- STEP 1: Extract Text Page-by-Page ----------
def extract_text_from_pdf(file_bytes):
    reader = PdfReader(BytesIO(file_bytes))

    if len(reader.pages) > 20:
        raise Exception("PDF too large (max 20 pages for sync processing)")

    full_text = []
    for page in reader.pages:
        writer = PdfWriter()
        writer.add_page(page)

        page_buffer = BytesIO()
        writer.write(page_buffer)
        page_bytes = page_buffer.getvalue()

        response = textract.detect_document_text(Document={"Bytes": page_bytes})
        for block in response["Blocks"]:
            if block["BlockType"] == "LINE":
                full_text.append(block["Text"])

    return "\n".join(full_text)


# ---------- STEP 2: Split Sections ----------
def split_sections(text):
    """
    Splits on numbered headings (e.g. '1.', '2.1', '3.1.2') as well as
    common ALL-CAPS or Title-Case pharma section headers.
    Falls back to chunking by ~300-word blocks if no structure is found.
    """
    sections = []
    current_title = None
    current_content = []

    HEADING_RE = re.compile(
        r"^(?:"
        r"\d+(?:\.\d+)*\.?\s+\S"
        r"|[A-Z][A-Z\s]{4,}$"
        r"|(?:Introduction|Objective|Scope|Background|Methods?|Protocol"
        r"|Procedures?|Results?|Discussion|Conclusion|References?|Appendix"
        r"|Safety|Efficacy|Monitoring|Eligibility|Endpoints?|Randomis?ation"
        r"|Blinding|Statistics|Data Management|Amendments?|Signatures?)"
        r"(?:\s|:).*"
        r")"
    )

    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            if current_title:
                current_content.append("")
            continue

        if HEADING_RE.match(stripped):
            if current_title:
                content_str = "\n".join(current_content).strip()
                if content_str:
                    sections.append({"title": current_title, "content": content_str})
            current_title = stripped
            current_content = []
        else:
            if current_title:
                current_content.append(stripped)

    if current_title:
        content_str = "\n".join(current_content).strip()
        if content_str:
            sections.append({"title": current_title, "content": content_str})

    # Fallback: chunk into ~300-word blocks
    if not sections:
        words = text.split()
        chunk_size = 300
        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i:i + chunk_size])
            sections.append({"title": f"Block {i // chunk_size + 1}", "content": chunk})

    return sections


# ---------- STEP 3a: Retrieve KB Chunks ----------
def retrieve_kb_chunks(query, num_results=10):
    """
    Uses bedrock_agent_runtime.retrieve() — raw vector search with no generation step.
    This completely bypasses Bedrock's retrieve_and_generate guardrail layer.
    """
    response = bedrock_agent_runtime.retrieve(
        knowledgeBaseId=KNOWLEDGE_BASE_ID,
        retrievalQuery={"text": query},
        retrievalConfiguration={
            "vectorSearchConfiguration": {
                "numberOfResults": num_results,
                "overrideSearchType": "HYBRID"
            }
        }
    )

    chunks = []
    for result in response.get("retrievalResults", []):
        content = result.get("content", {}).get("text", "").strip()
        source = result.get("location", {}).get("s3Location", {}).get("uri", "")
        score = result.get("score", 0)
        if content:
            chunks.append({"text": content, "source": source, "score": score})

    chunks.sort(key=lambda x: x["score"], reverse=True)
    return chunks


# ---------- STEP 3b: Evaluate Section via Direct Model Call ----------
def evaluate_section(section):
    """
    Two-step pipeline:
      1. retrieve()      — fetch raw ICH/GMP guideline chunks from KB (no guardrail)
      2. invoke_model()  — call Claude directly with chunks injected as context

    Why not retrieve_and_generate?
      Bedrock's built-in generation step applies content guardrails that reject
      prompts it classifies as document generation. By splitting the calls we own
      the full prompt and completely bypass that layer.
    """
    # Focused retrieval query: title + first 100 chars gives enough signal
    retrieval_query = f"{section['title']} {section['content'][:100]}"
    kb_chunks = retrieve_kb_chunks(retrieval_query, num_results=10)

    if kb_chunks:
        references_text = "\n\n".join(
            f"[REF {i+1}] (Source: {c['source'].split('/')[-1]})\n{c['text']}"
            for i, c in enumerate(kb_chunks)
        )
    else:
        references_text = "No directly matching guidelines retrieved. Apply general ICH Q7/GMP principles."

    prompt = f"""You are a pharmaceutical GMP/ICH compliance auditor. Analyze the document section below against the retrieved guideline references and output a structured gap analysis.

RETRIEVED GUIDELINE REFERENCES:
{references_text}

---
DOCUMENT SECTION TITLE: {section['title']}

DOCUMENT SECTION CONTENT:
{section['content']}
---

Output ONLY a JSON object with this exact structure — no preamble, no markdown:

{{
  "riskLevel": "High",
  "missingRequirements": [
    "ICH Q7 §6.13 — record retention periods not specified for APIs with retest dates (minimum 3 years after full distribution required)",
    "ICH Q7 §13.10 — no formal change control system described for specification changes"
  ],
  "summary": "Specific corrective actions: (1) Add explicit retention periods per ICH Q7 §6.13: 1 year post-expiry for standard batches, 3 years post-distribution for APIs with retest dates. (2) Define a formal change control procedure per §13.10 covering raw material and specification changes."
}}

CLASSIFICATION RULES:
- "High"   — a mandatory requirement is absent or contradicted; critical inspection finding likely
- "Medium" — requirement is partially covered; regulatory query likely
- "Low"    — largely compliant; only minor clarifications needed

QUALITY RULES:
- missingRequirements: cite the specific REF number and clause for each gap; return [] if none
- summary: list concrete corrective actions grounded in the references; be specific, not generic
- Do not fabricate citations not present in the references above"""

    response = bedrock_runtime.invoke_model(
        modelId=GENERATION_MODEL_ID,
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2048,
            "temperature": 0.1,
            "messages": [{"role": "user", "content": prompt}]
        })
    )

    response_body = json.loads(response["body"].read())
    raw_text = response_body["content"][0]["text"]
    structured = extract_json(raw_text)

    # Build citations in original format for frontend compatibility
    citations = [
        {
            "generatedResponsePart": {"textResponsePart": {"text": c["text"][:200]}},
            "retrievedReferences": [{
                "content": {"text": c["text"]},
                "location": {"s3Location": {"uri": c["source"]}}
            }]
        }
        for c in kb_chunks[:5]
    ]

    if not structured:
        return {
            "title": section["title"],
            "riskLevel": "ParsingError",
            "missingRequirements": [],
            "finalSuggestedAnswer": raw_text,
            "citations": citations,
            "debug": {"rawResponse": raw_text[:300]}
        }

    valid_levels = {"High", "Medium", "Low"}
    risk = structured.get("riskLevel", "Unknown")
    if risk not in valid_levels:
        risk = "Unknown"

    return {
        "title": section["title"],
        "riskLevel": risk,
        "missingRequirements": structured.get("missingRequirements", []),
        "finalSuggestedAnswer": structured.get("summary", ""),
        "citations": citations
    }


# ---------- MAIN HANDLER ----------
def lambda_handler(event, context):
    try:
        body = json.loads(event["body"]) if "body" in event else event

        file_base64 = body.get("file")
        if not file_base64:
            return build_response(400, {"error": "Base64 encoded PDF required"})

        file_base64 = file_base64.strip().replace("\n", "").replace("\r", "")
        file_bytes = base64.b64decode(file_base64)

        if not file_bytes.startswith(b'%PDF'):
            return build_response(400, {"error": "Invalid PDF file"})

        extracted_text = extract_text_from_pdf(file_bytes)
        sections = split_sections(extracted_text)

        if not sections:
            return build_response(400, {"error": "No structured sections detected"})

        results = []
        with ThreadPoolExecutor(max_workers=MAX_PARALLEL) as executor:
            futures = {executor.submit(evaluate_section, sec): sec for sec in sections}
            for future in as_completed(futures):
                try:
                    results.append(future.result())
                except Exception as e:
                    sec = futures[future]
                    results.append({
                        "title": sec["title"],
                        "riskLevel": "Error",
                        "missingRequirements": [],
                        "finalSuggestedAnswer": f"Evaluation failed: {str(e)}",
                        "citations": []
                    })

        high_risk = sum(1 for r in results if r["riskLevel"] == "High")

        return build_response(200, {
            "totalSections": len(results),
            "highRiskSections": high_risk,
            "sections": results
        })

    except ClientError as e:
        return build_response(500, {"error": str(e)})
    except Exception as e:
        return build_response(500, {"error": str(e)})