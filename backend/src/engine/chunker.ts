import { DocumentChunk } from "./types.js";

// Words with low informational value that shouldn't skew keyword search
const STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'were', 'will', 'with', 'what', 'where', 'when', 'who',
    'how', 'why', 'can', 'could', 'should', 'would', 'do', 'does', 'did',
    'this', 'these', 'those', 'they', 'them', 'their', 'we', 'our', 'you', 'your'
]);


export function tokenize(text: string): string[] {
    const rawWords = text.toLowerCase().match(/[a-z0-9]+/g) || [];
    return rawWords.filter(word => !STOP_WORDS.has(word) && word.length > 1);
}

/**
 * Splits extracted document text into clean, searchable paragraph or sentence chunks.
 */
export function chunkText(text: string, filename: string, documentId: string): DocumentChunk[] {
    // 1. Split raw text by double line breaks (paragraphs)
    const rawParagraphs = text
        .split(/\r?\n\s*\r?\n/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

    const chunks: DocumentChunk[] = [];

    rawParagraphs.forEach((paragraph) => {
        // 2. If a paragraph is unusually long (> 600 chars), split by sentences
        if (paragraph.length > 600) {
            const sentences = paragraph.split(/(?<=[.?!])\s+/);
            sentences.forEach((sentence) => {
                const trimmed = sentence.trim();
                if (trimmed.length > 10) {
                    chunks.push({
                        id: `${documentId}-chunk-${chunks.length}`,
                        documentId,
                        filename,
                        chunkIndex: chunks.length,
                        text: trimmed,
                        tokens: tokenize(trimmed),
                        createdAt: Date.now()
                    });
                }
            });
        } else {
            // Keep normal sized paragraphs intact
            chunks.push({
                id: `${documentId}-chunk-${chunks.length}`,
                documentId,
                filename,
                chunkIndex: chunks.length,
                text: paragraph,
                tokens: tokenize(paragraph),
                createdAt: Date.now()
            });
        }
    });

    return chunks;
}