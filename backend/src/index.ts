import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from './mcp/server.js';

dotenv.config();

const port = process.env.PORT ?? 3030;
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));


app.all("/mcp", async (req: Request, res: Response) => {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined // stateless mode
    });

    try {
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
    } catch (error) {
        console.error("MCP Protocol Error:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal MCP Protocol Error" });
        }
    } finally {
        req.on("close", () => {
            transport.close().catch(() => {});
            server.close().catch(() => {});
        });
    }
});

app.listen(port, () => {
    console.log(`\n readr Pure MCP Server running at: http://localhost:${port}/mcp`);
    console.log(`Available Tools:     ingest_document, ask_document, delete_document, document_stats, ping`);
    console.log(`Available Resources: readr://documents, readr://history\n`);
});
