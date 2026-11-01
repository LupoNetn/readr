import { DocumentMeta, HistoryRecord, SourceMatch } from './types';

const MCP_ENDPOINT = process.env.NEXT_PUBLIC_MCP_URL || 'http://localhost:3030/mcp';

interface JsonRpcResponse<T = any> {
    jsonrpc: '2.0';
    id: string | number;
    result?: T;
    error?: { code: number; message: string; data?: any };
}

/**
 * Communicates directly with the readr Pure MCP Server over Streamable HTTP (SSE).
 */
export class McpClientService {
    private static async sendJsonRpc<T = any>(
        method: string,
        params: Record<string, any>,
        onProgress?: (message: string, progress?: number) => void
    ): Promise<T> {
        const id = Math.random().toString(36).substring(2, 9);
        const requestPayload = {
            jsonrpc: '2.0',
            id,
            method,
            params,
        };

        const response = await fetch(MCP_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'text/event-stream, application/json',
            },
            body: JSON.stringify(requestPayload),
        });

        if (!response.ok) {
            throw new Error(`MCP Server responded with HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || '';

        // If response is streamed via SSE
        if (contentType.includes('text/event-stream') && response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = '';
            let finalResult: any = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                accumulated += decoder.decode(value, { stream: true });
                const lines = accumulated.split('\n');
                accumulated = lines.pop() || ''; // keep trailing unfinished line

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith(':')) continue;

                    if (trimmed.startsWith('data:')) {
                        try {
                            const data = JSON.parse(trimmed.slice(5).trim());

                            // 1. Live SSE Progress notification
                            if (data.method === 'notifications/progress' && data.params) {
                                onProgress?.(data.params.message, data.params.progress);
                            }

                            // 2. Final JSON-RPC response
                            if (data.id === id || data.result) {
                                if (data.error) throw new Error(data.error.message);
                                finalResult = data.result;
                            }
                        } catch {
                            // Non-critical parsing ignore
                        }
                    }
                }
            }

            if (finalResult) return finalResult;
        }

        // Direct JSON response fallback
        const json: JsonRpcResponse<T> = await response.json();
        if (json.error) {
            throw new Error(json.error.message);
        }
        return json.result as T;
    }

    /**
     * Ask a question using the 'ask_document' MCP tool with live streaming progress
     */
    public static async askDocument(
        question: string,
        onProgress?: (message: string, progress?: number) => void
    ): Promise<{ found: boolean; match?: SourceMatch; rawText: string }> {
        const result = await this.sendJsonRpc(
            'tools/call',
            {
                name: 'ask_document',
                arguments: { question },
                _meta: { progressToken: 1 },
            },
            onProgress
        );

        const content = result?.content?.[0]?.text || 'nothing found';

        if (content === 'nothing found' || content.toLowerCase().includes('nothing found')) {
            return { found: false, rawText: 'nothing found' };
        }

        try {
            const parsed = JSON.parse(content);
            if (parsed.status === 'found') {
                return {
                    found: true,
                    match: parsed as SourceMatch,
                    rawText: parsed.sourceText,
                };
            }
        } catch {
            // Not a JSON object
        }

        return { found: true, rawText: content };
    }

    /**
     * Ingests a file into the MCP server via Base64
     */
    public static async ingestDocument(
        filename: string,
        base64Data: string
    ): Promise<{ success: boolean; message: string; totalChunks?: number }> {
        const result = await this.sendJsonRpc('tools/call', {
            name: 'ingest_document',
            arguments: { filename, base64Data },
        });

        const rawText = result?.content?.[0]?.text || '';
        try {
            const parsed = JSON.parse(rawText);
            return {
                success: parsed.status === 'success',
                message: parsed.message || 'Indexed document',
                totalChunks: parsed.chunksIndexed,
            };
        } catch {
            return {
                success: !rawText.toLowerCase().includes('error'),
                message: rawText,
            };
        }
    }

    /**
     * Reads the Memory Page (readr://documents MCP resource)
     */
    public static async getDocuments(): Promise<DocumentMeta[]> {
        try {
            const result = await this.sendJsonRpc('resources/read', {
                uri: 'readr://documents',
            });
            const rawText = result?.contents?.[0]?.text || '[]';
            return JSON.parse(rawText);
        } catch (error) {
            console.error('Failed to load documents resource:', error);
            return [];
        }
    }

    /**
     * Reads the Chat History (readr://history MCP resource)
     */
    public static async getHistory(): Promise<HistoryRecord[]> {
        try {
            const result = await this.sendJsonRpc('resources/read', {
                uri: 'readr://history',
            });
            const rawText = result?.contents?.[0]?.text || '[]';
            return JSON.parse(rawText);
        } catch (error) {
            console.error('Failed to load history resource:', error);
            return [];
        }
    }

    /**
     * Deletes a document using the 'delete_document' MCP tool
     */
    public static async deleteDocument(documentId: string): Promise<boolean> {
        const result = await this.sendJsonRpc('tools/call', {
            name: 'delete_document',
            arguments: { documentId },
        });

        const rawText = result?.content?.[0]?.text || '';
        return !rawText.toLowerCase().includes('error');
    }
}

