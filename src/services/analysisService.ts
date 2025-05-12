import { OpenAI } from 'openai';
import { Logger } from '../utils/logger';
import { SYSTEM_PROMPT } from '../config/prompts';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

interface AnalysisContext {
    chunk: string;
    knowledgeBaseData: any[];
}

export class AnalysisService {
    private openai: OpenAI;

    constructor(private logger: Logger) {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async generateAnalysis(context: AnalysisContext[]): Promise<string> {
        try {
            const userPrompt = context.map(({ chunk, knowledgeBaseData }) => `
                Contract Chunk:
                ${chunk}
                
                Relevant Knowledge Base Data:
                ${knowledgeBaseData.map(kb => kb.content).join('\n')}
            `).join('\n\n');
            
            const response = await this.openai.chat.completions.create({
                model: "gpt-4.1-nano",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userPrompt }
                ]
            });
            
            const pdfDoc = await PDFDocument.create();
            pdfDoc.registerFontkit(fontkit);
            
            return response.choices[0].message.content || 'No analysis generated';
        } catch (error: unknown) {
            this.logger.error('Error generating analysis:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to generate analysis: ${errorMessage}`);
        }
    }
} 