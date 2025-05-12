"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = void 0;
const pdf_lib_1 = require("pdf-lib");
const fs = __importStar(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const mammoth_1 = __importDefault(require("mammoth"));
const electron_1 = require("electron");
class FileService {
    async extractText(filePath) {
        const fileExtension = path_1.default.extname(filePath).toLowerCase();
        if (fileExtension === '.pdf') {
            return await this.extractTextFromPDF(filePath);
        }
        else if (['.doc', '.docx'].includes(fileExtension)) {
            return await this.extractTextFromWord(filePath);
        }
        throw new Error('Unsupported file format');
    }
    async extractTextFromPDF(filePath) {
        try {
            const fileBuffer = await fs.readFile(filePath);
            const pdfDoc = await pdf_lib_1.PDFDocument.load(fileBuffer);
            // TODO: Implement PDF text extraction using pdf-lib
            // For now, return a placeholder
            return 'PDF text extraction to be implemented';
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to extract text from PDF: ${errorMessage}`);
        }
    }
    async extractTextFromWord(filePath) {
        try {
            const fileBuffer = await fs.readFile(filePath);
            const result = await mammoth_1.default.extractRawText({ buffer: fileBuffer });
            return result.value;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to extract text from Word document: ${errorMessage}`);
        }
    }
    createChunks(text, chunkSize = 1000, overlap = 200) {
        if (!text || text.length === 0) {
            return [];
        }
        const chunks = [];
        let startIndex = 0;
        while (startIndex < text.length) {
            // Ensure chunkSize is positive and not larger than text length
            const currentChunkSize = Math.min(chunkSize, text.length - startIndex);
            let endIndex = startIndex + currentChunkSize;
            if (endIndex < text.length) {
                const searchEnd = Math.min(endIndex + 100, text.length);
                const searchText = text.slice(endIndex, searchEnd);
                const lastPeriod = searchText.lastIndexOf('.');
                const lastNewline = searchText.lastIndexOf('\n');
                const breakPoint = Math.max(lastPeriod, lastNewline);
                if (breakPoint !== -1) {
                    endIndex = endIndex + breakPoint + 1;
                }
            }
            else {
                endIndex = text.length;
            }
            // Ensure we don't create empty chunks
            if (endIndex > startIndex) {
                chunks.push(text.slice(startIndex, endIndex));
            }
            // Calculate next start index, ensuring we don't go backwards
            startIndex = Math.max(startIndex + 1, endIndex - overlap);
        }
        return chunks;
    }
    async exportToPDF(content) {
        try {
            // Create a new PDF document
            const pdfDoc = await pdf_lib_1.PDFDocument.create();
            let page = pdfDoc.addPage();
            const { width, height } = page.getSize();
            // Use Times-Roman font which has better Unicode support
            const font = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.TimesRoman);
            // Set font size and line height
            const fontSize = 12;
            const lineHeight = fontSize * 1.5;
            const margin = 50;
            const maxLineWidth = width - margin * 2;
            // Word wrap helper
            function wrapLine(line) {
                const words = line.split(' ');
                let lines = [];
                let currentLine = '';
                for (const word of words) {
                    const testLine = currentLine ? currentLine + ' ' + word : word;
                    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
                    if (testWidth > maxLineWidth) {
                        if (currentLine)
                            lines.push(currentLine);
                        currentLine = word;
                    }
                    else {
                        currentLine = testLine;
                    }
                }
                if (currentLine)
                    lines.push(currentLine);
                return lines;
            }
            // Split content into lines and wrap them
            const rawLines = content.split('\n');
            let y = height - margin;
            for (const rawLine of rawLines) {
                // Replace problematic characters with their ASCII equivalents
                const line = rawLine
                    .replace(/[İ]/g, 'I')
                    .replace(/[ı]/g, 'i')
                    .replace(/[Ğ]/g, 'G')
                    .replace(/[ğ]/g, 'g')
                    .replace(/[Ü]/g, 'U')
                    .replace(/[ü]/g, 'u')
                    .replace(/[Ş]/g, 'S')
                    .replace(/[ş]/g, 's')
                    .replace(/[Ö]/g, 'O')
                    .replace(/[ö]/g, 'o')
                    .replace(/[Ç]/g, 'C')
                    .replace(/[ç]/g, 'c');
                const wrappedLines = wrapLine(line);
                for (const wrappedLine of wrappedLines) {
                    if (y < margin + lineHeight) {
                        page = pdfDoc.addPage();
                        y = height - margin;
                    }
                    page.drawText(wrappedLine, {
                        x: margin,
                        y,
                        size: fontSize,
                        font,
                        color: (0, pdf_lib_1.rgb)(0, 0, 0)
                    });
                    y -= lineHeight;
                }
            }
            // Show save dialog
            const { filePath } = await electron_1.dialog.showSaveDialog({
                title: 'Save Analysis as PDF',
                defaultPath: 'contract-analysis.pdf',
                filters: [
                    { name: 'PDF Files', extensions: ['pdf'] }
                ]
            });
            if (!filePath) {
                throw new Error('Save operation cancelled by user');
            }
            // Save the PDF
            const pdfBytes = await pdfDoc.save();
            await fs.writeFile(filePath, pdfBytes);
            return filePath;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to export PDF: ${errorMessage}`);
        }
    }
}
exports.FileService = FileService;
