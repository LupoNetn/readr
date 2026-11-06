import '../setup.js';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { documentStore } from '../../src/engine/store.js';
import { DocumentMeta, DocumentChunk, ChatHistoryItem } from '../../src/engine/types.js';

describe('Unit: DocumentStore', () => {
    beforeEach(() => {
        documentStore.clearAll();
    });

    it('should start empty after clearAll()', () => {
        assert.strictEqual(documentStore.stats.totalDocuments, 0);
        assert.strictEqual(documentStore.stats.totalChunks, 0);
        assert.strictEqual(documentStore.stats.totalHistoryItems, 0);
        assert.deepStrictEqual(documentStore.getDocuments(), []);
        assert.deepStrictEqual(documentStore.getAllChunks(), []);
    });

    it('should add document metadata and associated chunks', () => {
        const meta: DocumentMeta = {
            id: 'doc_1',
            filename: 'test.txt',
            byteSize: 100,
            extension: '.txt',
            uploadedAt: Date.now(),
            totalChunks: 2,
            preview: 'Hello world'
        };

        const chunks: DocumentChunk[] = [
            {
                id: 'doc_1-chunk-0',
                documentId: 'doc_1',
                filename: 'test.txt',
                chunkIndex: 0,
                text: 'Chunk one text',
                tokens: ['chunk', 'one', 'text'],
                createdAt: Date.now()
            },
            {
                id: 'doc_1-chunk-1',
                documentId: 'doc_1',
                filename: 'test.txt',
                chunkIndex: 1,
                text: 'Chunk two text',
                tokens: ['chunk', 'two', 'text'],
                createdAt: Date.now()
            }
        ];

        documentStore.addDocument(meta, chunks);

        assert.strictEqual(documentStore.stats.totalDocuments, 1);
        assert.strictEqual(documentStore.stats.totalChunks, 2);
        assert.strictEqual(documentStore.getDocuments()[0].filename, 'test.txt');
        assert.strictEqual(documentStore.getAllChunks().length, 2);
    });

    it('should overwrite document and chunks when re-adding the same documentId', () => {
        const meta: DocumentMeta = {
            id: 'doc_dup',
            filename: 'old.txt',
            byteSize: 50,
            extension: '.txt',
            uploadedAt: 1000,
            totalChunks: 1,
            preview: 'Old preview'
        };
        const chunks: DocumentChunk[] = [{
            id: 'doc_dup-0',
            documentId: 'doc_dup',
            filename: 'old.txt',
            chunkIndex: 0,
            text: 'Old chunk',
            tokens: ['old', 'chunk'],
            createdAt: 1000
        }];

        documentStore.addDocument(meta, chunks);

        const updatedMeta: DocumentMeta = {
            ...meta,
            filename: 'new.txt',
            preview: 'New preview'
        };
        const updatedChunks: DocumentChunk[] = [{
            id: 'doc_dup-0',
            documentId: 'doc_dup',
            filename: 'new.txt',
            chunkIndex: 0,
            text: 'New chunk',
            tokens: ['new', 'chunk'],
            createdAt: 2000
        }];

        documentStore.addDocument(updatedMeta, updatedChunks);

        assert.strictEqual(documentStore.stats.totalDocuments, 1);
        assert.strictEqual(documentStore.stats.totalChunks, 1);
        assert.strictEqual(documentStore.getDocuments()[0].filename, 'new.txt');
        assert.strictEqual(documentStore.getAllChunks()[0].tokens[0], 'new');
    });

    it('should delete document and cascade chunk removal', () => {
        const meta: DocumentMeta = {
            id: 'doc_del',
            filename: 'delete-me.txt',
            byteSize: 100,
            extension: '.txt',
            uploadedAt: Date.now(),
            totalChunks: 1,
            preview: 'Goodbye'
        };
        const chunks: DocumentChunk[] = [{
            id: 'doc_del-0',
            documentId: 'doc_del',
            filename: 'delete-me.txt',
            chunkIndex: 0,
            text: 'Delete me content',
            tokens: ['delete', 'content'],
            createdAt: Date.now()
        }];

        documentStore.addDocument(meta, chunks);
        assert.strictEqual(documentStore.stats.totalDocuments, 1);

        const deleted = documentStore.deleteDocument('doc_del');
        assert.strictEqual(deleted, true);
        assert.strictEqual(documentStore.stats.totalDocuments, 0);
        assert.strictEqual(documentStore.stats.totalChunks, 0);

        // Deleting non-existent should return false
        assert.strictEqual(documentStore.deleteDocument('non_existent'), false);
    });

    it('should maintain chat history and enforce max cap of 200 items', () => {
        for (let i = 0; i < 210; i++) {
            const item: ChatHistoryItem = {
                id: `hist_${i}`,
                question: `Question ${i}`,
                answer: `Answer ${i}`,
                found: true,
                confidenceScore: 0.9,
                timestamp: Date.now() + i
            };
            documentStore.addHistoryItem(item);
        }

        assert.strictEqual(documentStore.getHistory().length, 200);
        // Newest item should be at the front
        assert.strictEqual(documentStore.getHistory()[0].id, 'hist_209');

        documentStore.clearHistory();
        assert.strictEqual(documentStore.getHistory().length, 0);
    });
});

