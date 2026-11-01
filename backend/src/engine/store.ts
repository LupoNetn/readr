import fs from 'node:fs';
import path from 'node:path';
import { DocumentChunk, DocumentMeta, ChatHistoryItem } from './types.js';

interface StoreSchema {
    documents: DocumentMeta[];
    chunks: DocumentChunk[];
    history: ChatHistoryItem[];
}

/**
 * In-Memory Store with Local Disk Persistence (Write-Through Pattern).
 * 
 * Manages 3 collections:
 * 1. `chunks`: Search units for the BM25 engine.
 * 2. `documents`: Metadata summary for the frontend Memory Page.
 * 3. `history`: Chat query/answer logs for the frontend History view.
 */
class DocumentStore {
    private documents: DocumentMeta[] = [];
    private chunks: DocumentChunk[] = [];
    private history: ChatHistoryItem[] = [];

    // Path where store data will be saved
    private readonly storagePath: string;

    constructor() {
        this.storagePath = path.resolve(process.cwd(), 'data', 'store.json');
        this.loadFromDisk();
    }

    /**
     * Reads persisted data from disk on server startup.
     * If the file doesn't exist yet, it initializes with clean empty arrays.
     */
    private loadFromDisk(): void {
        try {
            if (fs.existsSync(this.storagePath)) {
                const raw = fs.readFileSync(this.storagePath, 'utf-8');
                const parsed: StoreSchema = JSON.parse(raw);

                this.documents = Array.isArray(parsed.documents) ? parsed.documents : [];
                this.chunks = Array.isArray(parsed.chunks) ? parsed.chunks : [];
                this.history = Array.isArray(parsed.history) ? parsed.history : [];

                console.log(
                    `[Store] Initialized: ${this.documents.length} documents, ` +
                    `${this.chunks.length} chunks, ${this.history.length} history items loaded from disk.`
                );
            } else {
                console.log('[Store] No existing store.json found. Starting with fresh in-memory state.');
            }
        } catch (error) {
            console.error('[Store] Error loading store.json from disk. Initializing empty:', error);
            this.documents = [];
            this.chunks = [];
            this.history = [];
        }
    }

    /**
     * Flushes current in-memory state to disk.
     * Uses atomic directory creation to prevent path errors.
     */
    private persist(): void {
        try {
            const dir = path.dirname(this.storagePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const payload: StoreSchema = {
                documents: this.documents,
                chunks: this.chunks,
                history: this.history,
            };

            fs.writeFileSync(this.storagePath, JSON.stringify(payload, null, 2), 'utf-8');
        } catch (error) {
            console.error('[Store] Failed to persist data to disk:', error);
        }
    }

    // ==========================================
    // DOCUMENT & CHUNK MANAGEMENT (Ingestion)
    // ==========================================

    /**
     * Saves a new document's metadata (for Memory Page) and its chunks (for Search).
     */
    public addDocument(meta: DocumentMeta, chunks: DocumentChunk[]): void {
        // If a document with this ID already exists, replace it
        this.documents = this.documents.filter(d => d.id !== meta.id);
        this.documents.push(meta);

        // Remove old chunks if re-uploading, then append new ones
        this.chunks = this.chunks.filter(c => c.documentId !== meta.id);
        this.chunks.push(...chunks);

        this.persist();
    }

    /**
     * Returns all document metadata summaries.
     * Powers the frontend "Memory Page" list.
     */
    public getDocuments(): DocumentMeta[] {
        // Return shallow copy sorted by newest upload first
        return [...this.documents].sort((a, b) => b.uploadedAt - a.uploadedAt);
    }

    /**
     * Returns all chunks across all documents.
     * Powers the BM25 search algorithm.
     */
    public getAllChunks(): DocumentChunk[] {
        return this.chunks;
    }

    /**
     * Deletes a document by ID, cleaning up both its metadata and all its chunks.
     */
    public deleteDocument(documentId: string): boolean {
        const initialDocCount = this.documents.length;
        this.documents = this.documents.filter(d => d.id !== documentId);
        this.chunks = this.chunks.filter(c => c.documentId !== documentId);

        if (this.documents.length !== initialDocCount) {
            this.persist();
            return true;
        }
        return false;
    }

    // ==========================================
    // CHAT HISTORY MANAGEMENT
    // ==========================================

    /**
     * Records a search interaction (question asked + answer returned).
     */
    public addHistoryItem(item: ChatHistoryItem): void {
        this.history.unshift(item); // Prepend so newest is at the top

        // Keep history manageable (e.g., last 200 queries)
        if (this.history.length > 200) {
            this.history = this.history.slice(0, 200);
        }

        this.persist();
    }

    /**
     * Returns the full chat interaction history.
     * Powers the frontend Chat History view.
     */
    public getHistory(): ChatHistoryItem[] {
        return this.history;
    }

    /**
     * Clears chat history without deleting the indexed documents.
     */
    public clearHistory(): void {
        this.history = [];
        this.persist();
    }

    // ==========================================
    // DIAGNOSTICS & STATS
    // ==========================================

    public get stats() {
        return {
            totalDocuments: this.documents.length,
            totalChunks: this.chunks.length,
            totalHistoryItems: this.history.length,
        };
    }
}

// Export a single shared instance (Singleton) across the whole app
export const documentStore = new DocumentStore();

