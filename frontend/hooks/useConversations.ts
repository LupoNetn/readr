'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Conversation, ChatMessage } from '../lib/types';

const STORAGE_KEY = 'readr_conversations';

export function useConversations() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

    // 1. Initial hydration from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed: Conversation[] = JSON.parse(saved);
                setConversations(parsed);
                if (parsed.length > 0) {
                    setActiveConversationId(parsed[0].id);
                }
            }
        } catch (e) {
            console.error('Failed to load local conversations:', e);
        }
    }, []);

    // 2. Write-through persistence to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
        } catch (e) {
            console.error('Failed to save conversations:', e);
        }
    }, [conversations]);

    // Active conversation & messages
    const activeConversation = useMemo(
        () => conversations.find((c) => c.id === activeConversationId),
        [conversations, activeConversationId]
    );

    const activeMessages = useMemo(
        () => (activeConversation ? activeConversation.messages : []),
        [activeConversation]
    );

    // Start New Chat
    const startNewChat = useCallback(() => {
        setActiveConversationId(null);
    }, []);

    // Select Conversation
    const selectConversation = useCallback((id: string) => {
        setActiveConversationId(id);
    }, []);

    // Delete Conversation
    const deleteConversation = useCallback((id: string) => {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        setActiveConversationId((currentId) => (currentId === id ? null : currentId));
    }, []);

    // Create a new conversation and set it as active
    const createConversation = useCallback((firstMessage: ChatMessage): string => {
        const title = firstMessage.content.slice(0, 36) + (firstMessage.content.length > 36 ? '...' : '');
        const newConv: Conversation = {
            id: 'conv_' + Math.random().toString(36).substring(2, 9),
            title,
            messages: [firstMessage],
            createdAt: Date.now(),
        };

        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        return newConv.id;
    }, []);

    // Append a message to an existing conversation
    const appendMessage = useCallback((convId: string, message: ChatMessage) => {
        setConversations((prev) =>
            prev.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, message] } : c))
        );
    }, []);

    // Update an existing message inside a conversation (e.g., during streaming)
    const updateMessage = useCallback(
        (convId: string, messageId: string, partial: Partial<ChatMessage>) => {
            setConversations((prev) =>
                prev.map((c) =>
                    c.id === convId
                        ? {
                              ...c,
                              messages: c.messages.map((m) =>
                                  m.id === messageId ? { ...m, ...partial } : m
                              ),
                          }
                        : c
                )
            );
        },
        []
    );

    return {
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
    };
}
