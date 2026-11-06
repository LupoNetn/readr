import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseFile } from '../../src/parsers/index.js';

describe('Unit: File Parsers', () => {
    it('should parse plain text (.txt)', async () => {
        const buffer = Buffer.from('Hello plain text world!');
        const parsed = await parseFile(buffer, 'notes.txt');

        assert.strictEqual(parsed.filename, 'notes.txt');
        assert.strictEqual(parsed.extension, '.txt');
        assert.strictEqual(parsed.text, 'Hello plain text world!');
        assert.strictEqual(parsed.byteSize, buffer.length);
    });

    it('should parse markdown (.md)', async () => {
        const md = '# Title\n\nParagraph text with **bold** formatting.';
        const buffer = Buffer.from(md);
        const parsed = await parseFile(buffer, 'readme.md');

        assert.strictEqual(parsed.filename, 'readme.md');
        assert.strictEqual(parsed.extension, '.md');
        assert.strictEqual(parsed.text, md);
    });

    it('should parse CSV (.csv) into key: value passages', async () => {
        const csv = 'Name,Department,Salary\nAlice,Engineering,120000\nBob,Marketing,95000';
        const buffer = Buffer.from(csv);
        const parsed = await parseFile(buffer, 'employees.csv');

        assert.strictEqual(parsed.extension, '.csv');
        assert.ok(parsed.text.includes('Name: Alice, Department: Engineering, Salary: 120000'));
        assert.ok(parsed.text.includes('Name: Bob, Department: Marketing, Salary: 95000'));
        // Separated by double newlines
        assert.ok(parsed.text.includes('\n\n'));
    });

    it('should parse JSON (.json) objects and arrays', async () => {
        const jsonData = JSON.stringify([
            { id: 1, product: 'Widget A', price: 29.99 },
            { id: 2, product: 'Gadget B', price: 49.99 }
        ]);
        const buffer = Buffer.from(jsonData);
        const parsed = await parseFile(buffer, 'catalog.json');

        assert.strictEqual(parsed.extension, '.json');
        assert.ok(parsed.text.includes('id: 1, product: Widget A, price: 29.99'));
        assert.ok(parsed.text.includes('id: 2, product: Gadget B, price: 49.99'));
    });

    it('should throw an error for unsupported extensions', async () => {
        const buffer = Buffer.from('unsupported binary');
        await assert.rejects(
            async () => {
                await parseFile(buffer, 'archive.zip');
            },
            /Unsupported file type: '\.zip'/
        );
    });
});

