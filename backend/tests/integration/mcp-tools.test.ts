import '../setup.js';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createMcpServer } from '../../src/mcp/server.js';
import { documentStore } from '../../src/engine/store.js';

describe('Integration: MCP Tools & Resources', () => {
    let server: ReturnType<typeof createMcpServer>;
    let tools: Record<string, any>;
    let resources: Record<string, any>;

    beforeEach(() => {
        documentStore.clearAll();
        server = createMcpServer();
        tools = (server as any)._registeredTools;
        resources = (server as any)._registeredResources;
    });

    it('should register all expected tools and resources', () => {
        assert.ok(tools['ping'], 'Tool ping should be registered');
        assert.ok(tools['ingest_document'], 'Tool ingest_document should be registered');
        assert.ok(tools['ask_document'], 'Tool ask_document should be registered');
        assert.ok(tools['delete_document'], 'Tool delete_document should be registered');
        assert.ok(tools['document_stats'], 'Tool document_stats should be registered');

        assert.ok(resources['readr://documents'], 'Resource readr://documents should be registered');
        assert.ok(resources['readr://history'], 'Resource readr://history should be registered');
    });

    it('ping tool should return pong message', async () => {
        const res = await tools['ping'].handler({ message: 'healthcheck' });
        assert.strictEqual(res.content[0].type, 'text');
        assert.strictEqual(res.content[0].text, 'pong: healthcheck');
    });

    it('ingest_document tool should ingest Base64 text and index chunks', async () => {
        const content = 'Quarterly financial report: Net profit grew 18 percent in 2025.\n\nOperational expenditures remained flat.';
        const base64Data = Buffer.from(content).toString('base64');

        const ingestRes = await tools['ingest_document'].handler({
            filename: 'report.txt',
            base64Data
        });

        assert.strictEqual(ingestRes.content[0].type, 'text');
        const parsed = JSON.parse(ingestRes.content[0].text);
        assert.strictEqual(parsed.status, 'success');
        assert.ok(parsed.documentId);
        assert.strictEqual(parsed.chunksIndexed, 2);
        assert.strictEqual(documentStore.stats.totalDocuments, 1);
        assert.strictEqual(documentStore.stats.totalChunks, 2);
    });

    it('ask_document tool should answer question and trigger progress notifications over SSE stream', async () => {
        // Ingest a document
        const content = 'Readr policy: Employee remote work allowance is $1500 annually for ergonomic equipment.';
        const base64Data = Buffer.from(content).toString('base64');
        await tools['ingest_document'].handler({ filename: 'remote.txt', base64Data });

        // Track SSE progress notification callback
        const notifications: any[] = [];
        const extra = {
            _meta: { progressToken: 'token_abc123' },
            sendNotification: async (notif: any) => {
                notifications.push(notif);
            }
        };

        const askRes = await tools['ask_document'].handler({
            question: 'What is the remote work allowance?'
        }, extra);

        assert.strictEqual(askRes.content[0].type, 'text');
        const answer = JSON.parse(askRes.content[0].text);
        assert.strictEqual(answer.status, 'found');
        assert.strictEqual(answer.filename, 'remote.txt');
        assert.ok(answer.sourceText.includes('$1500 annually'));
        assert.ok(answer.confidenceScore > 0);

        // Verify SSE progress notification was emitted
        assert.strictEqual(notifications.length, 1);
        assert.strictEqual(notifications[0].method, 'notifications/progress');
        assert.strictEqual(notifications[0].params.progressToken, 'token_abc123');

        // Verify history was saved
        assert.strictEqual(documentStore.stats.totalHistoryItems, 1);
    });

    it('ask_document tool should return "nothing found" when query has no match', async () => {
        const askRes = await tools['ask_document'].handler({
            question: 'Unmatched query about space exploration'
        });

        assert.strictEqual(askRes.content[0].text, 'nothing found');
        assert.strictEqual(documentStore.stats.totalHistoryItems, 1);
        assert.strictEqual(documentStore.getHistory()[0].found, false);
    });

    it('delete_document tool should delete indexed document and its chunks', async () => {
        const base64Data = Buffer.from('Temporary scratch document.').toString('base64');
        const ingestRes = await tools['ingest_document'].handler({ filename: 'temp.txt', base64Data });
        const { documentId } = JSON.parse(ingestRes.content[0].text);

        assert.strictEqual(documentStore.stats.totalDocuments, 1);

        const deleteRes = await tools['delete_document'].handler({ documentId });
        const deletePayload = JSON.parse(deleteRes.content[0].text);
        assert.strictEqual(deletePayload.status, 'success');
        assert.strictEqual(documentStore.stats.totalDocuments, 0);
        assert.strictEqual(documentStore.stats.totalChunks, 0);
    });

    it('resources readr://documents and readr://history should return JSON content', async () => {
        const base64Data = Buffer.from('Resource test line.').toString('base64');
        await tools['ingest_document'].handler({ filename: 'res.txt', base64Data });
        await tools['ask_document'].handler({ question: 'resource test' });

        const docResObj = resources['readr://documents'];
        const docResource = await docResObj.readCallback(new URL('readr://documents'));
        assert.strictEqual(docResource.contents[0].mimeType, 'application/json');
        const docs = JSON.parse(docResource.contents[0].text);
        assert.strictEqual(docs.length, 1);
        assert.strictEqual(docs[0].filename, 'res.txt');

        const histResObj = resources['readr://history'];
        const histResource = await histResObj.readCallback(new URL('readr://history'));
        assert.strictEqual(histResource.contents[0].mimeType, 'application/json');
        const history = JSON.parse(histResource.contents[0].text);
        assert.strictEqual(history.length, 1);
        assert.strictEqual(history[0].question, 'resource test');
    });
});
