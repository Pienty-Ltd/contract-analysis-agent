"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmbeddings = getEmbeddings;
const openai_1 = require("openai");
const openai = new openai_1.OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
async function getEmbeddings(text) {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
            encoding_format: "float"
        });
        return response.data[0].embedding;
    }
    catch (error) {
        console.error('Error generating embeddings:', error);
        throw error;
    }
}
