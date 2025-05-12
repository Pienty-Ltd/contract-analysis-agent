import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import { dialog } from 'electron';

export class FileService {
    async extractText(filePath: string): Promise<string> {
        const fileExtension = path.extname(filePath).toLowerCase();
        
        if (fileExtension === '.pdf') {
            return await this.extractTextFromPDF(filePath);
        } else if (['.doc', '.docx'].includes(fileExtension)) {
            return await this.extractTextFromWord(filePath);
        }
        
        throw new Error('Unsupported file format');
    }

    private async extractTextFromPDF(filePath: string): Promise<string> {
        try {
            const fileBuffer = await fs.readFile(filePath);
            const pdfDoc = await PDFDocument.load(fileBuffer);
            // TODO: Implement PDF text extraction using pdf-lib
            // For now, return a placeholder
            return 'PDF text extraction to be implemented';
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to extract text from PDF: ${errorMessage}`);
        }
    }

    private async extractTextFromWord(filePath: string): Promise<string> {
        try {
            const fileBuffer = await fs.readFile(filePath);
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            return result.value;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to extract text from Word document: ${errorMessage}`);
        }
    }

    createChunks(text: string, chunkSize: number = 500, overlap: number = 100): string[] {
        if (!text || text.length === 0) {
            return [];
        }

        const chunks: string[] = [];
        let startIndex = 0;

        while (startIndex < text.length) {
            // Calculate the end index for this chunk
            let endIndex = Math.min(startIndex + chunkSize, text.length);
            
            // If we're not at the end of the text, try to find a good breaking point
            if (endIndex < text.length) {
                // Look for the last period or newline within the last 100 characters of the chunk
                const searchStart = Math.max(startIndex, endIndex - 100);
                const searchText = text.slice(searchStart, endIndex);
                
                const lastPeriod = searchText.lastIndexOf('.');
                const lastNewline = searchText.lastIndexOf('\n');
                const breakPoint = Math.max(lastPeriod, lastNewline);
                
                if (breakPoint !== -1) {
                    endIndex = searchStart + breakPoint + 1;
                }
            }

            // Add the chunk if it's not empty
            if (endIndex > startIndex) {
                chunks.push(text.slice(startIndex, endIndex));
            }

            // Move to the next chunk, considering overlap
            startIndex = endIndex - overlap;
        }

        console.log(`Created ${chunks.length} chunks from the document`);
        return chunks;
    }

    async exportToPDF(content: string): Promise<string> {
        try {
            // Create a new PDF document
            const pdfDoc = await PDFDocument.create();
            let page = pdfDoc.addPage();
            const { width, height } = page.getSize();
            
            // Embed a Unicode TTF font
            const fontPath = path.join(__dirname, '../fonts/DejaVuSans.ttf');
            const fontBytes = await fs.readFile(fontPath);
            const font = await pdfDoc.embedFont(fontBytes, { subset: true });
            
            // Set font size and line height
            const fontSize = 12;
            const lineHeight = fontSize * 1.5;
            const margin = 50;
            const maxLineWidth = width - margin * 2;
            
            // Word wrap helper
            function wrapLine(line: string): string[] {
                const words = line.split(' ');
                let lines: string[] = [];
                let currentLine = '';
                for (const word of words) {
                    const testLine = currentLine ? currentLine + ' ' + word : word;
                    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
                    if (testWidth > maxLineWidth) {
                        if (currentLine) lines.push(currentLine);
                        currentLine = word;
                    } else {
                        currentLine = testLine;
                    }
                }
                if (currentLine) lines.push(currentLine);
                return lines;
            }
            
            // Split content into lines and wrap them
            const rawLines = content.split('\n');
            let y = height - margin;
            for (const rawLine of rawLines) {
                const wrappedLines = wrapLine(rawLine);
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
                        color: rgb(0, 0, 0)
                    });
                    y -= lineHeight;
                }
            }
            
            // Show save dialog
            const { filePath } = await dialog.showSaveDialog({
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
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to export PDF: ${errorMessage}`);
        }
    }
} 