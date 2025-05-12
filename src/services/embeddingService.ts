import { OpenAI } from 'openai';
import { Logger } from '../utils/logger';
import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config();

export class EmbeddingService {
    private openai: OpenAI;

    constructor(private logger: Logger) {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async getEmbeddings(text: string): Promise<number[]> {
        try {
            const response = await this.openai.embeddings.create({
                model: "text-embedding-3-small",
                input: text,
                encoding_format: "float"
            });

            return response.data[0].embedding;
        } catch (error: unknown) {
            this.logger.error('Error generating embeddings:', error);
            throw new Error(`Failed to generate embeddings: ${error}`);
        }
    }
} 