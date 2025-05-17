# Contract Analysis Tool

A Python application for analyzing and revising contracts based on company policies and knowledge stored in a PostgreSQL database.

## Project Overview

The Contract Analysis Tool helps you analyze contracts (in PDF or DOCX format) against your company's knowledge base to identify and revise clauses that conflict with company policies or interests.

### Key Features

- Select PDF or DOCX contract files via a file explorer
- Split contracts into meaningful chunks
- Generate embeddings for each chunk using OpenAI's Embedding API
- Query a PostgreSQL database with pgvector extension to find similar knowledge base entries
- Revise contracts using OpenAI's GPT-4.1-nano model
- Export revised contracts in the original format

## Requirements

- Python 3.8+
- PostgreSQL database with pgvector extension
- OpenAI API key

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/contract-analysis-tool.git
   cd contract-analysis-tool
   ```

2. Create a virtual environment and activate it:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the root directory with the following environment variables:
   ```
   # OpenAI API credentials
   OPENAI_API_KEY=your_openai_api_key_here
   
   # PostgreSQL database connection string
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
   
   # Embedding settings
   EMBEDDING_MODEL=text-embedding-3-small
   
   # Chat completion settings
   CHAT_MODEL=gpt-4.1-nano
   
   # Chunking settings
   CHUNK_SIZE=500
   CHUNK_OVERLAP=50
   ```

## Database Setup

The application requires a PostgreSQL database with the pgvector extension and a `knowledge_base` table with the following schema:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE knowledge_base (
    id SERIAL PRIMARY KEY,
    fp VARCHAR,
    chunk_index INTEGER,
    content TEXT,
    embedding VECTOR(1536),
    meta_info VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    file_id INTEGER,
    organization_id INTEGER,
    is_knowledge_base BOOLEAN DEFAULT TRUE
);
```

## Usage

1. Run the application:
   ```
   python main.py
   ```

2. Follow the on-screen prompts to:
   - Select a contract file (PDF or DOCX)
   - Process and analyze the contract
   - Save the revised contract to a new file

## System Prompt Customization

The system prompt used for contract revision can be customized by editing the `system_prompt.py` file. Modify the `SYSTEM_PROMPT` variable to adjust how the model revises contracts.

## Project Structure

```
project/
├── main.py              # Main application script
├── system_prompt.py     # System prompt configuration
├── requirements.txt     # Dependencies
├── .env                 # Environment variables
├── utils/
│   ├── file_handler.py  # File reading and writing functions
│   ├── chunker.py       # Text chunking functions
│   ├── embedding.py     # Embedding generation functions
│   ├── db.py            # Database connection and query functions
│   └── api.py           # OpenAI API interaction functions
```

## Error Handling

The application includes comprehensive error handling for:
- File operations
- Database connections
- API rate limits
- Invalid inputs

Errors are logged to the console and appropriate user-friendly messages are displayed.

## License

[MIT License](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgements

This project uses the following open-source libraries:
- OpenAI API
- PyPDF2
- python-docx
- psycopg2
- pgvector
- nltk
- spacy
- tkinter
- reportlab
- tqdm 