"""
Embedding generation module using OpenAI's API.
"""
import os
import time
import logging
from typing import List, Dict, Any, Optional
import openai
from dotenv import load_dotenv
from tqdm import tqdm

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

# Embedding model to use
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")

# Initialize OpenAI client
client = openai.OpenAI(api_key=OPENAI_API_KEY)

def get_embedding(text: str, model: Optional[str] = None) -> Optional[List[float]]:
    """
    Get embedding for a single text using OpenAI's Embedding API.
    
    Args:
        text: The text to generate an embedding for.
        model: The embedding model to use. Defaults to model specified in environment variable.
        
    Returns:
        The embedding as a list of floats, or None if an error occurred.
    """
    if not text.strip():
        logger.warning("Empty text provided for embedding.")
        return None
    
    model = model or EMBEDDING_MODEL
    
    try:
        # Retry mechanism for API rate limits
        max_retries = 3
        retry_delay = 5  # seconds
        
        for attempt in range(max_retries):
            try:
                response = client.embeddings.create(
                    model=model,
                    input=text
                )
                return response.data[0].embedding
            
            except openai.RateLimitError:
                if attempt < max_retries - 1:
                    wait_time = retry_delay * (2 ** attempt)  # Exponential backoff
                    logger.warning(f"Rate limit exceeded. Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    logger.error("Rate limit exceeded and max retries reached.")
                    return None
            
            except Exception as e:
                logger.error(f"Error generating embedding: {str(e)}")
                return None
    
    except Exception as e:
        logger.error(f"Unexpected error in get_embedding: {str(e)}")
        return None

def get_embeddings_batch(texts: List[str], model: Optional[str] = None, 
                         batch_size: int = 10, show_progress: bool = True) -> List[Optional[List[float]]]:
    """
    Get embeddings for a batch of texts using OpenAI's Embedding API.
    
    Args:
        texts: List of texts to generate embeddings for.
        model: The embedding model to use. Defaults to model specified in environment variable.
        batch_size: Number of embeddings to generate in each API call.
        show_progress: Whether to show a progress bar.
        
    Returns:
        List of embeddings (each as a list of floats), with None for failed embeddings.
    """
    model = model or EMBEDDING_MODEL
    
    # Remove empty texts
    texts = [text for text in texts if text.strip()]
    
    if not texts:
        logger.warning("No valid texts provided for embedding.")
        return []
    
    # Initialize result list with None values
    embeddings = [None] * len(texts)
    
    try:
        # Process in batches
        for i in tqdm(range(0, len(texts), batch_size), disable=not show_progress, 
                     desc="Generating embeddings"):
            batch_texts = texts[i:i + batch_size]
            
            # Retry mechanism for API rate limits
            max_retries = 3
            retry_delay = 5  # seconds
            
            for attempt in range(max_retries):
                try:
                    response = client.embeddings.create(
                        model=model,
                        input=batch_texts
                    )
                    
                    # Store embeddings in the result list
                    for j, embedding_data in enumerate(response.data):
                        embeddings[i + j] = embedding_data.embedding
                    
                    break  # Exit retry loop if successful
                
                except openai.RateLimitError:
                    if attempt < max_retries - 1:
                        wait_time = retry_delay * (2 ** attempt)  # Exponential backoff
                        logger.warning(f"Rate limit exceeded. Retrying in {wait_time} seconds...")
                        time.sleep(wait_time)
                    else:
                        logger.error("Rate limit exceeded and max retries reached.")
                
                except Exception as e:
                    logger.error(f"Error generating embeddings batch: {str(e)}")
                    break  # Exit retry loop if other error
    
    except Exception as e:
        logger.error(f"Unexpected error in get_embeddings_batch: {str(e)}")
    
    return embeddings 