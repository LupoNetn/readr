'use client';

import React from 'react';
import { User, Cpu, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ChatMessage } from '../../lib/types';

interface MessageItemProps {
    message: ChatMessage;
}

export function MessageItem({ message }: MessageItemProps) {
    const isUser = message.role === 'user';
    const source = message.source;
    const keywords = source?.matchedKeywords || source?.matchedTokens || [];

    return (
        <div className={`py-4 flex space-x-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {/* Assistant Avatar */}
            {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shrink-0 text-xs font-mono font-medium shadow-xs mt-0.5">
                    <Cpu className="w-3.5 h-3.5" />
                </div>
            )}

            <div className={`max-w-2xl ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                {isUser ? (
                    /* User Question Bubble */
                    <div className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-black dark:text-white px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-sans leading-relaxed">
                        {message.content}
                    </div>
                ) : (
                    /* Assistant Answer - Natural text without box container */
                    <div className="w-full">
                        {message.isFound === false ? (
                            /* Nothing found clean state */
                            <div className="flex items-start space-x-2 text-xs text-neutral-500 dark:text-neutral-400 py-1">
                                <ShieldAlert className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-black dark:text-white">Nothing found in indexed documents</p>
                                    <p className="text-[11px] text-neutral-400 mt-0.5">
                                        No passage in your uploaded files matched this query with sufficient confidence.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* Natural flowing answer */
                            <div>
                                <p className="text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 leading-relaxed font-sans">
                                    {message.content}
                                    {message.isStreaming && (
                                        <span className="inline-block w-1.5 h-4 ml-1 bg-black dark:bg-white animate-pulse align-middle" />
                                    )}
                                </p>

                                {source && !message.isStreaming && (
                                    <div className="mt-3.5 pt-2.5 border-t border-neutral-100 dark:border-neutral-900 flex flex-wrap items-center gap-2 text-xs">
                                        {/* Document Citation */}
                                        <span className="inline-flex items-center space-x-1.5 px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-black dark:text-white text-[11px] font-medium">
                                            <FileText className="w-3.5 h-3.5 text-neutral-400" />
                                            <span>{source.filename}</span>
                                            <span className="text-[10px] text-neutral-400 font-mono">
                                                (chunk {source.chunkIndex})
                                            </span>
                                        </span>

                                        {/* Match Percentage */}
                                        <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-emerald-700 dark:text-emerald-400 font-mono text-[11px]">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                            <span>{Math.round(source.confidenceScore * 100)}% match</span>
                                        </span>

                                        {/* Matched Keywords Tags */}
                                        {keywords.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-1">
                                                {keywords.map((kw, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400"
                                                    >
                                                        {kw}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Timestamp */}
                <span className="text-[10px] text-neutral-400 mt-1 px-1">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            {/* User Avatar */}
            {isUser && (
                <div className="w-7 h-7 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center shrink-0 text-xs mt-0.5">
                    <User className="w-3.5 h-3.5" />
                </div>
            )}
        </div>
    );
}
