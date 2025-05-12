import 'dotenv/config';
import { app, dialog } from 'electron';
import { ContractProcessor } from './services/contractProcessor';
import { FileService } from './services/fileService';
import { EmbeddingService } from './services/embeddingService';
import { DatabaseService } from './services/databaseService';
import { AnalysisService } from './services/analysisService';
import { Logger } from './utils/logger';

async function main() {
    try {
        // Initialize services
        const logger = new Logger();
        const fileService = new FileService();
        const embeddingService = new EmbeddingService(logger);
        const databaseService = new DatabaseService(logger);
        const analysisService = new AnalysisService(logger);
        
        const contractProcessor = new ContractProcessor(
            fileService,
            embeddingService,
            databaseService,
            analysisService,
            logger
        );

        // Show file picker dialog
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'Documents', extensions: ['pdf', 'doc', 'docx'] }
            ]
        });

        if (result.canceled) {
            logger.info('File selection cancelled by user');
            app.quit();
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
        } catch (error) {
            logger.error('Failed to export PDF:', error);
        }

        // Close the app after analysis
        app.quit();

    } catch (error) {
        console.error('Error in main process:', error);
        app.quit();
    }
}

// Wait for Electron to be ready
app.whenReady().then(main);

// Quit when all windows are closed
app.on('window-all-closed', () => {
    app.quit();
});
