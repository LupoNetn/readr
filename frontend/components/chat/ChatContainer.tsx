'use client';

import React, { useRef, useEffect } from 'react';
import { FileSearch, Sparkles, BookOpen, Layers } from 'lucide-react';
import { ChatMessage } from '../../lib/types';
import { MessageItem } from './MessageItem';
import { StreamProgress } from './StreamProgress';

interface ChatContainerProps {
    messages: ChatMessage[];
    isLoading: boolean;
    streamingProgress?: { message: string; progress?: number } | null;
    onSelectSuggestion?: (question: string) => void;
    documentCount: number;
}

export function ChatContainer({
    messages,
    isLoading,
    streamingProgress,
    onSelectSuggestion,
    documentCount,
}: ChatContainerProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingProgress]);

    const suggestions = [
        'What was the annual recurring revenue in 2025?',
        'Who is the company founded by and where?',
        'How many engineers are currently employed?',
        'Summarize the key facts in the document',
    ];

    return (
        <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-3xl mx-auto w-full">
                {messages.length === 0 ? (
                    /* Clean ChatGPT / Gemini Empty Welcome State */
                    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
                        <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-black dark:text-white mb-4 shadow-xs">
                            <BookOpen className="w-6 h-6" />
                        </div>

                        <h2 className="text-xl font-medium text-black dark:text-white tracking-tight">
                            readr Document Intelligence
                        </h2>
                        <p className="text-xs text-neutral-500 max-w-md mt-1.5 leading-relaxed">
                            {documentCount > 0
                                ? `Ready to query ${documentCount} indexed document${documentCount > 1 ? 's' : ''}. Every response is strictly grounded in the source text.`
                                : 'No documents indexed yet. Ingest a document using the top-right button to begin searching.'}
                        </p>

                        {/* Suggestions */}
                        {documentCount > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-8 w-full max-w-lg">
                                {suggestions.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        onClick={() => onSelectSuggestion?.(suggestion)}
                                        className="p-3 text-left rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 bg-white dark:bg-black text-xs text-neutral-700 dark:text-neutral-300 transition-colors flex items-center justify-between group cursor-pointer"
                                    >
                                        <span className="truncate pr-2">{suggestion}</span>
                                        <Sparkles className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Messages list */
                    <div className="space-y-1">
                        {messages.map((message) => (
                            <MessageItem key={message.id} message={message} />
                        ))}

                        {/* Live SSE progress streaming indicator */}
                        {isLoading && streamingProgress && (
                            <StreamProgress
                                message={streamingProgress.message}
                                progress={streamingProgress.progress}
                            />
                        )}

                        <div ref={bottomRef} />
                    </div>
                )}
            </div>
        </div>
    );
}

