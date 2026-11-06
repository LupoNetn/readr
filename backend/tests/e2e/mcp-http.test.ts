import '../setup.js';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../../src/index.js';
import { documentStore } from '../../src/engine/store.js';

describe('E2E: MCP Express HTTP Server (/mcp)', () => {
    let server: http.Server;
    let baseUrl: string;

    before(async () => {
        documentStore.clearAll();
        await new Promise<void>((resolve) => {
            // Listen on port 0 to allocate an available ephemeral port
            server = app.listen(0, () => {
                const address = server.address();
                if (address && typeof address === 'object') {
                    baseUrl = `http://127.0.0.1:${address.port}/mcp`;
                }
                resolve();
            });
        });
    });

    after(async () => {
        await new Promise<void>((resolve) => {
            (server as any).closeAllConnections?.();
            server.close(() => resolve());
        });
    });

    async function sendMcpPost(payload: any) {
        const res = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/event-stream'
            },
            body: JSON.stringify(payload)
        });
        const text = await res.text();
        return {
            status: res.status,
            headers: res.headers,
            body: text
        };
    }

    it('should complete MCP initialize handshake over HTTP', async () => {
        const initReq = {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: {
                    name: 'readr-e2e-test',
                    version: '1.0.0'
                }
            }
        };

        const response = await sendMcpPost(initReq);
        assert.strictEqual(response.status, 200);
        assert.ok(response.body.includes('readr'));
    });

    it('should list registered MCP tools over HTTP', async () => {
        const toolsReq = {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/list',
            params: {}
        };

        const response = await sendMcpPost(toolsReq);
        assert.strictEqual(response.status, 200);
        assert.ok(response.body.includes('ingest_document'));
        assert.ok(response.body.includes('ask_document'));
        assert.ok(response.body.includes('delete_document'));
        assert.ok(response.body.includes('document_stats'));
    });

    it('should perform end-to-end ingest and semantic search lifecycle', async () => {
        // 1. Ingest document via MCP HTTP tool call
        const textContent = 'Project Apollo: Mars landing target date is October 2028.\n\nBudget allocation stands at 14 billion USD.';
        const base64Data = Buffer.from(textContent).toString('base64');

        const ingestReq = {
            jsonrpc: '2.0',
            id: 3,
            method: 'tools/call',
            params: {
                name: 'ingest_document',
                arguments: {
                    filename: 'apollo.txt',
                    base64Data
                }
            }
        };

        const ingestRes = await sendMcpPost(ingestReq);
        assert.strictEqual(ingestRes.status, 200);
        assert.ok(ingestRes.body.includes('Successfully indexed apollo.txt'));

        // 2. Query document via MCP HTTP tool call
        const searchReq = {
            jsonrpc: '2.0',
            id: 4,
            method: 'tools/call',
            params: {
                name: 'ask_document',
                arguments: {
                    question: 'What is the Mars landing target date for Project Apollo?'
                }
            }
        };

        const searchRes = await sendMcpPost(searchReq);
        assert.strictEqual(searchRes.status, 200);
        assert.ok(searchRes.body.includes('October 2028'));
        assert.ok(searchRes.body.includes('apollo.txt'));

        // 3. Check document_stats tool via MCP HTTP tool call
        const statsReq = {
            jsonrpc: '2.0',
            id: 5,
            method: 'tools/call',
            params: {
                name: 'document_stats',
                arguments: {}
            }
        };

        const statsRes = await sendMcpPost(statsReq);
        assert.strictEqual(statsRes.status, 200);
        assert.ok(statsRes.body.includes('totalDocuments'));
        assert.ok(statsRes.body.includes('totalChunks'));
    });
});
