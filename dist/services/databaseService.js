"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const pg_1 = require("pg");
class DatabaseService {
    constructor(logger) {
        this.logger = logger;
        this.pool = new pg_1.Pool({
            connectionString: process.env.DATABASE_URL
        });
    }
    async queryKnowledgeBase(embedding) {
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
        }
        catch (error) {
            this.logger.error('Error querying knowledge base:', error);
            throw new Error(`Failed to query knowledge base: ${error}`);
        }
    }
    async close() {
        try {
            await this.pool.end();
        }
        catch (error) {
            this.logger.error('Error closing database connection:', error);
            throw new Error(`Failed to close database connection: ${error}`);
        }
    }
}
exports.DatabaseService = DatabaseService;
