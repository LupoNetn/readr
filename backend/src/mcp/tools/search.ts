import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { searchDocument } from '../../engine/search.js';
import { documentStore } from '../../engine/store.js';

export function registerSearchTool(server: McpServer): void {
    server.tool(
        "ask_document",
        "Searches indexed documents for the exact source excerpt answering the question. Returns 'nothing found' if no source matches.",
        {
            question: z.string().describe("The user question to search in the uploaded documents")
        },
        async ({ question }, extra: any) => {
            // Stream search progress to the client if progressToken is present
            if (extra?.sendNotification && extra?._meta?.progressToken !== undefined) {
                try {
                    await extra.sendNotification({
                        method: "notifications/progress",
                        params: {
                            progressToken: extra._meta.progressToken,
                            progress: 50,
                            total: 100,
                            message: `Scanning ${documentStore.stats.totalChunks} indexed chunks for: "${question}"...`
                        }
                    });
                } catch {
                    // Ignore stream disconnect
                }
            }

            const result = searchDocument(question);
            const historyId = randomUUID();

            if (!result.found || !result.match) {
                documentStore.addHistoryItem({
                    id: historyId,
                    question,
                    answer: "nothing found",
                    found: false,
                    confidenceScore: result.score,
                    timestamp: Date.now()
                });

                return {
                    content: [{
                        type: "text" as const,
                        text: "nothing found"
                    }]
                };
            }

            documentStore.addHistoryItem({
                id: historyId,
                question,
                answer: result.match.text,
                found: true,
                confidenceScore: result.score,
                sourceFilename: result.match.filename,
                timestamp: Date.now()
            });

            return {
                content: [{
                    type: "text" as const,
                    text: JSON.stringify({
                        status: "found",
                        filename: result.match.filename,
                        chunkIndex: result.match.chunkIndex,
                        sourceText: result.match.text,
                        matchedKeywords: result.match.matchedTokens,
                        confidenceScore: result.score,
                        allMatches: (result.matches || [result.match]).map(m => ({
                            filename: m.filename,
                            chunkIndex: m.chunkIndex,
                            sourceText: m.text,
                            matchedKeywords: m.matchedTokens,
                            confidenceScore: m.confidenceScore
                        }))
                    }, null, 2)
                }]
            };
        }
    );
}

