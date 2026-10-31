import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod'


export const createMcpServer = () => {
    const server = new McpServer({
        name: "readr",
        version: "1",
        description: "An MCP server for processing, indexing and indexing documents for deterministic search."
    })

    //mcp's servers registered tools.
    server.tool(
        "ping",
        "checks if the readr MCP engine is responsive",
        { message: z.string().optional() },
        async ({ message }) => ({
            content: [{
                type: "text",
                text: `pong: ${message ?? "readr engine ready"}`
            }]
        })
    )

    return server
}