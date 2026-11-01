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


export function chunkText(text: string, filename: string, documentId: string): DocumentChunk[] {
    const rawParagraphs = text
        .split(/\r?\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

    const chunks: DocumentChunk[] = [];

    rawParagraphs.forEach((paragraph) => {
        if (paragraph.length > 600) {
            const sentences = paragraph.split(/(?<=[.?!])\s+/);
            sentences.forEach((sentence) => {
                const trimmed = sentence.trim();
                const tokens = tokenize(trimmed);
                // Keep only if it contains real search keywords
                if (tokens.length >= 1) {
                    chunks.push({
                        id: `${documentId}-chunk-${chunks.length}`,
                        documentId,
                        filename,
                        chunkIndex: chunks.length,
                        text: trimmed,
                        tokens,
                        createdAt: Date.now()
                    });
                }
            });
        } else {
            const tokens = tokenize(paragraph);
            if (tokens.length >= 1) {
                chunks.push({
                    id: `${documentId}-chunk-${chunks.length}`,
                    documentId,
                    filename,
                    chunkIndex: chunks.length,
                    text: paragraph,
                    tokens,
                    createdAt: Date.now()
                });
            }
        }
    });

    return chunks;
}