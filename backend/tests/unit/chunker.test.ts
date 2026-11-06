import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, chunkText } from '../../src/engine/chunker.js';

describe('Unit: Chunker Engine', () => {
    describe('tokenize()', () => {
        it('should lowercase and tokenize alphanumeric characters', () => {
            const tokens = tokenize('Hello World! Testing 123.');
            assert.deepStrictEqual(tokens, ['hello', 'world', 'testing', '123']);
        });

        it('should filter out English stop words', () => {
            const tokens = tokenize('This is the revenue report for our business');
            assert.ok(!tokens.includes('this'));
            assert.ok(!tokens.includes('is'));
            assert.ok(!tokens.includes('the'));
            assert.ok(!tokens.includes('for'));
            assert.ok(!tokens.includes('our'));
            assert.deepStrictEqual(tokens, ['revenue', 'report', 'business']);
        });

        it('should discard single-letter tokens', () => {
            const tokens = tokenize('Plan A and Plan B in section X');
            assert.deepStrictEqual(tokens, ['plan', 'plan', 'section']);
        });

        it('should return empty array for empty or stop-word-only text', () => {
            assert.deepStrictEqual(tokenize(''), []);
            assert.deepStrictEqual(tokenize('... ??? !!!'), []);
            assert.deepStrictEqual(tokenize('is it that you were with them'), []);
        });
    });

    describe('chunkText()', () => {
        it('should create discrete chunks with IDs and metadata', () => {
            const text = 'First discrete paragraph with information.\n\nSecond discrete paragraph with details.';
            const chunks = chunkText(text, 'test.txt', 'doc_123');

            assert.strictEqual(chunks.length, 2);
            assert.strictEqual(chunks[0].documentId, 'doc_123');
            assert.strictEqual(chunks[0].filename, 'test.txt');
            assert.strictEqual(chunks[0].chunkIndex, 0);
            assert.strictEqual(chunks[1].chunkIndex, 1);
            assert.ok(chunks[0].tokens.length > 0);
        });

        it('should heal accidental PDF line-breaks across lines', () => {
            const text = 'The quarterly revenue for\nQ4 exceeded expectations.\n\nNext section here.';
            const chunks = chunkText(text, 'report.pdf', 'doc_pdf');

            assert.ok(chunks[0].text.includes('revenue for Q4 exceeded'));
        });

        it('should fuse short heading blocks with the subsequent paragraph', () => {
            const text = 'Executive Summary\n\nOur financial performance in 2025 was unprecedented.';
            const chunks = chunkText(text, 'annual_report.txt', 'doc_heading');

            assert.strictEqual(chunks.length, 1);
            assert.ok(chunks[0].text.startsWith('Executive Summary\nOur financial performance'));
        });

        it('should preserve structured CSV records without heading fusion', () => {
            const csvText = 'Name: Alice, Role: Engineer\n\nName: Bob, Role: Designer';
            const chunks = chunkText(csvText, 'staff.csv', 'doc_csv');

            assert.strictEqual(chunks.length, 2);
            assert.strictEqual(chunks[0].text, 'Name: Alice, Role: Engineer');
            assert.strictEqual(chunks[1].text, 'Name: Bob, Role: Designer');
        });

        it('should split long blocks (> 800 chars) by sentence boundaries', () => {
            const longSentence = 'This is a detailed sentence explaining financial analytics in depth. ';
            const longBlock = longSentence.repeat(20); // ~1400 chars
            const chunks = chunkText(longBlock, 'long.txt', 'doc_long');

            assert.ok(chunks.length > 1, 'Long block should be partitioned into multiple chunks');
            for (const chunk of chunks) {
                assert.ok(chunk.tokens.length > 0);
            }
        });
    });
});
