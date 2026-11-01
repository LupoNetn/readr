import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import { documentStore } from '../../engine/store.js';

export function registerDeleteTool(server: McpServer): void {
    server.tool(
        "delete_document",
        "Removes an uploaded document and all its indexed chunks from memory and disk storage.",
        {
            documentId: z.string().describe("The unique ID of the document to delete (e.g. doc_a1b2c3d4)")
        },
        async ({ documentId }) => {
            const success = documentStore.deleteDocument(documentId);

            if (success) {
                return {
                    content: [{
                        type: "text" as const,
                        text: JSON.stringify({
                            status: "success",
                            message: `Document ${documentId} and its associated chunks were deleted.`,
                            remainingDocuments: documentStore.stats.totalDocuments
                        }, null, 2)
                    }]
                };
            }

            return {
                content: [{
                    type: "text" as const,
                    text: `Error: Document '${documentId}' not found.`
                }]
            };
        }
    );
}

