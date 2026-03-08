import json
import boto3
import os
from botocore.exceptions import ClientError

REGION = os.environ["REGION"]
KNOWLEDGE_BASE_ID = os.environ["KNOWLEDGE_BASE_ID"]
MODEL_ARN = os.environ["MODEL_ARN"]

bedrock_agent_runtime = boto3.client("bedrock-agent-runtime", region_name=REGION)
bedrock_runtime = boto3.client("bedrock-runtime", region_name=REGION)


def build_response(status_code, body_dict):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        },
        "body": json.dumps(body_dict)
    }


def retrieve_chunks(query, num_results=8):
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


def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body") or "{}")
        question = (body.get("question") or "").strip()

        if not question:
            return build_response(400, {"error": "Question is required"})

        # Client owns conversation history — pass last N turns for context
        # Each entry: {"role": "user"|"assistant", "content": "..."}
        conversation_history = body.get("conversationHistory", [])

        # Step 1: Retrieve relevant KB chunks
        kb_chunks = retrieve_chunks(question, num_results=8)

        if kb_chunks:
            context_text = "\n\n".join(
                f"[REF {i+1}] (Source: {c['source'].split('/')[-1]})\n{c['text']}"
                for i, c in enumerate(kb_chunks)
            )
        else:
            context_text = "No relevant documents found in the knowledge base."

        system_prompt = f"""You are a pharmaceutical regulatory compliance expert with deep knowledge of ICH guidelines (Q2, Q3, Q6, Q7, Q8, Q9, Q10, Q11, Q12, Q14, E6, E8, E9), FDA regulations (21 CFR Parts 11, 50, 56, 210, 211, 312, 314), and EMA/GCP/GMP standards.

Answer questions using ONLY the retrieved guideline references below. Cite the specific reference number and clause for every factual claim. If the answer cannot be found in the references, say so explicitly — do not fabricate information.

RETRIEVED REFERENCES:
{context_text}"""

        # Build messages: inject history for multi-turn context, then current question
        messages = []
        for turn in conversation_history[-6:]:  # cap at last 6 turns
            role = turn.get("role")
            content = turn.get("content", "").strip()
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": question})

        # Step 2: Generate via direct model call — no guardrail layer
        response = bedrock_runtime.invoke_model(
            modelId=MODEL_ARN,
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 2000,
                "temperature": 0.2,
                "system": system_prompt,
                "messages": messages
            })
        )

        response_body = json.loads(response["body"].read())
        output_text = response_body["content"][0]["text"]

        # Return citations in original format for frontend compatibility
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

        return build_response(200, {
            "response": output_text,
            "citations": citations,
            # sessionId removed — conversation state is managed client-side via conversationHistory
        })

    except ClientError as e:
        print(f"AWS ClientError: {str(e)}")
        return build_response(500, {"error": "AWS service error", "message": str(e)})

    except Exception as e:
        print(f"Unhandled Error: {str(e)}")
        return build_response(500, {"error": "Internal server error", "message": str(e)})