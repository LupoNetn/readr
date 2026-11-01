import { documentStore } from './store.js';
import { tokenize } from './chunker.js';
import { SearchResult } from './types.js';

/**
 * Searches stored document chunks using deterministic BM25 ranking.
 * 
 * If no chunk contains matching keywords or the score is below the strict threshold,
 * it returns { found: false, message: "nothing found" }.
 */
export function searchDocument(question: string): SearchResult {
    const queryTokens = tokenize(question);

    // 1. If the question contains no valid keywords
    if (queryTokens.length === 0) {
        return {
            found: false,
            score: 0,
            message: "nothing found"
        };
    }

    const allChunks = documentStore.getAllChunks();

    // 2. If no documents exist in the store
    if (allChunks.length === 0) {
        return {
            found: false,
            score: 0,
            message: "nothing found (no documents uploaded yet)"
        };
    }

    const totalChunks = allChunks.length;
    const avgChunkLength = allChunks.reduce((acc, c) => acc + c.tokens.length, 0) / totalChunks || 1;

    // Standard BM25 hyperparameters
    const k1 = 1.5;
    const b = 0.75;

    // 3. Calculate Inverse Document Frequency (IDF) for each query keyword
    // Rare words get higher score weight; common words get lower weight
    const idf: Record<string, number> = {};
    for (const token of queryTokens) {
        const matchingChunksCount = allChunks.filter(c => c.tokens.includes(token)).length;
        idf[token] = Math.log((totalChunks - matchingChunksCount + 0.5) / (matchingChunksCount + 0.5) + 1);
    }

    // 4. Score every chunk against the query
    let bestChunk = null;
    let highestScore = 0;
    let matchedKeywords: string[] = [];

    for (const chunk of allChunks) {
        let chunkScore = 0;
        const currentMatched: string[] = [];
        const chunkLen = chunk.tokens.length;

        for (const token of queryTokens) {
            // Count how many times the token appears in this chunk
            const termFreq = chunk.tokens.filter(t => t === token).length;

            if (termFreq > 0) {
                currentMatched.push(token);
                // BM25 term weighting formula
                const termScore = (idf[token] * termFreq * (k1 + 1)) /
                    (termFreq + k1 * (1 - b + b * (chunkLen / avgChunkLength)));

                chunkScore += termScore;
            }
        }

        if (chunkScore > highestScore) {
            highestScore = chunkScore;
            bestChunk = chunk;
            matchedKeywords = currentMatched;
        }
    }

    // 5. STRICT THRESHOLD
    // If the score is below minimum confidence or no keywords matched -> "nothing found"
    const MINIMUM_CONFIDENCE_THRESHOLD = 0.6;

    if (!bestChunk || highestScore < MINIMUM_CONFIDENCE_THRESHOLD || matchedKeywords.length === 0) {
        return {
            found: false,
            score: Math.round(highestScore * 100) / 100,
            message: "nothing found"
        };
    }

    return {
        found: true,
        score: Math.round(highestScore * 100) / 100,
        match: {
            filename: bestChunk.filename,
            chunkIndex: bestChunk.chunkIndex,
            text: bestChunk.text,
            matchedTokens: matchedKeywords
        }
    };
}

