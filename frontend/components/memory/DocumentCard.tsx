'use client';

import React, { useState } from 'react';
import { FileText, Trash2, Layers, Clock, HardDrive, Loader2 } from 'lucide-react';
import { DocumentMeta } from '../../lib/types';

interface DocumentCardProps {
    doc: DocumentMeta;
    onDelete: (id: string) => Promise<void>;
}

export function DocumentCard({ doc, onDelete }: DocumentCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (confirm(`Are you sure you want to delete '${doc.filename}' and purge its chunks?`)) {
            setIsDeleting(true);
            try {
                await onDelete(doc.id);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black rounded-xl p-5 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all group relative flex flex-col justify-between">
            <div>
                {/* Top Row: File icon & name & delete */}
                <div className="flex items-start justify-between space-x-3">
                    <div className="flex items-center space-x-3 truncate">
                        <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shrink-0 text-black dark:text-white">
                            <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                            <h3 className="text-sm font-medium text-black dark:text-white truncate" title={doc.filename}>
                                {doc.filename}
                            </h3>
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">
                                {doc.extension}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors opacity-80 group-hover:opacity-100"
                        title="Delete document"
                    >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                </div>

                {/* Preview text */}
                <p className="mt-3 text-xs text-neutral-600 dark:text-neutral-400 line-clamp-3 leading-relaxed">
                    &ldquo;{doc.preview}...&rdquo;
                </p>
            </div>

            {/* Bottom Metadata bar */}
            <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-900 flex items-center justify-between text-[11px] text-neutral-500">
                <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1" title="Indexed Chunks">
                        <Layers className="w-3.5 h-3.5" />
                        <span>{doc.totalChunks} chunks</span>
                    </span>
                    <span className="flex items-center space-x-1" title="Size">
                        <HardDrive className="w-3.5 h-3.5" />
                        <span>{formatSize(doc.byteSize)}</span>
                    </span>
                </div>
                <span className="flex items-center space-x-1" title="Uploaded At">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDate(doc.uploadedAt)}</span>
                </span>
            </div>
        </div>
    );
}

