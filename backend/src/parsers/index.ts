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
            // Convert each CSV record into clean, readable key: value lines
            // Separated by double newlines so each row is an independent, discrete passage
            text = (parsed.data as Record<string, unknown>[])
                .map((row) => Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(', '))
                .join('\n\n');
            break;
        }

        case '.json': {
            const raw = buffer.toString('utf-8');
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    // Array of records (e.g. database dump or objects)
                    text = parsed
                        .map((item) =>
                            typeof item === 'object' && item !== null
                                ? Object.entries(item).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(', ')
                                : String(item)
                        )
                        .join('\n\n');
                } else if (typeof parsed === 'object' && parsed !== null) {
                    text = Object.entries(parsed)
                        .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                        .join('\n\n');
                } else {
                    text = raw;
                }
            } catch {
                text = raw;
            }
            break;
        }

        case '.txt':
        case '.md': {
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


