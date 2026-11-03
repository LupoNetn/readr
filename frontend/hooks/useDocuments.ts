'use client';

import { useState, useCallback, useEffect } from 'react';
import { DocumentMeta } from '../lib/types';
import { McpClientService } from '../lib/mcpClient';

export function useDocuments() {
    const [documents, setDocuments] = useState<DocumentMeta[]>([]);
    const [isDocsLoading, setIsDocsLoading] = useState(false);

    // Load documents from MCP server
    const loadDocuments = useCallback(async () => {
        setIsDocsLoading(true);
        try {
            const docs = await McpClientService.getDocuments();
            setDocuments(docs);
        } catch (error) {
            console.error('Failed to load documents from MCP:', error);
        } finally {
            setIsDocsLoading(false);
        }
    }, []);

    // Delete Document from MCP Store and refresh
    const deleteDocument = useCallback(async (id: string): Promise<void> => {
        const success = await McpClientService.deleteDocument(id);
        if (success) {
            await loadDocuments();
        }
    }, [loadDocuments]);

    // Initial load
    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

    return {
        documents,
        isDocsLoading,
        loadDocuments,
        deleteDocument,
    };
}
