"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingService = void 0;
const openai_1 = require("openai");
require("dotenv/config");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class EmbeddingService {
    constructor(logger) {
        this.logger = logger;
        this.openai = new openai_1.OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }
    async getEmbeddings(text) {
        try {
            const response = await this.openai.embeddings.create({
                model: "text-embedding-3-small",
                input: text,
                encoding_format: "float"
            });
            return response.data[0].embedding;
        }
        catch (error) {
            this.logger.error('Error generating embeddings:', error);
            throw new Error(`Failed to generate embeddings: ${error}`);
        }
    }
}
exports.EmbeddingService = EmbeddingService;
