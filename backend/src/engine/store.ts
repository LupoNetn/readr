import fs from 'node:fs';
import path from 'node:path';
import { DocumentChunk, DocumentMeta, ChatHistoryItem } from './types.js';

interface StoreSchema {
    documents: DocumentMeta[];
    chunks: DocumentChunk[];
    history: ChatHistoryItem[];
}


export class DocumentStore {
    private documents: DocumentMeta[] = [];
    private chunks: DocumentChunk[] = [];
    private history: ChatHistoryItem[] = [];

    // Path where store data will be saved
    private readonly storagePath: string;

    constructor(customStoragePath?: string) {
        this.storagePath = customStoragePath ?? process.env.STORE_PATH ?? path.resolve(process.cwd(), 'data', 'store.json');
        this.loadFromDisk();
    }

   
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


    
    public addDocument(meta: DocumentMeta, chunks: DocumentChunk[]): void {
        this.documents = this.documents.filter(d => d.id !== meta.id);
        this.documents.push(meta);

    
        this.chunks = this.chunks.filter(c => c.documentId !== meta.id);
        this.chunks.push(...chunks);

        this.persist();
    }

    public getDocuments(): DocumentMeta[] {
        return [...this.documents].sort((a, b) => b.uploadedAt - a.uploadedAt);
    }

    
    public getAllChunks(): DocumentChunk[] {
        return this.chunks;
    }

    
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

   
    public addHistoryItem(item: ChatHistoryItem): void {
        this.history.unshift(item); // Prepend so newest is at the top

        
        if (this.history.length > 200) {
            this.history = this.history.slice(0, 200);
        }

        this.persist();
    }

    
    public getHistory(): ChatHistoryItem[] {
        return this.history;
    }

   
    public clearHistory(): void {
        this.history = [];
        this.persist();
    }

    public clearAll(): void {
        this.documents = [];
        this.chunks = [];
        this.history = [];
        this.persist();
    }

   
    public get stats() {
        return {
            totalDocuments: this.documents.length,
            totalChunks: this.chunks.length,
            totalHistoryItems: this.history.length,
        };
    }
}


export const documentStore = new DocumentStore();

