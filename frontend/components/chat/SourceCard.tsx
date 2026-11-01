'use client';

import React from 'react';
import { FileText, CheckCircle2, Hash } from 'lucide-react';
import { SourceMatch } from '../../lib/types';

interface SourceCardProps {
    match: SourceMatch;
    isStreaming?: boolean;
}

export function SourceCard({ match, isStreaming }: SourceCardProps) {
    const keywords = match.matchedKeywords || match.matchedTokens || [];

    return (
        <div className="mt-3.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 rounded-xl p-4 text-xs">
            {/* Header / Citation pill */}
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-neutral-200/70 dark:border-neutral-800">
                <div className="flex items-center space-x-2 truncate">
                    <FileText className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span className="font-medium text-black dark:text-white truncate">
                        {match.filename}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono flex items-center">
                        <Hash className="w-2.5 h-2.5" />
                        chunk {match.chunkIndex}
                    </span>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0 pl-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[11px] font-mono font-medium text-emerald-700 dark:text-emerald-400">
                        {Math.round(match.confidenceScore * 100)}% match
                    </span>
                </div>
            </div>

            {/* Exact Excerpt quote with streaming cursor */}
            <div className="relative pl-3 border-l-2 border-black dark:border-white py-0.5">
                <p className="text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans text-xs">
                    {match.sourceText}
                    {isStreaming && (
                        <span className="inline-block w-1.5 h-3.5 ml-1 bg-black dark:bg-white animate-pulse align-middle" />
                    )}
                </p>
            </div>

            {/* Matched Keywords Tags */}
            {keywords.length > 0 && !isStreaming && (
                <div className="mt-3 flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider mr-1">Matched:</span>
                    {keywords.map((token: string, i: number) => (
                        <span
                            key={i}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                        >
                            {token}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
