"""
Contract Analysis Tool - Main Application

This application allows users to:
1. Select a PDF or DOCX contract file.
2. Split the contract into chunks.
3. Generate embeddings for each chunk.
4. Find similar entries in a knowledge base.
5. Revise the contract using OpenAI's GPT-4.1-nano model.
6. Save the revised contract to a file.
"""
import os
import logging
import sys
import time
from pathlib import Path
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
            sys.exit(1)

# Import utility modules
from utils.file_handler import (
    open_file_dialog, save_file_dialog, read_file, save_file
)
from utils.chunker import chunk_text
from utils.embedding import get_embeddings_batch
from utils.db import test_db_connection, find_similar_entries_batch
from utils.api import get_contract_revision

# Define supported file types
FILE_TYPES = (
    ("PDF Files", "*.pdf"),
    ("Word Documents", "*.docx"),
    ("All Files", "*.*")
)

def display_welcome_message():
    """Display a welcome message to the user."""
    print("\n" + "=" * 80)
    print("WELCOME TO THE CONTRACT ANALYSIS TOOL".center(80))
    print("=" * 80)
    print("\nThis tool helps you analyze and revise contracts")
    print("based on your company's policies and knowledge base.")
    print("\nThe process includes:")
    print("1. Selecting a contract file (PDF or DOCX)")
    print("2. Analyzing the contract against your knowledge base")
    print("3. Revising the contract to align with company policies")
    print("4. Saving the revised contract")
    print("\n" + "=" * 80 + "\n")

def process_contract() -> bool:
    """
    Process a contract file from selection to saving the revised version.
    
    Returns:
        True if successful, False otherwise.
    """
    try:
        # Test database connection
        logger.info("Testing database connection...")
        db_success, db_message = test_db_connection()
        if not db_success:
            print(f"Database connection error: {db_message}")
            print("Please check your database configuration in the .env file.")
            return False
        
        # Step 1: Select a contract file
        print("\nStep 1: Please select a contract file (PDF or DOCX)...")
        file_path = open_file_dialog(FILE_TYPES)
        
        if not file_path:
            print("No file selected. Exiting.")
            return False
        
        print(f"Selected file: {file_path}")
        
        # Step 2: Read the file
        print("\nStep 2: Reading the file content...")
        result = read_file(file_path)
        
        if not result:
            print("Failed to read the file. Please check the file format and try again.")
            return False
        
        contract_text, file_ext = result
        
        # Step 3: Split the text into chunks
        print("\nStep 3: Splitting the contract into chunks...")
        contract_chunks = chunk_text(contract_text)
        
        if not contract_chunks:
            print("Failed to split the contract into chunks. The contract may be empty.")
            return False
        
        print(f"Split the contract into {len(contract_chunks)} chunks.")
        
        # Step 4: Generate embeddings for the chunks
        print("\nStep 4: Generating embeddings for the contract chunks...")
        embeddings = get_embeddings_batch(contract_chunks, show_progress=True)
        
        if not embeddings or all(emb is None for emb in embeddings):
            print("Failed to generate embeddings. Please check your OpenAI API key.")
            return False
        
        print(f"Generated embeddings for {sum(1 for emb in embeddings if emb is not None)} chunks.")
        
        # Step 5: Find similar entries in the knowledge base
        print("\nStep 5: Finding similar entries in the knowledge base...")
        valid_embeddings = [emb for emb in embeddings if emb is not None]
        
        if not valid_embeddings:
            print("No valid embeddings to query the knowledge base.")
            return False
        
        similar_entries = find_similar_entries_batch(valid_embeddings)
        
        total_entries = sum(len(entries) for entries in similar_entries)
        print(f"Found {total_entries} relevant entries in the knowledge base.")
        
        # Step 6: Revise the contract using OpenAI's GPT-4.1-nano
        print("\nStep 6: Revising the contract using OpenAI's GPT-4.1-nano...")
        valid_chunks = [chunk for i, chunk in enumerate(contract_chunks) if embeddings[i] is not None]
        
        # Ensure we have matching chunks and similar entries
        if len(valid_chunks) != len(similar_entries):
            print("Warning: Mismatch between valid chunks and similar entries.")
            # Truncate to the shorter length to avoid errors
            min_len = min(len(valid_chunks), len(similar_entries))
            valid_chunks = valid_chunks[:min_len]
            similar_entries = similar_entries[:min_len]
        
        revised_contract = get_contract_revision(valid_chunks, similar_entries)
        
        if not revised_contract:
            print("Failed to revise the contract. Please check your OpenAI API key and try again.")
            return False
        
        # Step 7: Save the revised contract
        print("\nStep 7: Saving the revised contract...")
        try:
            original_file_name = Path(file_path).stem
            suggested_file_name = f"{original_file_name}_revised{file_ext}"
            
            print("Opening save file dialog...")
            save_path = save_file_dialog(suggested_file_name, FILE_TYPES)
            
            if not save_path:
                print("No save location selected. Exiting without saving.")
                return False
            
            print(f"Attempting to save to: {save_path}")
            logger.info(f"Starting to save revised contract to: {save_path}")
            
            # Ensure the directory exists
            save_dir = os.path.dirname(save_path)
            if save_dir and not os.path.exists(save_dir):
                os.makedirs(save_dir)
            
            # Try to save the file
            success = save_file(revised_contract, save_path)
            
            if not success:
                print(f"Failed to save the revised contract to {save_path}.")
                logger.error(f"Failed to save file to: {save_path}")
                return False
            
            print(f"Revised contract saved successfully to: {save_path}")
            logger.info(f"Successfully saved revised contract to: {save_path}")
            return True
            
        except Exception as e:
            print(f"Error during save operation: {str(e)}")
            logger.error(f"Error during save operation: {str(e)}")
            return False
    
    except Exception as e:
        logger.error(f"Error processing contract: {str(e)}")
        print(f"\nAn error occurred: {str(e)}")
        return False

def main():
    """Main function to run the contract analysis tool."""
    try:
        display_welcome_message()
        
        while True:
            success = process_contract()
            
            if success:
                print("\nContract processing completed successfully!")
            else:
                print("\nContract processing was not completed successfully.")
            
            # Ask if the user wants to process another contract
            choice = input("\nDo you want to process another contract? (y/n): ").strip().lower()
            
            if choice != 'y':
                print("\nThank you for using the Contract Analysis Tool. Goodbye!")
                break
    
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by the user. Exiting...")
    except Exception as e:
        logger.error(f"Unexpected error in main function: {str(e)}")
        print(f"\nAn unexpected error occurred: {str(e)}")
    
    sys.exit(0)

if __name__ == "__main__":
    main() 