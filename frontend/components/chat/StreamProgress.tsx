'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface StreamProgressProps {
    message: string;
    progress?: number;
}

export function StreamProgress({ message, progress }: StreamProgressProps) {
    return (
        <div className="py-3 flex items-center space-x-3 text-xs text-neutral-500 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-black dark:text-white shrink-0" />
            <div className="flex-1 truncate">
                <span className="font-mono text-black dark:text-white">{message}</span>
                {typeof progress === 'number' && (
                    <span className="ml-2 font-mono text-[10px] text-neutral-400">({progress}%)</span>
                )}
            </div>
        </div>
    );
}

