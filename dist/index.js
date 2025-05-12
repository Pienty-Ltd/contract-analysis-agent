"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const electron_1 = require("electron");
const contractProcessor_1 = require("./services/contractProcessor");
const fileService_1 = require("./services/fileService");
const embeddingService_1 = require("./services/embeddingService");
const databaseService_1 = require("./services/databaseService");
const analysisService_1 = require("./services/analysisService");
const logger_1 = require("./utils/logger");
async function main() {
    try {
        // Initialize services
        const logger = new logger_1.Logger();
        const fileService = new fileService_1.FileService();
        const embeddingService = new embeddingService_1.EmbeddingService(logger);
        const databaseService = new databaseService_1.DatabaseService(logger);
        const analysisService = new analysisService_1.AnalysisService(logger);
        const contractProcessor = new contractProcessor_1.ContractProcessor(fileService, embeddingService, databaseService, analysisService, logger);
        // Show file picker dialog
        const result = await electron_1.dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'Documents', extensions: ['pdf', 'doc', 'docx'] }
            ]
        });
        if (result.canceled) {
            logger.info('File selection cancelled by user');
            electron_1.app.quit();
            return;
        }
        const filePath = result.filePaths[0];
        logger.info(`Selected file: ${filePath}`);
        // Process the contract
        const analysis = await contractProcessor.processContract(filePath);
        // Display results
        logger.info('\nContract Analysis Results:');
        logger.info('==========================');
        logger.info(analysis);
        // Export analysis to PDF
        try {
            const pdfPath = await fileService.exportToPDF(analysis);
            logger.info(`Analysis exported to PDF: ${pdfPath}`);
        }
        catch (error) {
            logger.error('Failed to export PDF:', error);
        }
        // Close the app after analysis
        electron_1.app.quit();
    }
    catch (error) {
        console.error('Error in main process:', error);
        electron_1.app.quit();
    }
}
// Wait for Electron to be ready
electron_1.app.whenReady().then(main);
// Quit when all windows are closed
electron_1.app.on('window-all-closed', () => {
    electron_1.app.quit();
});
