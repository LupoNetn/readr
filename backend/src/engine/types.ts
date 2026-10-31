export interface DocumentChunk {
    id: string;
    documentId: string;
    filename: string;
    chunkIndex: number;
    text: string;
    tokens: string[];
    createdAt: number;
}


export interface SearchResult {
    found: boolean;
    score: number;
    match?: {
        filename: string;
        chunkIndex: number;
        text: string;
        matchedTokens: string[];
    }
    message?: string;
}