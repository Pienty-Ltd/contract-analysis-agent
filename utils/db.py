"""
Database module for querying the pgvector-enabled PostgreSQL database.
"""
import os
import logging
import psycopg2
from psycopg2.extras import Json
from typing import List, Dict, Any, Optional, Tuple
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

# Database connection parameters
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Check if database URL is provided
if not DATABASE_URL:
    logger.warning("DATABASE_URL not found in environment variables. Database operations will fail.")

def get_db_connection():
    """
    Create a connection to the PostgreSQL database.
    
    Returns:
        psycopg2 connection object or None if connection failed.
    """
    try:
        connection = psycopg2.connect(DATABASE_URL)
        
        # Create pgvector extension if it doesn't exist
        with connection.cursor() as cursor:
            cursor.execute('CREATE EXTENSION IF NOT EXISTS vector;')
            connection.commit()
        
        return connection
    
    except Exception as e:
        logger.error(f"Error connecting to the database: {str(e)}")
        return None

def find_similar_entries(embedding: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Find the most similar entries in the knowledge_base table using cosine similarity.
    
    Args:
        embedding: The embedding vector to compare against.
        top_k: Number of similar entries to return.
        
    Returns:
        List of dictionaries containing the similar entries.
    """
    if not embedding:
        logger.error("No embedding provided for similarity search.")
        return []
    
    try:
        connection = get_db_connection()
        if not connection:
            return []
        
        with connection.cursor() as cursor:
            # Query to find the most similar entries using cosine similarity
            query = """
            SELECT id, fp, chunk_index, content, meta_info, 
                   created_at, updated_at, file_id, organization_id, 
                   is_knowledge_base, embedding <=> %s::vector AS similarity
            FROM knowledge_base
            WHERE is_knowledge_base = TRUE
            ORDER BY similarity ASC
            LIMIT %s;
            """
            
            cursor.execute(query, (embedding, top_k))
            columns = [desc[0] for desc in cursor.description]
            results = []
            
            for row in cursor.fetchall():
                result = dict(zip(columns, row))
                # Don't include the embedding in the result to save memory
                if 'embedding' in result:
                    del result['embedding']
                results.append(result)
        
        connection.close()
        return results
    
    except Exception as e:
        logger.error(f"Error finding similar entries: {str(e)}")
        
        # Close connection if it exists
        if 'connection' in locals() and connection:
            connection.close()
        
        return []

def find_similar_entries_batch(embeddings: List[List[float]], top_k: int = 5) -> List[List[Dict[str, Any]]]:
    """
    Find the most similar entries for multiple embeddings.
    
    Args:
        embeddings: List of embedding vectors.
        top_k: Number of similar entries to return for each embedding.
        
    Returns:
        List of lists of dictionaries containing the similar entries.
    """
    results = []
    
    for embedding in embeddings:
        similar_entries = find_similar_entries(embedding, top_k)
        results.append(similar_entries)
    
    return results

def test_db_connection() -> Tuple[bool, str]:
    """
    Test the database connection and check if the knowledge_base table exists.
    
    Returns:
        A tuple of (success: bool, message: str).
    """
    try:
        connection = get_db_connection()
        if not connection:
            return False, "Failed to connect to the database."
        
        with connection.cursor() as cursor:
            # Check if the knowledge_base table exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'knowledge_base'
                );
            """)
            
            table_exists = cursor.fetchone()[0]
            
            if not table_exists:
                connection.close()
                return False, "The 'knowledge_base' table does not exist in the database."
            
            # Check if the pgvector extension is installed
            cursor.execute("SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector');")
            vector_exists = cursor.fetchone()[0]
            
            if not vector_exists:
                connection.close()
                return False, "The 'pgvector' extension is not installed in the database."
            
            # Check if the required columns exist in the knowledge_base table
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'knowledge_base';
            """)
            
            columns = [row[0] for row in cursor.fetchall()]
            required_columns = ['id', 'fp', 'chunk_index', 'content', 'embedding', 'is_knowledge_base']
            
            missing_columns = [col for col in required_columns if col not in columns]
            
            if missing_columns:
                connection.close()
                return False, f"The 'knowledge_base' table is missing required columns: {', '.join(missing_columns)}"
        
        connection.close()
        return True, "Database connection successful. The 'knowledge_base' table exists with all required columns."
    
    except Exception as e:
        logger.error(f"Error testing database connection: {str(e)}")
        
        # Close connection if it exists
        if 'connection' in locals() and connection:
            connection.close()
        
        return False, f"Error testing database connection: {str(e)}" 