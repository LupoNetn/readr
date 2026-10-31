import path from 'node:path';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import Papa from 'papaparse';

export interface ParsedDocument {
    filename: string;
    extension: string;
    text: string;
    byteSize: number;
}

/**
 * Extracts normalized text from an uploaded file buffer based on its extension.
 * Supports: .pdf, .docx, .csv, .txt, .md, .json
 */
export async function parseFile(buffer: Buffer, filename: string): Promise<ParsedDocument> {
    const ext = path.extname(filename).toLowerCase();
    let text = '';

    switch (ext) {
        case '.pdf': {
            const parser = new PDFParse({ data: buffer });
            const result = await parser.getText();
            text = result.text;
            break;
        }

        case '.docx': {
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
            break;
        }

        case '.csv': {
            const rawCsv = buffer.toString('utf-8');
            const parsed = Papa.parse(rawCsv, {
                header: true,
                skipEmptyLines: true,
            });
            // Convert each CSV record into structured key: value lines
            text = (parsed.data as Record<string, unknown>[])
                .map((row, idx) => `Row ${idx + 1}: ` + Object.entries(row).map(([k, v]) => `${k}=${v}`).join(', '))
                .join('\n');
            break;
        }

        case '.txt':
        case '.md':
        case '.json': {
            text = buffer.toString('utf-8');
            break;
        }

        default:
            throw new Error(`Unsupported file type: '${ext}'. Supported extensions: .pdf, .docx, .csv, .txt, .md, .json`);
    }

    // Clean up excessive whitespace
    const cleanedText = text.trim();

    return {
        filename,
        extension: ext,
        text: cleanedText,
        byteSize: buffer.length,
    };
}


