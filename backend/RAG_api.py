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
MODEL_ARN = os.environ["MODEL_ARN"]
MAX_PARALLEL = int(os.environ.get("MAX_PARALLEL_CALLS", 5))

# ---------- AWS CLIENTS ----------
textract = boto3.client("textract", region_name="ap-south-1")

bedrock_agent_runtime = boto3.client(
    "bedrock-agent-runtime",
    region_name=REGION
)

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
    """
    Extract first valid JSON object from model output.
    Handles cases where model adds extra text.
    """
    try:
        return json.loads(text)
    except:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except:
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

        response = textract.detect_document_text(
            Document={"Bytes": page_bytes}
        )

        for block in response["Blocks"]:
            if block["BlockType"] == "LINE":
                full_text.append(block["Text"])

    return "\n".join(full_text)


# ---------- STEP 2: Split Sections ----------
def split_sections(text):
    sections = []
    current_title = None
    current_content = []

    for line in text.splitlines():
        line = line.strip()

        if re.match(r"^\d+(\.\d+)\.?\s+.", line):
            if current_title:
                sections.append({
                    "title": current_title,
                    "content": "\n".join(current_content).strip()
                })
            current_title = line
            current_content = []
        else:
            if current_title:
                current_content.append(line)

    if current_title:
        sections.append({
            "title": current_title,
            "content": "\n".join(current_content).strip()
        })

    return sections


# ---------- STEP 3: Evaluate Section ----------
def evaluate_section(section):

    prompt = f"""
You are a regulatory compliance auditor.

Evaluate the section strictly using the knowledge base.

Section Title: {section['title']}
Section Content:
{section['content']}

Return ONLY valid JSON in this format:

{{
  "riskLevel": "Low | Medium | High",
  "missingRequirements": ["item1", "item2"],
  "summary": "final suggested answer"
}}

Do not include any text outside JSON.
"""

    request = {
        "input": {"text": prompt},
        "retrieveAndGenerateConfiguration": {
            "type": "KNOWLEDGE_BASE",
            "knowledgeBaseConfiguration": {
                "knowledgeBaseId": KNOWLEDGE_BASE_ID,
                "modelArn": MODEL_ARN,
                "retrievalConfiguration": {
                    "vectorSearchConfiguration": {
                        "numberOfResults": 8,
                        "overrideSearchType": "HYBRID"
                    }
                },
                "generationConfiguration": {
                    "inferenceConfig": {
                        "textInferenceConfig": {
                            "temperature": 0.2,
                            "maxTokens": 800
                        }
                    }
                }
            }
        }
    }

    response = bedrock_agent_runtime.retrieve_and_generate(**request)
    raw_text = response["output"]["text"]

    structured = extract_json(raw_text)

    if not structured:
        structured = {
            "riskLevel": "ParsingError",
            "missingRequirements": [],
            "summary": raw_text
        }

    return {
        "title": section["title"],
        "riskLevel": structured.get("riskLevel", "Unknown"),
        "missingRequirements": structured.get("missingRequirements", []),
        "finalSuggestedAnswer": structured.get("summary", ""),
        "citations": response.get("citations", [])
    }


# ---------- MAIN HANDLER ----------
def lambda_handler(event, context):

    try:
        if "body" in event:
            body = json.loads(event["body"])
        else:
            body = event

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
            futures = [executor.submit(evaluate_section, sec) for sec in sections]

            for future in as_completed(futures):
                results.append(future.result())

        # Accurate High Risk Count
        high_risk = sum(
            1 for r in results
            if r["riskLevel"] == "High"
        )

        final_response = {
            "totalSections": len(results),
            "highRiskSections": high_risk,
            "sections": results
        }

        return build_response(200, final_response)

    except ClientError as e:
        return build_response(500, {"error": str(e)})

    except Exception as e:
        return build_response(500, {"error": str(e)})