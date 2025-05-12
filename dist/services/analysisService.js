"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisService = void 0;
const openai_1 = require("openai");
const prompts_1 = require("../config/prompts");
class AnalysisService {
    constructor(logger) {
        this.logger = logger;
        this.openai = new openai_1.OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }
    async generateAnalysis(context) {
        try {
            const userPrompt = context.map(({ chunk, knowledgeBaseData }) => `
                Contract Chunk:
                ${chunk}
                
                Relevant Knowledge Base Data:
                ${knowledgeBaseData.map(kb => kb.content).join('\n')}
            `).join('\n\n');
            const response = await this.openai.chat.completions.create({
                model: "gpt-4.1",
                messages: [
                    { role: "system", content: prompts_1.SYSTEM_PROMPT },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.7
            });
            return response.choices[0].message.content || 'No analysis generated';
        }
        catch (error) {
            this.logger.error('Error generating analysis:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to generate analysis: ${errorMessage}`);
        }
    }
}
exports.AnalysisService = AnalysisService;
