export interface DocumentChunk {
    id: string;
    documentId: string;
    filename: string;
    chunkIndex: number;
    text: string;
    tokens: string[];
    createdAt: number;
}

export interface DocumentMeta {
    id: string;
    filename: string;
    byteSize: number;
    extension: string;
    uploadedAt: number;
    totalChunks: number;
    preview: string; // first 120 characters snippet
}


export interface ChatHistoryItem {
    id: string;
    question: string;
    answer: string;
    found: boolean;
    confidenceScore?: number;
    sourceFilename?: string;
    timestamp: number;
}

export interface MatchedPassage {
    filename: string;
    chunkIndex: number;
    text: string;
    matchedTokens: string[];
    confidenceScore: number;
}

export interface SearchResult {
    found: boolean;
    score: number;
    match?: MatchedPassage;
    matches?: MatchedPassage[];
    message?: string;
}