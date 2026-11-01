'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, CornerDownLeft } from 'lucide-react';

interface ChatInputProps {
    onSendMessage: (content: string) => void;
    isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
        }
    }, [input]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        onSendMessage(input.trim());
        setInput('');

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto px-4 pb-5 pt-2">
            <form
                onSubmit={handleSubmit}
                className="relative rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black shadow-xs focus-within:border-black dark:focus-within:border-white transition-all overflow-hidden p-2 flex items-end space-x-2"
            >
                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    placeholder="Ask a question based on your indexed documents..."
                    className="w-full resize-none bg-transparent px-3 py-2 text-xs sm:text-sm text-black dark:text-white placeholder-neutral-400 focus:outline-hidden max-h-40 leading-relaxed"
                />

                <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="w-8 h-8 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center disabled:opacity-20 hover:opacity-90 transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed mb-0.5"
                    title="Send message"
                >
                    <ArrowUp className="w-4 h-4" />
                </button>
            </form>

            <p className="text-[11px] text-center text-neutral-400 dark:text-neutral-500 mt-2">
                Deterministic passage retrieval • Answers strictly from source text with zero hallucination.
            </p>
        </div>
    );
}

