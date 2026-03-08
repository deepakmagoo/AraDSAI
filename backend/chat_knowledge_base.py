"""
Knowledge Base RAG Chat Implementation
Based on your RAD_api.py pattern
"""

import boto3
import json
import os
from typing import List, Dict, Optional, Tuple
from datetime import datetime

# Initialize Bedrock Agent Runtime client
def get_bedrock_agent_client():
    """Get Bedrock Agent Runtime client"""
    return boto3.client(
        service_name='bedrock-agent-runtime',
        region_name=os.getenv('AWS_REGION', 'us-east-1')
    )


async def chat_with_knowledge_base(
    user_message: str,
    document_name: str,
    findings_summary: str,
    conversation_history: List[Dict] = None,
    compliance_score: Optional[float] = None
) -> Tuple[str, List[Dict]]:
    """
    Chat with document using AWS Bedrock Knowledge Base (RAG).
    
    This uses the same pattern as your RAD_api.py:
    1. Retrieve relevant regulatory documents from Knowledge Base
    2. Generate response using Claude with retrieved context
    3. Return response with citations
    
    Args:
        user_message: The user's question
        document_name: Name of the document being analyzed
        findings_summary: Summary of document findings
        conversation_history: Previous messages (last 3 exchanges)
        compliance_score: Document compliance score
        
    Returns:
        Tuple of (response_text, citations_list)
    """
    
    # Get configuration from environment
    knowledge_base_id = os.getenv('KNOWLEDGE_BASE_ID')
    model_arn = os.getenv('MODEL_ARN')
    
    if not knowledge_base_id or not model_arn:
        raise ValueError(
            "KNOWLEDGE_BASE_ID and MODEL_ARN must be set in environment. "
            "See BEDROCK-KNOWLEDGE-BASE-SETUP.md for setup instructions."
        )
    
    # Build enhanced prompt with document context
    prompt = _build_prompt(
        user_message=user_message,
        document_name=document_name,
        findings_summary=findings_summary,
        conversation_history=conversation_history,
        compliance_score=compliance_score
    )
    
    # Prepare request (same structure as RAD_api.py)
    request = {
        "input": {"text": prompt},
        "retrieveAndGenerateConfiguration": {
            "type": "KNOWLEDGE_BASE",
            "knowledgeBaseConfiguration": {
                "knowledgeBaseId": knowledge_base_id,
                "modelArn": model_arn,
                "retrievalConfiguration": {
                    "vectorSearchConfiguration": {
                        "numberOfResults": 8,  # Retrieve top 8 relevant chunks
                        "overrideSearchType": "HYBRID"  # Combine semantic + keyword search
                    }
                },
                "generationConfiguration": {
                    "inferenceConfig": {
                        "textInferenceConfig": {
                            "temperature": 0.7,  # Balanced creativity/accuracy
                            "maxTokens": 2000    # Max response length
                        }
                    }
                }
            }
        }
    }
    
    # Call Bedrock Knowledge Base
    bedrock_agent = get_bedrock_agent_client()
    response = bedrock_agent.retrieve_and_generate(**request)
    
    # Extract response text
    response_text = response["output"]["text"]
    
    # Extract citations (same as RAD_api.py)
    citations = _extract_citations(response)
    
    return response_text, citations


def _build_prompt(
    user_message: str,
    document_name: str,
    findings_summary: str,
    conversation_history: Optional[List[Dict]],
    compliance_score: Optional[float]
) -> str:
    """Build the prompt for Knowledge Base RAG"""
    
    # Start with system context
    prompt_parts = [
        "You are DocBot, an expert AI assistant for regulatory compliance in pharmaceutical and clinical trial documentation.",
        "",
        f"Document Being Analyzed: {document_name}",
    ]
    
    if compliance_score is not None:
        prompt_parts.append(f"Overall Compliance Score: {compliance_score}%")
    
    # Add findings summary (limited to avoid token overflow)
    if findings_summary:
        prompt_parts.extend([
            "",
            "Current Document Analysis Summary:",
            findings_summary[:1500],  # Limit to 1500 chars
            ""
        ])
    
    # Add conversation history (last 2 exchanges = 4 messages)
    if conversation_history:
        recent_history = conversation_history[-4:]
        if recent_history:
            prompt_parts.append("Previous Conversation:")
            for msg in recent_history:
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                prompt_parts.append(f"{role.capitalize()}: {content}")
            prompt_parts.append("")
    
    # Add current question
    prompt_parts.extend([
        "Current Question:",
        user_message,
        "",
        "Instructions:",
        "- Provide a detailed, accurate answer using the regulatory knowledge base",
        "- Include specific citations and section references",
        "- Reference the document findings when relevant",
        "- Be precise and professional",
        "- If the question relates to specific findings, explain them clearly"
    ])
    
    return "\n".join(prompt_parts)


def _extract_citations(response: Dict) -> List[Dict]:
    """
    Extract citations from Bedrock response.
    Same pattern as RAD_api.py
    """
    citations = []
    
    if "citations" not in response:
        return citations
    
    for citation in response["citations"][:5]:  # Limit to 5 citations
        if "retrievedReferences" not in citation:
            continue
            
        for ref in citation["retrievedReferences"]:
            # Extract content and location
            content = ref.get("content", {})
            location = ref.get("location", {})
            
            # Get S3 URI and extract filename
            s3_location = location.get("s3Location", {})
            s3_uri = s3_location.get("uri", "")
            filename = s3_uri.split("/")[-1] if s3_uri else "Regulatory Document"
            
            # Get text content
            text_content = content.get("text", "")
            
            # Get relevance score
            score = ref.get("score", 0)
            
            citations.append({
                "type": "regulatory",
                "reference": filename,
                "text": text_content[:200],  # Limit to 200 chars
                "score": score,
                "uri": s3_uri
            })
    
    return citations


# ============================================================================
# TESTING FUNCTIONS
# ============================================================================

def test_knowledge_base_connection():
    """Test if Knowledge Base is accessible"""
    try:
        bedrock_agent = get_bedrock_agent_client()
        
        # Simple test query
        request = {
            "input": {"text": "What is ICH GCP?"},
            "retrieveAndGenerateConfiguration": {
                "type": "KNOWLEDGE_BASE",
                "knowledgeBaseConfiguration": {
                    "knowledgeBaseId": os.getenv('KNOWLEDGE_BASE_ID'),
                    "modelArn": os.getenv('MODEL_ARN'),
                    "retrievalConfiguration": {
                        "vectorSearchConfiguration": {
                            "numberOfResults": 3
                        }
                    }
                }
            }
        }
        
        response = bedrock_agent.retrieve_and_generate(**request)
        
        print("✅ Knowledge Base connection successful!")
        print(f"Response: {response['output']['text'][:200]}...")
        print(f"Citations: {len(response.get('citations', []))}")
        return True
        
    except Exception as e:
        print(f"❌ Knowledge Base connection failed: {e}")
        return False


async def test_chat():
    """Test the chat function"""
    try:
        response, citations = await chat_with_knowledge_base(
            user_message="What are the requirements for informed consent?",
            document_name="Clinical Trial Protocol v1.0",
            findings_summary="Document has 2 critical findings related to informed consent and primary endpoints.",
            conversation_history=[],
            compliance_score=82.0
        )
        
        print("✅ Chat test successful!")
        print(f"\nResponse:\n{response}\n")
        print(f"Citations: {len(citations)}")
        for i, cite in enumerate(citations, 1):
            print(f"{i}. {cite['reference']}: {cite['text'][:100]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Chat test failed: {e}")
        return False


if __name__ == "__main__":
    import asyncio
    
    print("=" * 60)
    print("Testing Knowledge Base RAG Chat")
    print("=" * 60)
    print()
    
    # Test 1: Connection
    print("Test 1: Knowledge Base Connection")
    print("-" * 60)
    test_knowledge_base_connection()
    print()
    
    # Test 2: Chat
    print("Test 2: Chat Function")
    print("-" * 60)
    asyncio.run(test_chat())
    print()
    
    print("=" * 60)
    print("Testing Complete")
    print("=" * 60)
