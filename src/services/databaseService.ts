import { Pool } from 'pg';
import { Logger } from '../utils/logger';

export class DatabaseService {
    private pool: Pool;

    constructor(private logger: Logger) {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });
    }

    async queryKnowledgeBase(embedding: number[]): Promise<any[]> {
        try {
            // Ensure embedding is properly formatted as an array
            const formattedEmbedding = `[${embedding.join(',')}]`;
            
            const query = `
                SELECT 
                    content,
                    1 - (embedding <=> $1::vector) as similarity
                FROM knowledge_base
                ORDER BY embedding <=> $1::vector
                LIMIT 5
            `;
            
            const result = await this.pool.query(query, [formattedEmbedding]);
            return result.rows;
        } catch (error) {
            this.logger.error('Error querying knowledge base:', error);
            throw new Error(`Failed to query knowledge base: ${error}`);
        }
    }

    async close(): Promise<void> {
        try {
            await this.pool.end();
        } catch (error) {
            this.logger.error('Error closing database connection:', error);
            throw new Error(`Failed to close database connection: ${error}`);
        }
    }
} 