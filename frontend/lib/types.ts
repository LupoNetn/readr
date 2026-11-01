export interface SourceMatch {
    filename: string;
    chunkIndex: number;
    sourceText: string;
    matchedKeywords?: string[];
    matchedTokens?: string[];
    confidenceScore: number;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    source?: SourceMatch | null;
    isFound?: boolean;
    isStreaming?: boolean;
    timestamp: number;
}

export interface Conversation {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: number;
}

export interface DocumentMeta {
    id: string;
    filename: string;
    byteSize: number;
    extension: string;
    uploadedAt: number;
    totalChunks: number;
    preview: string;
}

export interface HistoryRecord {
    id: string;
    question: string;
    answer: string;
    found: boolean;
    confidenceScore?: number;
    sourceFilename?: string;
    timestamp: number;
}
