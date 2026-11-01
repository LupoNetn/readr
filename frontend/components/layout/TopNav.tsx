'use client';

import React from 'react';
import { Plus, Menu, Sun, Moon, Database } from 'lucide-react';

interface TopNavProps {
    title: string;
    onToggleSidebar: () => void;
    onOpenIngestModal: () => void;
    onOpenMemory: () => void;
    currentTheme: 'dark' | 'light';
    onToggleTheme: () => void;
    isMemoryView: boolean;
}

export function TopNav({
    title,
    onToggleSidebar,
    onOpenIngestModal,
    onOpenMemory,
    currentTheme,
    onToggleTheme,
    isMemoryView,
}: TopNavProps) {
    return (
        <header className="h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-black/80 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0">
            {/* Left: Menu toggle + Title */}
            <div className="flex items-center space-x-3 truncate">
                <button
                    onClick={onToggleSidebar}
                    className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                    title="Toggle Sidebar"
                >
                    <Menu className="w-4 h-4" />
                </button>

                <h1 className="text-sm font-medium text-black dark:text-white truncate">
                    {title}
                </h1>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-2">
                {/* Theme Toggle Button */}
                <button
                    onClick={onToggleTheme}
                    className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                    title="Toggle Dark/Light Mode"
                >
                    {currentTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                {/* Ingest Document Button */}
                <button
                    onClick={onOpenIngestModal}
                    className="px-3 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-medium hover:opacity-90 transition-opacity flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    title="Ingest new document"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Add Document</span>
                </button>
            </div>
        </header>
    );
}

