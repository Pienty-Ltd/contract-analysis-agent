declare module 'mammoth' {
    interface ExtractResult {
        value: string;
        messages: any[];
    }
    
    function extractRawText(options: { buffer: Buffer }): Promise<ExtractResult>;
} 