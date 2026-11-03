import { DocumentChunk } from "./types.js";


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

        
        if (pendingPrefix) {
            block = pendingPrefix + '\n' + block;
            pendingPrefix = '';
        }

       
        const isHeading = !isStructured && block.length < 80 && !/[.?!]$/.test(block.trim());

        if (isHeading && i < rawBlocks.length - 1) {
            pendingPrefix = block;
            continue;
        }

        
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