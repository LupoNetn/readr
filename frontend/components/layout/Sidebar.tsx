'use client';

import React from 'react';
import { Database, Plus, MessageSquare, Trash2, X } from 'lucide-react';
import { Conversation } from '../../lib/types';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    conversations: Conversation[];
    activeConversationId: string | null;
    onSelectConversation: (id: string) => void;
    onNewChat: () => void;
    onDeleteConversation: (id: string) => void;
    onOpenMemory: () => void;
    isMemoryActive: boolean;
    documentCount: number;
}

export function Sidebar({
    isOpen,
    onClose,
    conversations,
    activeConversationId,
    onSelectConversation,
    onNewChat,
    onDeleteConversation,
    onOpenMemory,
    isMemoryActive,
    documentCount,
}: SidebarProps) {
    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 md:hidden"
                />
            )}

            <aside
                className={`fixed md:static inset-y-0 left-0 z-40 bg-neutral-50 dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 flex flex-col transition-all duration-200 ease-in-out shrink-0 overflow-hidden ${
                    isOpen
                        ? 'w-64 translate-x-0'
                        : 'w-0 -translate-x-full md:w-0 md:translate-x-0 border-r-0 pointer-events-none'
                }`}
            >
                <div className="w-64 flex flex-col h-full">
                    {/* Brand & Mobile Close */}
                    <div className="h-14 px-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
                        <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 rounded-md bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px] font-bold font-mono">
                                R
                            </div>
                            <span className="text-sm font-semibold tracking-tight text-black dark:text-white">
                                readr
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-500">
                                Pure MCP
                            </span>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-1 rounded-md text-neutral-400 hover:text-black dark:hover:text-white md:hidden"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Top Section: App Memory Button & New Search Button */}
                    <div className="p-3 space-y-2 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
                        {/* APP MEMORY BUTTON */}
                        <button
                            onClick={onOpenMemory}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                                isMemoryActive
                                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-800'
                            }`}
                        >
                            <div className="flex items-center space-x-2.5">
                                <Database className="w-4 h-4" />
                                <span>App Memory</span>
                            </div>
                            <span
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                                    isMemoryActive
                                        ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black'
                                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                                }`}
                            >
                                {documentCount} docs
                            </span>
                        </button>

                        {/* NEW SEARCH BUTTON */}
                        <button
                            onClick={onNewChat}
                            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                                !isMemoryActive && !activeConversationId
                                ? 'bg-neutral-200 dark:bg-neutral-900 text-black dark:text-white'
                                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-800'
                            }`}
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Search</span>
                        </button>
                    </div>

                    {/* Chats History List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-1">
                        <div className="px-2 pb-1.5 pt-1 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                            Recent Searches
                        </div>

                        {conversations.length === 0 ? (
                            <p className="text-xs text-neutral-400 px-2 py-4 italic">No past searches yet</p>
                        ) : (
                            conversations.map((conv) => {
                                const isActive = !isMemoryActive && activeConversationId === conv.id;
                                return (
                                    <div
                                        key={conv.id}
                                        onClick={() => onSelectConversation(conv.id)}
                                        className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                                            isActive
                                                ? 'bg-black text-white dark:bg-white dark:text-black font-medium'
                                                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-900'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-2 truncate pr-2">
                                            <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                            <span className="truncate">{conv.title}</span>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteConversation(conv.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                                            title="Delete chat"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Bottom Footer info */}
                    <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between shrink-0">
                        <span className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>MCP :3030</span>
                        </span>
                        <span className="font-mono text-[10px]">Zero-AI • BM25</span>
                    </div>
                </div>
            </aside>
        </>
    );
}
