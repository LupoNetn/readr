import '../setup.js';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { searchDocument } from '../../src/engine/search.js';
import { documentStore } from '../../src/engine/store.js';
import { chunkText } from '../../src/engine/chunker.js';
import { DocumentMeta } from '../../src/engine/types.js';

describe('Unit: Search Engine (BM25 & Top-K)', () => {
    beforeEach(() => {
        documentStore.clearAll();
    });

    it('should return found=false for empty queries', () => {
        const result = searchDocument('');
        assert.strictEqual(result.found, false);
        assert.strictEqual(result.score, 0);
        assert.strictEqual(result.message, 'nothing found');
    });

    it('should return found=false when no documents are uploaded', () => {
        const result = searchDocument('annual revenue');
        assert.strictEqual(result.found, false);
        assert.strictEqual(result.score, 0);
        assert.ok(result.message?.includes('no documents uploaded yet'));
    });

    it('should find relevant chunk and return matchedTokens and confidenceScore', () => {
        const text = 'The annual revenue of Readr in 2025 reached forty million dollars.\n\nOur engineering team expanded into Berlin and Tokyo.';
        const docId = 'doc_test';
        const chunks = chunkText(text, 'finance.txt', docId);

        const meta: DocumentMeta = {
            id: docId,
            filename: 'finance.txt',
            byteSize: text.length,
            extension: '.txt',
            uploadedAt: Date.now(),
            totalChunks: chunks.length,
            preview: text.slice(0, 100)
        };
        documentStore.addDocument(meta, chunks);

        const result = searchDocument('annual revenue Readr 2025');
        assert.strictEqual(result.found, true);
        assert.ok(result.score > 0);
        assert.ok(result.match);
        assert.strictEqual(result.match.filename, 'finance.txt');
        assert.ok(result.match.text.includes('forty million dollars'));
        assert.ok(result.match.matchedTokens.includes('revenue'));
        assert.ok(result.match.matchedTokens.includes('readr'));
    });

    it('should reject queries with keywordMatchRatio < 0.4', () => {
        // Query has 5 keywords: alpha, beta, gamma, delta, epsilon
        // Document only has 1 keyword: alpha (1/5 = 20% < 40%)
        const text = 'The alpha project was initiated recently.';
        const chunks = chunkText(text, 'test.txt', 'doc_ratio');
        documentStore.addDocument({
            id: 'doc_ratio',
            filename: 'test.txt',
            byteSize: 50,
            extension: '.txt',
            uploadedAt: Date.now(),
            totalChunks: chunks.length,
            preview: text
        }, chunks);

        const result = searchDocument('alpha beta gamma delta epsilon');
        assert.strictEqual(result.found, false);
        assert.strictEqual(result.message, 'nothing found');
    });

    it('should enforce Top-K limit to max 5 matches ordered descending by score', () => {
        // Create 8 relevant chunks and background noise chunks to provide natural IDF variation
        const relevantParagraphs = Array.from({ length: 8 }, (_, i) => 
            `Compliance policy guideline number ${i + 1} states that all employees must complete data protocols.`
        );
        const noiseParagraphs = Array.from({ length: 6 }, (_, i) =>
            `Cafeteria menu update number ${i + 1} features seasonal vegetables and dessert items.`
        );

        const allText = [...relevantParagraphs, ...noiseParagraphs].join('\n\n');
        const chunks = chunkText(allText, 'policy.txt', 'doc_policy');
        documentStore.addDocument({
            id: 'doc_policy',
            filename: 'policy.txt',
            byteSize: allText.length,
            extension: '.txt',
            uploadedAt: Date.now(),
            totalChunks: chunks.length,
            preview: 'Policy preview'
        }, chunks);

        const result = searchDocument('compliance policy guideline');
        assert.strictEqual(result.found, true);
        assert.ok(result.matches);
        assert.strictEqual(result.matches.length, 5, 'Should limit qualifying results to Top-5');

        // Check descending score ordering
        for (let i = 0; i < result.matches.length - 1; i++) {
            assert.ok(
                result.matches[i].confidenceScore >= result.matches[i + 1].confidenceScore,
                `Match ${i} score should be >= match ${i + 1} score`
            );
        }
    });

    it('should give higher score to concise chunk due to length normalization', () => {
        const shortText = 'Readr encryption key rotates daily.';
        const longText = 'Readr encryption key rotates daily. ' + 'Random unrelated background context. '.repeat(30);

        const doc1 = 'doc_short';
        const doc2 = 'doc_long';

        const shortChunks = chunkText(shortText, 'short.txt', doc1);
        const longChunks = chunkText(longText, 'long.txt', doc2);

        documentStore.addDocument({
            id: doc1, filename: 'short.txt', byteSize: shortText.length, extension: '.txt',
            uploadedAt: Date.now(), totalChunks: 1, preview: shortText
        }, shortChunks);

        documentStore.addDocument({
            id: doc2, filename: 'long.txt', byteSize: longText.length, extension: '.txt',
            uploadedAt: Date.now(), totalChunks: 1, preview: longText
        }, longChunks);

        const result = searchDocument('encryption key rotates daily');
        assert.strictEqual(result.found, true);
        assert.strictEqual(result.match?.filename, 'short.txt', 'Concise chunk should win over bloated chunk');
    });
});
