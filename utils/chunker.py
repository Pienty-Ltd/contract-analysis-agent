"""
Text chunking module for splitting text into manageable chunks.
"""
import re
import logging
import os
from typing import List, Optional
import nltk
from dotenv import load_dotenv

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

# Default chunk settings
DEFAULT_CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "500"))
DEFAULT_CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "50"))

# Download necessary NLTK resources
def download_nltk_resources():
    """Download required NLTK resources."""
    try:
        nltk.download('punkt', quiet=True)
        nltk.download('punkt_tab', quiet=True)
        nltk.download('averaged_perceptron_tagger', quiet=True)
    except Exception as e:
        logger.warning(f"Failed to download NLTK resources: {str(e)}")
        logger.warning("Text chunking may not work optimally.")

# Initialize NLTK
download_nltk_resources()

def split_into_sentences(text: str) -> List[str]:
    """
    Split text into individual sentences.
    
    Args:
        text: The text to split.
        
    Returns:
        A list of sentences.
    """
    try:
        sentences = nltk.sent_tokenize(text)
        return sentences
    except Exception as e:
        logger.error(f"Error splitting text into sentences: {str(e)}")
        # Fallback: split on periods, question marks, and exclamation marks
        return re.split(r'(?<=[.!?])\s+', text)

def chunk_text(text: str, chunk_size: Optional[int] = None, chunk_overlap: Optional[int] = None) -> List[str]:
    """
    Split text into chunks of roughly the specified size, trying to break at sentence boundaries.
    
    Args:
        text: The text to chunk.
        chunk_size: The target size (in tokens) for each chunk. Defaults to value from environment variable.
        chunk_overlap: The number of tokens to overlap between chunks. Defaults to value from environment variable.
        
    Returns:
        A list of text chunks.
    """
    if not text:
        logger.warning("Empty text provided for chunking.")
        return []
    
    # Use default values if not provided
    chunk_size = chunk_size or DEFAULT_CHUNK_SIZE
    chunk_overlap = chunk_overlap or DEFAULT_CHUNK_OVERLAP
    
    # Ensure chunk_overlap is less than chunk_size
    if chunk_overlap >= chunk_size:
        logger.warning(f"Chunk overlap ({chunk_overlap}) must be less than chunk size ({chunk_size}). Setting overlap to 10% of chunk size.")
        chunk_overlap = max(1, int(chunk_size * 0.1))  # 10% overlap
    
    try:
        # Split text into sentences
        sentences = split_into_sentences(text)
        
        # Initialize variables
        chunks = []
        current_chunk = []
        current_size = 0
        
        for sentence in sentences:
            # Rough estimation of tokens: split by whitespace
            sentence_tokens = sentence.split()
            sentence_size = len(sentence_tokens)
            
            # If a single sentence is larger than the chunk size, split it
            if sentence_size > chunk_size:
                # If we have content in the current chunk, add it first
                if current_chunk:
                    chunks.append(" ".join(current_chunk))
                    current_chunk = []
                    current_size = 0
                
                # Split the long sentence
                words = sentence_tokens
                for i in range(0, len(words), chunk_size):
                    chunk_words = words[i:i + chunk_size]
                    chunks.append(" ".join(chunk_words))
            
            # If adding this sentence would exceed the chunk size, start a new chunk
            elif current_size + sentence_size > chunk_size:
                # Add the current chunk to the list
                chunks.append(" ".join(current_chunk))
                
                # Start a new chunk with overlap
                overlap_start = max(0, len(current_chunk) - chunk_overlap)
                current_chunk = current_chunk[overlap_start:] + [sentence]
                current_size = len(" ".join(current_chunk).split())
            
            # Otherwise, add the sentence to the current chunk
            else:
                current_chunk.append(sentence)
                current_size += sentence_size
        
        # Add the last chunk if it's not empty
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        
        return chunks
    
    except Exception as e:
        logger.error(f"Error chunking text: {str(e)}")
        
        # Fallback: simple chunking without respecting sentence boundaries
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - chunk_overlap):
            chunk = " ".join(words[i:i + chunk_size])
            chunks.append(chunk)
        
        return chunks 