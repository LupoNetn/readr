'use client';

import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { McpClientService } from '../../lib/mcpClient';

interface IngestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDocumentIngested?: () => void;
}

export function IngestModal({ isOpen, onClose, onDocumentIngested }: IngestModalProps) {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFile = (file: File) => {
        setError(null);
        setStatusMessage(null);

        const allowed = ['.pdf', '.docx', '.csv', '.txt', '.md', '.json'];
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!allowed.includes(ext)) {
            setError(`Unsupported file type '${ext}'. Please choose a PDF, DOCX, CSV, TXT, MD, or JSON file.`);
            return;
        }

        setSelectedFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setError(null);
        setStatusMessage('Reading file buffer and converting to Base64...');

        try {
            const reader = new FileReader();

            reader.onload = async () => {
                const base64String = (reader.result as string).split(',')[1];
                setStatusMessage('Sending to readr Pure MCP Server...');

                const response = await McpClientService.ingestDocument(selectedFile.name, base64String);

                if (response.success) {
                    setStatusMessage(`Success! Indexed ${response.totalChunks || ''} semantic chunks.`);
                    onDocumentIngested?.();
                    setTimeout(() => {
                        setSelectedFile(null);
                        setStatusMessage(null);
                        setIsUploading(false);
                        onClose();
                    }, 1200);
                } else {
                    setError(response.message || 'Failed to ingest file');
                    setIsUploading(false);
                }
            };

            reader.onerror = () => {
                setError('Failed to read local file');
                setIsUploading(false);
            };

            reader.readAsDataURL(selectedFile);
        } catch (err: any) {
            setError(err?.message || 'Error uploading file');
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black rounded-2xl shadow-2xl p-6 relative transition-all">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-900">
                    <div>
                        <h2 className="text-lg font-medium text-black dark:text-white">Ingest Document</h2>
                        <p className="text-xs text-neutral-500 mt-0.5">Add a file to the deterministic search memory</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isUploading}
                        className="p-1 rounded-lg text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Dropzone */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={`mt-5 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                        dragActive
                            ? 'border-black dark:border-white bg-neutral-50 dark:bg-neutral-950'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                    }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.csv,.txt,.md,.json"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />

                    <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-3 text-neutral-600 dark:text-neutral-400">
                        <UploadCloud className="w-6 h-6" />
                    </div>

                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        {selectedFile ? selectedFile.name : 'Click to select or drag and drop'}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                        Supported: PDF, DOCX, CSV, TXT, MD, JSON (Max 25MB)
                    </p>
                </div>

                {/* Selected File Details */}
                {selectedFile && (
                    <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                        <div className="flex items-center space-x-3 truncate">
                            <FileText className="w-5 h-5 text-neutral-500 shrink-0" />
                            <div className="truncate">
                                <p className="text-xs font-medium text-black dark:text-white truncate">{selectedFile.name}</p>
                                <p className="text-[10px] text-neutral-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                        </div>
                        {!isUploading && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFile(null);
                                }}
                                className="text-xs text-neutral-400 hover:text-black dark:hover:text-white ml-2"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center space-x-2.5 text-xs text-red-600 dark:text-red-400">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Status Message */}
                {statusMessage && (
                    <div className="mt-4 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center space-x-2.5 text-xs text-neutral-700 dark:text-neutral-300">
                        {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin shrink-0 text-black dark:text-white" />
                        ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                        <span>{statusMessage}</span>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="mt-6 flex justify-end space-x-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isUploading}
                        className="px-4 py-2 text-xs font-medium rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={!selectedFile || isUploading}
                        className="px-4 py-2 text-xs font-medium rounded-lg bg-black text-white dark:bg-white dark:text-black hover:opacity-90 disabled:opacity-30 transition-all flex items-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                        {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>{isUploading ? 'Ingesting...' : 'Ingest Document'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

