import { FileService } from './fileService';
import { EmbeddingService } from './embeddingService';
import { DatabaseService } from './databaseService';
import { AnalysisService } from './analysisService';
import { Logger } from '../utils/logger';

export class ContractProcessor {
    constructor(
        private fileService: FileService,
        private embeddingService: EmbeddingService,
        private databaseService: DatabaseService,
        private analysisService: AnalysisService,
        private logger: Logger
    ) {}

    async processContract(filePath: string): Promise<string> {
        try {
            this.logger.info('Starting contract processing...');

            // Extract text from document
            const text = await this.fileService.extractText(filePath);
            this.logger.info('Text extraction completed');

            // Create chunks from text
            const chunks = this.fileService.createChunks(text, 3000, 200);
            this.logger.info(`Created ${chunks.length} text chunks`);

            // Get embeddings for each chunk
            const embeddings = await Promise.all(
                chunks.map(chunk => this.embeddingService.getEmbeddings(chunk))
            );
            this.logger.info('Generated embeddings for all chunks');

            // Query knowledge base for each chunk
            const knowledgeBaseData = await Promise.all(
                embeddings.map(embedding => this.databaseService.queryKnowledgeBase(embedding))
            );
            this.logger.info('Retrieved knowledge base data');

            // Combine chunks with knowledge base data
            const combinedContext = chunks.map((chunk, index) => ({
                chunk,
                knowledgeBaseData: knowledgeBaseData[index]
            }));

            // Generate analysis
            const analysis = await this.analysisService.generateAnalysis(combinedContext);
            this.logger.info('Analysis generation completed');

            return analysis;
        } catch (error) {
            this.logger.error('Error in contract processing:', error);
            throw error;
        }
    }
} 