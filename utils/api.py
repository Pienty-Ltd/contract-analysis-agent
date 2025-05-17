"""
OpenAI API integration module for chat completions.
"""
import os
import time
import logging
from typing import List, Dict, Any, Optional, Union
import openai
from dotenv import load_dotenv
from system_prompt import SYSTEM_PROMPT

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables with encoding handling
try:
    load_dotenv(encoding='utf-8')
except UnicodeDecodeError:
    try:
        load_dotenv(encoding='utf-16')
    except UnicodeDecodeError:
        try:
            load_dotenv(encoding='latin1')
        except Exception as e:
            logger.error(f"Failed to load .env file: {str(e)}")

# OpenAI API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    logger.error("OPENAI_API_KEY not found in environment variables.")

# Chat model to use
CHAT_MODEL = os.getenv("CHAT_MODEL", "gpt-4.1-nano")

# Initialize OpenAI client
client = openai.OpenAI(api_key=OPENAI_API_KEY)

def create_contract_revision_prompt(contract_chunks: List[str], knowledge_entries: List[List[Dict[str, Any]]]) -> List[Dict[str, str]]:
    """
    Create a prompt for contract revision using contract chunks and knowledge base entries.
    
    Args:
        contract_chunks: List of text chunks from the contract.
        knowledge_entries: List of lists of knowledge base entries for each chunk.
        
    Returns:
        A list of message dictionaries for the OpenAI chat completions API.
    """
    # Create the system message
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT}
    ]
    
    # Combine contract chunks into a single string
    contract_text = "\n\n".join(contract_chunks)
    
    # Extract relevant knowledge base entries
    knowledge_text = ""
    
    # Deduplicate knowledge entries by content
    seen_contents = set()
    for chunk_entries in knowledge_entries:
        for entry in chunk_entries:
            content = entry.get("content", "")
            if content and content not in seen_contents:
                seen_contents.add(content)
                # Add metadata if available
                meta_info = entry.get("meta_info", "")
                if meta_info:
                    knowledge_text += f"--- Metadata: {meta_info} ---\n"
                knowledge_text += content + "\n\n"
    
    # Create the user message with contract and knowledge base
    user_message = f"""
Please review and revise the following contract based on our company policies and interests.

--- CONTRACT TEXT ---
{contract_text}

--- COMPANY POLICIES AND KNOWLEDGE BASE ---
{knowledge_text}

Please provide a revised version of the contract that aligns with our company policies and interests.
Make changes only to clauses that conflict with our policies or interests.
Maintain the original structure and format of the contract.
"""
    
    messages.append({"role": "user", "content": user_message})
    
    return messages

def get_contract_revision(contract_chunks: List[str], knowledge_entries: List[List[Dict[str, Any]]],
                          model: Optional[str] = None) -> Optional[str]:
    """
    Get a revised version of the contract using the OpenAI Chat API.
    
    Args:
        contract_chunks: List of text chunks from the contract.
        knowledge_entries: List of lists of knowledge base entries for each chunk.
        model: The model to use for chat completion. Defaults to model specified in environment variable.
        
    Returns:
        The revised contract text, or None if an error occurred.
    """
    model = model or CHAT_MODEL
    
    try:
        # Create the prompt
        messages = create_contract_revision_prompt(contract_chunks, knowledge_entries)
        
        # Retry mechanism for API rate limits
        max_retries = 3
        retry_delay = 5  # seconds
        
        for attempt in range(max_retries):
            try:
                logger.info(f"Sending request to OpenAI API using model: {model}")
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.2,  # Lower temperature for more consistent output
                    max_tokens=8000,  # Adjust as needed for your contract size
                )
                
                revised_contract = response.choices[0].message.content
                return revised_contract
            
            except openai.RateLimitError:
                if attempt < max_retries - 1:
                    wait_time = retry_delay * (2 ** attempt)  # Exponential backoff
                    logger.warning(f"Rate limit exceeded. Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    logger.error("Rate limit exceeded and max retries reached.")
                    return None
            
            except Exception as e:
                logger.error(f"Error in chat completion: {str(e)}")
                return None
    
    except Exception as e:
        logger.error(f"Unexpected error in get_contract_revision: {str(e)}")
        return None 