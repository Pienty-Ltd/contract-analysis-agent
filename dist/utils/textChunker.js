"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChunks = createChunks;
function createChunks(text, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    let startIndex = 0;
    while (startIndex < text.length) {
        let endIndex = startIndex + chunkSize;
        // If we're not at the end of the text, try to find a good breaking point
        if (endIndex < text.length) {
            // Look for the last period or newline within the last 100 characters
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
        chunks.push(text.slice(startIndex, endIndex));
        startIndex = endIndex - overlap;
    }
    return chunks;
}
