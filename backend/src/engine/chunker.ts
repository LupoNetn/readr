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
    // 1. Line-Wrap Healing (Crucial for PDFs & Books):
    // In PDFs, text wraps every 60-70 characters. If a line ends without terminal punctuation,
    // it's just a visual line break within a sentence, so we join it with a space.
    // Double newlines (\n\n+) indicate true paragraph breaks.
    const normalized = text
        .replace(/([^\.\?\!\:\'\"\n])\r?\n([a-zA-Z0-9])/g, '$1 $2')
        .replace(/\r?\n\s*\r?\n+/g, '\n\n');

    const rawBlocks = normalized
        .split(/\n\n+/)
        .map(b => b.trim())
        .filter(b => b.length > 0);

    const isStructured = filename.endsWith('.csv') || filename.endsWith('.json');
    const passages: string[] = [];
    let pendingPrefix = '';

    for (let i = 0; i < rawBlocks.length; i++) {
        let block = rawBlocks[i];

        // Attach previous orphan/heading if any
        if (pendingPrefix) {
            block = pendingPrefix + '\n' + block;
            pendingPrefix = '';
        }

        // Heading detection (only for prose/documents, never for structured CSV/JSON rows):
        // A heading is short (< 80 chars), has no terminal punctuation (. ? !), and is 1-2 lines
        const isHeading = !isStructured && block.length < 80 && !/[.?!]$/.test(block.trim());

        if (isHeading && i < rawBlocks.length - 1) {
            pendingPrefix = block;
            continue;
        }

        // If paragraph is long (> 800 characters), group sentences into complete 250-600 character passages
        if (block.length > 800) {
            const sentences = block.split(/(?<=[.?!])\s+/);
            let current = '';

            for (const s of sentences) {
                if ((current + ' ' + s).trim().length > 600 && current.length >= 200) {
                    passages.push(current.trim());
                    current = s;
                } else {
                    current = (current + ' ' + s).trim();
                }
            }

            if (current.trim().length > 0) {
                passages.push(current.trim());
            }
        } else {
            passages.push(block);
        }
    }

    // 2. Build indexed DocumentChunks
    const chunks: DocumentChunk[] = [];
    passages.forEach((passage) => {
        const tokens = tokenize(passage);
        if (tokens.length >= 1) {
            chunks.push({
                id: `${documentId}-chunk-${chunks.length}`,
                documentId,
                filename,
                chunkIndex: chunks.length,
                text: passage,
                tokens,
                createdAt: Date.now()
            });
        }
    });

    return chunks;
}