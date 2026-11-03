import { documentStore } from './store.js';
import { tokenize } from './chunker.js';
import { SearchResult } from './types.js';


export function searchDocument(question: string): SearchResult {
    const queryTokens = tokenize(question);

    if (queryTokens.length === 0) {
        return {
            found: false,
            score: 0,
            message: "nothing found"
        };
    }

    const allChunks = documentStore.getAllChunks();

    
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

    // Calculate Inverse Document Frequency (IDF) for each query keyword
    // Rare words get higher score weight; common words get lower weight
    const idf: Record<string, number> = {};
    for (const token of queryTokens) {
        const matchingChunksCount = allChunks.filter(c => c.tokens.includes(token)).length;
        idf[token] = Math.log((totalChunks - matchingChunksCount + 0.5) / (matchingChunksCount + 0.5) + 1);
    }

    // Score every chunk against the query and filter by strict threshold
    const MINIMUM_CONFIDENCE_THRESHOLD = 0.3;
    const candidates: {
        chunk: (typeof allChunks)[0];
        score: number;
        matchedTokens: string[];
    }[] = [];

    for (const chunk of allChunks) {
        let chunkScore = 0;
        const currentMatched: string[] = [];
        const chunkLen = chunk.tokens.length;

        for (const token of queryTokens) {
            const termFreq = chunk.tokens.filter(t => t === token).length;

            if (termFreq > 0) {
                currentMatched.push(token);
                const termScore = (idf[token] * termFreq * (k1 + 1)) /
                    (termFreq + k1 * (1 - b + b * (chunkLen / avgChunkLength)));

                chunkScore += termScore;
            }
        }

        const keywordMatchRatio = currentMatched.length / queryTokens.length;

        
        if (chunkScore >= MINIMUM_CONFIDENCE_THRESHOLD && keywordMatchRatio >= 0.4) {
            candidates.push({
                chunk,
                score: Math.round(chunkScore * 100) / 100,
                matchedTokens: currentMatched
            });
        }
    }

   
    if (candidates.length === 0) {
        return {
            found: false,
            score: 0,
            message: "nothing found"
        };
    }

    
    candidates.sort((a, b) => b.score - a.score);

    
    const topK = 5;
    const qualifying = candidates.slice(0, topK);

    const matches = qualifying.map(c => ({
        filename: c.chunk.filename,
        chunkIndex: c.chunk.chunkIndex,
        text: c.chunk.text,
        matchedTokens: c.matchedTokens,
        confidenceScore: c.score
    }));

    return {
        found: true,
        score: matches[0].confidenceScore,
        match: matches[0],
        matches
    };
}

