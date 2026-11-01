import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerIngestTool } from "./tools/ingest.js";
import { registerSearchTool } from "./tools/search.js";
import { registerDeleteTool } from "./tools/delete.js";
import { registerStatsTool } from "./tools/stats.js";
import { registerDocumentsResource } from "./resources/documents.js";
import { registerHistoryResource } from "./resources/history.js";


export function createMcpServer(): McpServer {
    const server = new McpServer({
        name: "readr",
        version: "1.0.0",
        description: "A pure MCP document intelligence engine for parsing, semantic search, and memory."
    });

    
    registerIngestTool(server);
    registerSearchTool(server);
    registerDeleteTool(server);
    registerStatsTool(server);

    
    registerDocumentsResource(server);
    registerHistoryResource(server);

    return server;
}

