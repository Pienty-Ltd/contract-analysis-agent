"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractProcessor = void 0;
class ContractProcessor {
    constructor(fileService, embeddingService, databaseService, analysisService, logger) {
        this.fileService = fileService;
        this.embeddingService = embeddingService;
        this.databaseService = databaseService;
        this.analysisService = analysisService;
        this.logger = logger;
    }
    async processContract(filePath) {
        try {
            this.logger.info('Starting contract processing...');
            // Extract text from document
            const text = await this.fileService.extractText(filePath);
            this.logger.info('Text extraction completed');
            // Create chunks from text
            const chunks = this.fileService.createChunks(text);
            this.logger.info(`Created ${chunks.length} text chunks`);
            // Get embeddings for each chunk
            const embeddings = await Promise.all(chunks.map(chunk => this.embeddingService.getEmbeddings(chunk)));
            this.logger.info('Generated embeddings for all chunks');
            // Query knowledge base for each chunk
            const knowledgeBaseData = await Promise.all(embeddings.map(embedding => this.databaseService.queryKnowledgeBase(embedding)));
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
        }
        catch (error) {
            this.logger.error('Error in contract processing:', error);
            throw error;
        }
    }
}
exports.ContractProcessor = ContractProcessor;
