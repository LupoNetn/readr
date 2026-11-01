'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { TopNav } from '../components/layout/TopNav';
import { ChatContainer } from '../components/chat/ChatContainer';
import { ChatInput } from '../components/chat/ChatInput';
import { MemoryView } from '../components/memory/MemoryView';
import { IngestModal } from '../components/modals/IngestModal';
import { McpClientService } from '../lib/mcpClient';
import { Conversation, ChatMessage, DocumentMeta } from '../lib/types';

export default function Home() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [documents, setDocuments] = useState<DocumentMeta[]>([]);
    const [isMemoryView, setIsMemoryView] = useState(false);
    const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDocsLoading, setIsDocsLoading] = useState(false);
    const [streamingProgress, setStreamingProgress] = useState<{ message: string; progress?: number } | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    // 1. Initialize Theme from localStorage or default to dark
    useEffect(() => {
        try {
            const savedTheme = localStorage.getItem('readr_theme') as 'dark' | 'light' | null;
            const chosenTheme = savedTheme || 'dark';
            setTheme(chosenTheme);

            if (chosenTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        } catch (e) {
            console.error('Failed to access theme from storage:', e);
        }
    }, []);

    // Toggle Theme
    const handleToggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);

        if (nextTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        try {
            localStorage.setItem('readr_theme', nextTheme);
        } catch (e) {
            console.error('Failed to save theme:', e);
        }
    };

    // 2. Load documents from MCP server
    const loadDocuments = useCallback(async () => {
        setIsDocsLoading(true);
        try {
            const docs = await McpClientService.getDocuments();
            setDocuments(docs);
        } finally {
            setIsDocsLoading(false);
        }
    }, []);

    // 3. Load conversations from localStorage on initial render
    useEffect(() => {
        loadDocuments();

        try {
            const saved = localStorage.getItem('readr_conversations');
            if (saved) {
                const parsed = JSON.parse(saved);
                setConversations(parsed);
                if (parsed.length > 0) {
                    setActiveConversationId(parsed[0].id);
                }
            }
        } catch (e) {
            console.error('Failed to load local conversations:', e);
        }
    }, [loadDocuments]);

    // 4. Persist conversations to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('readr_conversations', JSON.stringify(conversations));
        } catch (e) {
            console.error('Failed to save conversations:', e);
        }
    }, [conversations]);

    // Current active conversation
    const activeConversation = conversations.find((c) => c.id === activeConversationId);
    const activeMessages = activeConversation ? activeConversation.messages : [];

    // Start New Chat
    const handleNewChat = () => {
        setIsMemoryView(false);
        setActiveConversationId(null);
    };

    // Select Conversation
    const handleSelectConversation = (id: string) => {
        setIsMemoryView(false);
        setActiveConversationId(id);
    };

    // Delete Conversation
    const handleDeleteConversation = (id: string) => {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConversationId === id) {
            setActiveConversationId(null);
        }
    };

    // Delete Document from MCP Store
    const handleDeleteDocument = async (id: string) => {
        const success = await McpClientService.deleteDocument(id);
        if (success) {
            await loadDocuments();
        }
    };

    // Send Message / Ask Document with Live Response Streaming
    const handleSendMessage = async (content: string) => {
        if (!content.trim() || isLoading) return;

        setIsLoading(true);
        setStreamingProgress({ message: 'Initiating SSE connection with MCP server...' });

        const userMsg: ChatMessage = {
            id: 'msg_' + Math.random().toString(36).substring(2, 9),
            role: 'user',
            content,
            timestamp: Date.now(),
        };

        let currentConvId = activeConversationId;

        // If no conversation is active, create one titled by the first question
        if (!currentConvId) {
            const newConv: Conversation = {
                id: 'conv_' + Math.random().toString(36).substring(2, 9),
                title: content.slice(0, 36) + (content.length > 36 ? '...' : ''),
                messages: [userMsg],
                createdAt: Date.now(),
            };
            currentConvId = newConv.id;
            setConversations((prev) => [newConv, ...prev]);
            setActiveConversationId(newConv.id);
        } else {
            // Append user message
            setConversations((prev) =>
                prev.map((c) => (c.id === currentConvId ? { ...c, messages: [...c.messages, userMsg] } : c))
            );
        }

        try {
            // Step 1: Query the pure MCP server with live SSE progress stream
            const result = await McpClientService.askDocument(content, (message, progress) => {
                setStreamingProgress({ message, progress });
            });

            // Step 2: Clear intermediate progress indicator
            setStreamingProgress(null);

            if (result.found && result.match) {
                const fullText = result.match.sourceText;
                const words = fullText.split(/(\s+)/); // preserve whitespaces
                const assistantMsgId = 'msg_' + Math.random().toString(36).substring(2, 9);

                // Initial empty assistant message with isStreaming: true
                const initialMsg: ChatMessage = {
                    id: assistantMsgId,
                    role: 'assistant',
                    content: '',
                    source: { ...result.match, sourceText: '' },
                    isFound: true,
                    isStreaming: true,
                    timestamp: Date.now(),
                };

                setConversations((prev) =>
                    prev.map((c) =>
                        c.id === currentConvId ? { ...c, messages: [...c.messages, initialMsg] } : c
                    )
                );

                // Step 3: Stream words smoothly (ChatGPT / Gemini style response streaming)
                let accumulated = '';
                for (let i = 0; i < words.length; i++) {
                    accumulated += words[i];
                    const isLast = i === words.length - 1;
                    const currentText = accumulated;

                    setConversations((prev) =>
                        prev.map((c) =>
                            c.id === currentConvId
                                ? {
                                      ...c,
                                      messages: c.messages.map((m) =>
                                          m.id === assistantMsgId
                                              ? {
                                                    ...m,
                                                    content: currentText,
                                                    source: { ...result.match!, sourceText: currentText },
                                                    isStreaming: !isLast,
                                                }
                                              : m
                                      ),
                                  }
                                : c
                        )
                    );

                    // Cadence delay per token
                    await new Promise((r) => setTimeout(r, 22));
                }
            } else {
                // Strictly nothing found
                const assistantMsg: ChatMessage = {
                    id: 'msg_' + Math.random().toString(36).substring(2, 9),
                    role: 'assistant',
                    content: 'nothing found',
                    source: null,
                    isFound: false,
                    isStreaming: false,
                    timestamp: Date.now(),
                };

                setConversations((prev) =>
                    prev.map((c) =>
                        c.id === currentConvId ? { ...c, messages: [...c.messages, assistantMsg] } : c
                    )
                );
            }
        } catch (error: any) {
            setStreamingProgress(null);
            const errorMsg: ChatMessage = {
                id: 'msg_' + Math.random().toString(36).substring(2, 9),
                role: 'assistant',
                content: `Error connecting to MCP server: ${error?.message || 'Server offline'}`,
                isFound: false,
                isStreaming: false,
                timestamp: Date.now(),
            };

            setConversations((prev) =>
                prev.map((c) =>
                    c.id === currentConvId ? { ...c, messages: [...c.messages, errorMsg] } : c
                )
            );
        } finally {
            setIsLoading(false);
            setStreamingProgress(null);
        }
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-white text-black dark:bg-black dark:text-white font-sans transition-colors duration-150">
            {/* 1. Left Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={handleSelectConversation}
                onNewChat={handleNewChat}
                onDeleteConversation={handleDeleteConversation}
                onOpenMemory={() => {
                    setIsMemoryView(true);
                }}
                isMemoryActive={isMemoryView}
                documentCount={documents.length}
            />

            {/* 2. Main Content Canvas */}
            <div className="flex-1 flex flex-col h-full min-w-0">
                {/* Top Navigation */}
                <TopNav
                    title={isMemoryView ? 'App Memory' : activeConversation?.title || 'New Search'}
                    onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
                    onOpenIngestModal={() => setIsIngestModalOpen(true)}
                    onOpenMemory={() => setIsMemoryView(true)}
                    currentTheme={theme}
                    onToggleTheme={handleToggleTheme}
                    isMemoryView={isMemoryView}
                />

                {/* Main Body: Switches between Memory View and Chat UI */}
                {isMemoryView ? (
                    <MemoryView
                        documents={documents}
                        isLoading={isDocsLoading}
                        onRefresh={loadDocuments}
                        onDeleteDocument={handleDeleteDocument}
                        onOpenIngestModal={() => setIsIngestModalOpen(true)}
                        onBackToChat={() => setIsMemoryView(false)}
                    />
                ) : (
                    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
                        <ChatContainer
                            messages={activeMessages}
                            isLoading={isLoading}
                            streamingProgress={streamingProgress}
                            onSelectSuggestion={handleSendMessage}
                            documentCount={documents.length}
                        />

                        <ChatInput
                            onSendMessage={handleSendMessage}
                            isLoading={isLoading}
                        />
                    </div>
                )}
            </div>

            {/* 3. Ingest Document Modal */}
            <IngestModal
                isOpen={isIngestModalOpen}
                onClose={() => setIsIngestModalOpen(false)}
                onDocumentIngested={loadDocuments}
            />
        </div>
    );
}
