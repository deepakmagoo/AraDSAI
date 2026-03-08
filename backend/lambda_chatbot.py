import json
import boto3
import os
import re
from datetime import datetime

# ── Configuration ──────────────────────────────────────────────────────────────
REGION = "ap-northeast-1"  # Tokyo region

# Claude Sonnet 4.5 on Bedrock
# Verify this model ID is available in your region via AWS Console → Bedrock → Model access
MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-sonnet-4-5-20251101-v1:0")

# Initialize Bedrock client
bedrock_runtime = boto3.client(
    "bedrock-runtime",
    region_name=REGION
)


def build_response(status, body):
    """Build API Gateway response"""
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        },
        "body": json.dumps(body)
    }


def build_system_prompt(document_name, findings_summary, compliance_score):
    """Build optimized system prompt for detailed, structured, cited responses"""
    score_text = f"{compliance_score}%" if compliance_score is not None else "Not yet calculated"

    return f"""You are **DocBot**, a senior regulatory compliance expert AI assistant specialising in pharmaceutical and clinical trial documentation. You have deep expertise in ICH guidelines (E6, E8, E9, E10, Q8–Q12), FDA regulations (21 CFR Parts 11, 50, 54, 56, 312, 314), EMA directives, and GCP/GMP/GLP standards.

---

## Document Under Review
- **Document Name:** {document_name}
- **Overall Compliance Score:** {score_text}

## Findings Analysis Context
{findings_summary}

---

## Response Format Rules

### Structure
1. **Executive Summary** — Start every response with 1–2 sentences that directly answer the question.
2. **Detailed Analysis** — Use `##` and `###` headings to organise sections. Group related points logically.
3. **Findings Table** — When listing multiple findings, always use a Markdown table with columns: `| # | Section | Severity | Issue | Regulatory Basis |`
4. **Recommended Actions** — End with a numbered action list when the user asks about fixes or next steps.
5. **References** — Close every response with a `## References` section listing all cited standards.

### Formatting
- Use **bold** for severity labels (CRITICAL, MAJOR, MINOR), regulatory names, and section numbers.
- Use `> blockquote` for direct quotes from the document or regulatory text.
- Use numbered lists for ordered steps or prioritised actions.
- Use bullet lists for unordered items.
- Use code blocks (` ``` `) only for suggested corrective text/language insertions.

### Citations
- Document sections: `[Section 4.2]`
- Regulatory standards: `[Citation: ICH E6(R2) §4.8.1]` or `[Citation: FDA 21 CFR §50.25]`
- Every regulatory claim MUST include a citation.
- If the full PDF document is attached, quote or reference its actual content.

### Quality Standards
- Be specific and detailed — avoid vague summaries.
- Explain WHY each gap is a compliance risk and WHICH regulation it violates.
- For critical issues, state the regulatory consequence (e.g., "may result in rejection of NDA submission").
- If data is not present in the findings or document, state: *"This information is not available in the current analysis."*
- Never fabricate citations, section numbers, or regulatory text.
- Prioritise: CRITICAL → MAJOR → MINOR."""


def build_messages(conversation_history, user_message,
                   document_base64=None, document_media_type="application/pdf",
                   document_name="Document"):
    """
    Build the messages array for Claude.
    - Conversation history goes first (plain text, last 6 messages).
    - Current user message is last; if a PDF is supplied it is embedded as a
      document block alongside the question so Claude can read the actual source.
    """
    messages = []

    # Conversation history — plain text only
    for msg in conversation_history[-6:]:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if content:
            messages.append({"role": role, "content": content})

    # Current user message with optional PDF document block
    if document_base64:
        current_content = [
            {
                "type": "document",
                "source": {
                    "type": "base64",
                    "media_type": document_media_type,
                    "data": document_base64
                },
                "title": document_name,
                "context": (
                    "This is the regulatory compliance document under review. "
                    "Use its actual content to answer questions accurately."
                )
            },
            {
                "type": "text",
                "text": user_message
            }
        ]
        messages.append({"role": "user", "content": current_content})
    else:
        messages.append({"role": "user", "content": user_message})

    return messages


def extract_citations(response_text):
    """
    Extract all citations from Claude's response and deduplicate them.
    Returns up to 15 unique citations.
    """
    citations = []
    seen = set()

    # [Citation: ICH E6(R2) §6.9.4] or [Citation: FDA 21 CFR §312.23(a)]
    for m in re.findall(r'\[Citation:\s*([^\]]+)\]', response_text):
        key = m.strip()
        if key not in seen:
            seen.add(key)
            citations.append({
                "type": "regulatory",
                "reference": key,
                "text": f"Regulatory requirement: {key}"
            })

    # [Section 4.2] or [§4.8.1]
    for m in re.findall(r'\[(?:Section\s+)?§?(\d+(?:\.\d+)*)\]', response_text):
        key = f"Section {m}"
        if key not in seen:
            seen.add(key)
            citations.append({
                "type": "section",
                "reference": key,
                "text": f"Document {key}"
            })

    return citations[:15]


def lambda_handler(event, context):
    """Main Lambda handler"""
    try:
        # Parse request body
        body = json.loads(event["body"]) if "body" in event else event

        # Extract parameters
        document_name     = body.get("document_name", "Document")
        findings_summary  = body.get("findings_summary", "No findings available yet.")
        compliance_score  = body.get("compliance_score")
        user_message      = body.get("message", "")
        conversation_history = body.get("conversation_history", [])
        document_base64   = body.get("document_base64")
        document_media_type = body.get("document_media_type", "application/pdf")

        if not user_message:
            return build_response(400, {"error": "Message is required"})

        # Build system prompt and messages
        system_prompt = build_system_prompt(document_name, findings_summary, compliance_score)
        messages = build_messages(
            conversation_history, user_message,
            document_base64, document_media_type, document_name
        )

        # Invoke Claude via AWS Bedrock
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "temperature": 0.3,
            "system": system_prompt,
            "messages": messages
        }

        response = bedrock_runtime.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps(request_body)
        )

        response_body = json.loads(response["body"].read())
        response_text = response_body["content"][0]["text"]
        citations = extract_citations(response_text)

        return build_response(200, {
            "response": response_text,
            "sources": citations,
            "timestamp": datetime.now().isoformat(),
            "method": "lambda_claude4"
        })

    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        return build_response(500, {
            "error": str(e),
            "message": "Failed to process chat request"
        })
