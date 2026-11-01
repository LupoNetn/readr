import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { documentStore } from '../../engine/store.js';

export function registerDocumentsResource(server: McpServer): void {
    // Allows any MCP client to read the list of documents (Memory Page)
    server.resource(
        "documents-list",
        "readr://documents",
        async (uri) => ({
            contents: [{
                uri: uri.href,
                text: JSON.stringify(documentStore.getDocuments(), null, 2),
                mimeType: "application/json"
            }]
        })
    );
}

