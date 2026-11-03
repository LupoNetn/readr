import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { parseFile } from '../../parsers/index.js';
import { chunkText } from '../../engine/chunker.js';
import { documentStore } from '../../engine/store.js';
import { DocumentMeta } from '../../engine/types.js';

export function registerIngestTool(server: McpServer): void {
    server.tool(
        "ingest_document",
        "Ingests a document (.pdf, .docx, .csv, .txt, .md, .json) into searchable memory using Base64 data or a local file path.",
        {
            filename: z.string().describe("Name of the file including extension (e.g. invoice.pdf)"),
            base64Data: z.string().optional().describe("Base64 encoded binary file data (for web/remote clients)"),
            filePath: z.string().optional().describe("Local file path on disk (for local/desktop clients)")
        },
        async ({ filename, base64Data, filePath }) => {
            try {
                let buffer: Buffer;

                if (base64Data) {
                    buffer = Buffer.from(base64Data, "base64");
                } else if (filePath) {
                    const resolved = path.resolve(filePath);
                    if (!fs.existsSync(resolved)) {
                        return {
                            content: [{ type: "text" as const, text: `Error: File not found at ${filePath}` }]
                        };
                    }
                    buffer = fs.readFileSync(resolved);
                } else {
                    return {
                        content: [{ type: "text" as const, text: "Error: Either 'base64Data' or 'filePath' must be provided." }]
                    };
                }

                
                const parsed = await parseFile(buffer, filename);

                
                const documentId = `doc_${randomUUID().slice(0, 8)}`;
                const chunks = chunkText(parsed.text, filename, documentId);

                
                const meta: DocumentMeta = {
                    id: documentId,
                    filename,
                    byteSize: parsed.byteSize,
                    extension: parsed.extension,
                    uploadedAt: Date.now(),
                    totalChunks: chunks.length,
                    preview: parsed.text.slice(0, 150).replace(/\s+/g, ' ').trim()
                };

                
                documentStore.addDocument(meta, chunks);

                return {
                    content: [{
                        type: "text" as const,
                        text: JSON.stringify({
                            status: "success",
                            message: `Successfully indexed ${filename}`,
                            documentId,
                            chunksIndexed: chunks.length,
                            totalChunksInStore: documentStore.stats.totalChunks
                        }, null, 2)
                    }]
                };
            } catch (err: any) {
                return {
                    content: [{
                        type: "text" as const,
                        text: `Error ingesting document: ${err?.message || "Unknown error"}`
                    }]
                };
            }
        }
    );
}

