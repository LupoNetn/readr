'use client';

import React, { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { TopNav } from '../components/layout/TopNav';
import { ChatContainer } from '../components/chat/ChatContainer';
import { ChatInput } from '../components/chat/ChatInput';
import { MemoryView } from '../components/memory/MemoryView';
import { IngestModal } from '../components/modals/IngestModal';
import { useTheme } from '../hooks/useTheme';
import { useDocuments } from '../hooks/useDocuments';
import { useConversations } from '../hooks/useConversations';
import { useChatStream } from '../hooks/useChatStream';

export default function Home() {
    const [isMemoryView, setIsMemoryView] = useState(false);
    const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { theme, toggleTheme } = useTheme();
    const { documents, isDocsLoading, loadDocuments, deleteDocument } = useDocuments();
    const {
        conversations,
        activeConversationId,
        activeConversation,
        activeMessages,
        startNewChat,
        selectConversation,
        deleteConversation,
        createConversation,
        appendMessage,
        updateMessage,
    } = useConversations();

    const { isLoading, streamingProgress, sendMessage } = useChatStream({
        activeConversationId,
        createConversation,
        appendMessage,
        updateMessage,
    });

    
    const handleNewChat = () => {
        setIsMemoryView(false);
        startNewChat();
    };

    const handleSelectConversation = (id: string) => {
        setIsMemoryView(false);
        selectConversation(id);
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-white text-black dark:bg-black dark:text-white font-sans transition-colors duration-150">
            {/* 1. Left Navigation Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={handleSelectConversation}
                onNewChat={handleNewChat}
                onDeleteConversation={deleteConversation}
                onOpenMemory={() => setIsMemoryView(true)}
                isMemoryActive={isMemoryView}
                documentCount={documents.length}
            />

            {/* 2. Main Content Canvas */}
            <div className="flex-1 flex flex-col h-full min-w-0">
                <TopNav
                    title={isMemoryView ? 'App Memory' : activeConversation?.title || 'New Search'}
                    onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
                    onOpenIngestModal={() => setIsIngestModalOpen(true)}
                    onOpenMemory={() => setIsMemoryView(true)}
                    currentTheme={theme}
                    onToggleTheme={toggleTheme}
                    isMemoryView={isMemoryView}
                />

                {isMemoryView ? (
                    <MemoryView
                        documents={documents}
                        isLoading={isDocsLoading}
                        onRefresh={loadDocuments}
                        onDeleteDocument={deleteDocument}
                        onOpenIngestModal={() => setIsIngestModalOpen(true)}
                        onBackToChat={() => setIsMemoryView(false)}
                    />
                ) : (
                    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
                        <ChatContainer
                            messages={activeMessages}
                            isLoading={isLoading}
                            streamingProgress={streamingProgress}
                            onSelectSuggestion={sendMessage}
                            documentCount={documents.length}
                        />

                        <ChatInput
                            onSendMessage={sendMessage}
                            isLoading={isLoading}
                        />
                    </div>
                )}
            </div>

           
            <IngestModal
                isOpen={isIngestModalOpen}
                onClose={() => setIsIngestModalOpen(false)}
                onDocumentIngested={loadDocuments}
            />
        </div>
    );
}
