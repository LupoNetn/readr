'use client';

import React, { useState, useMemo } from 'react';
import { Database, Search, Plus, ArrowLeft, RefreshCw, Layers } from 'lucide-react';
import { DocumentMeta } from '../../lib/types';
import { DocumentCard } from './DocumentCard';

interface MemoryViewProps {
    documents: DocumentMeta[];
    isLoading: boolean;
    onRefresh: () => void;
    onDeleteDocument: (id: string) => Promise<void>;
    onOpenIngestModal: () => void;
    onBackToChat: () => void;
}

export function MemoryView({
    documents,
    isLoading,
    onRefresh,
    onDeleteDocument,
    onOpenIngestModal,
    onBackToChat,
}: MemoryViewProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredDocuments = useMemo(() => {
        if (!searchQuery.trim()) return documents;
        const q = searchQuery.toLowerCase();
        return documents.filter(
            (d) => d.filename.toLowerCase().includes(q) || d.preview.toLowerCase().includes(q)
        );
    }, [documents, searchQuery]);

    const totalChunks = useMemo(() => {
        return documents.reduce((acc, d) => acc + d.totalChunks, 0);
    }, [documents]);

    return (
        <div className="flex-1 flex flex-col h-full bg-white dark:bg-black overflow-y-auto">
            {/* Top Bar */}
            <div className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={onBackToChat}
                        className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                        title="Back to chat"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <div className="flex items-center space-x-2">
                            <Database className="w-4 h-4 text-black dark:text-white" />
                            <h1 className="text-base font-semibold text-black dark:text-white">App Memory</h1>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono">
                                readr://documents
                            </span>
                        </div>
                        <p className="text-xs text-neutral-500">
                            Live state of all documents parsed, tokenized, and indexed by the Pure MCP Server
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                        title="Refresh memory"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={onOpenIngestModal}
                        className="px-3.5 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-medium hover:opacity-90 transition-opacity flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ingest Document</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-5xl w-full mx-auto p-6 md:p-8 flex-1">
                {/* Stats Header Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
                        <span className="text-xs text-neutral-500">Total Documents</span>
                        <p className="text-xl font-semibold text-black dark:text-white mt-1">{documents.length}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
                        <span className="text-xs text-neutral-500">Indexed Chunks</span>
                        <p className="text-xl font-semibold text-black dark:text-white mt-1">{totalChunks}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 col-span-2 sm:col-span-1">
                        <span className="text-xs text-neutral-500">Persistence</span>
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center space-x-1">
                            <span>●</span>
                            <span>data/store.json Active</span>
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                {documents.length > 0 && (
                    <div className="relative mb-6">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter documents by filename or content..."
                            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-black dark:text-white placeholder-neutral-400 focus:outline-hidden focus:border-black dark:focus:border-white transition-colors"
                        />
                    </div>
                )}

                {/* Documents Grid */}
                {filteredDocuments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredDocuments.map((doc) => (
                            <DocumentCard key={doc.id} doc={doc} onDelete={onDeleteDocument} />
                        ))}
                    </div>
                ) : (
                    <div className="border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center my-8">
                        <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-400 mb-3">
                            <Layers className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-medium text-black dark:text-white">
                            {searchQuery ? 'No matching documents found' : 'No documents in memory yet'}
                        </h3>
                        <p className="text-xs text-neutral-500 max-w-sm mt-1 mb-5">
                            {searchQuery
                                ? 'Try a different search keyword.'
                                : 'Ingest a .pdf, .docx, .csv, or .txt file into the MCP store to begin searching.'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={onOpenIngestModal}
                                className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-medium hover:opacity-90 transition-opacity flex items-center space-x-2 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Ingest First Document</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

