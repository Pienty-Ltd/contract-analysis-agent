# Contract Analysis Agent

An AI-powered contract analysis system that processes PDF and Word documents, extracts text, creates embeddings, and analyzes contracts using OpenAI's GPT-4 and knowledge base data.

## Features

- PDF and Word document processing
- Text extraction and chunking
- OpenAI embeddings generation
- PostgreSQL with pgvector for vector similarity search
- AI-powered contract analysis
- RESTful API endpoint for document upload and analysis

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher) with pgvector extension
- OpenAI API key

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd contract-analysis-agent
```

2. Install dependencies:
```bash
npm install
```

3. Create a PostgreSQL database and enable the pgvector extension:
```sql
CREATE DATABASE contract_analysis;
\c contract_analysis
CREATE EXTENSION vector;
```

4. Create the knowledge_base table:
```sql
CREATE TABLE knowledge_base (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

5. Copy the environment file and update the variables:
```bash
cp .env.example .env
```

6. Update the `.env` file with your configuration:
- Set your OpenAI API key
- Configure your PostgreSQL connection string
- Adjust other settings as needed

7. Create the uploads directory:
```bash
mkdir uploads
```

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## API Usage

### Analyze Contract

**Endpoint:** `POST /analyze-contract`

**Request:**
- Content-Type: multipart/form-data
- Body: 
  - `contract`: PDF or Word document file

**Response:**
```json
{
    "analysis": "Detailed contract analysis..."
}
```

## Project Structure

```
src/
├── config/
│   └── prompts.ts
├── middleware/
│   └── upload.ts
├── services/
│   └── contractProcessor.ts
├── utils/
│   ├── embeddings.ts
│   └── textChunker.ts
└── index.ts
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT 