import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { documentStore } from '../../engine/store.js';

export function registerHistoryResource(server: McpServer): void {
    server.resource(
        "chat-history",
        "readr://history",
        async (uri) => ({
            contents: [{
                uri: uri.href,
                text: JSON.stringify(documentStore.getHistory(), null, 2),
                mimeType: "application/json"
            }]
        })
    );
}

