import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import { documentStore } from '../../engine/store.js';

export function registerStatsTool(server: McpServer): void {
    // Ping Tool
    server.tool(
        "ping",
        "Checks if the readr MCP engine is responsive",
        { message: z.string().optional() },
        async ({ message }) => ({
            content: [{
                type: "text" as const,
                text: `pong: ${message ?? "readr engine ready"}`
            }]
        })
    );

    // Stats Tool
    server.tool(
        "document_stats",
        "Returns statistics on currently indexed documents, chunks, and interaction history count",
        {},
        async () => {
            return {
                content: [{
                    type: "text" as const,
                    text: JSON.stringify(documentStore.stats, null, 2)
                }]
            };
        }
    );
}

