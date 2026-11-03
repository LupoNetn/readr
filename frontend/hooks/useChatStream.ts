'use client';

import { useState, useCallback } from 'react';
import { ChatMessage } from '../lib/types';
import { McpClientService } from '../lib/mcpClient';

interface UseChatStreamProps {
    activeConversationId: string | null;
    createConversation: (firstMessage: ChatMessage) => string;
    appendMessage: (convId: string, message: ChatMessage) => void;
    updateMessage: (convId: string, messageId: string, partial: Partial<ChatMessage>) => void;
}

export function useChatStream({
    activeConversationId,
    createConversation,
    appendMessage,
    updateMessage,
}: UseChatStreamProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [streamingProgress, setStreamingProgress] = useState<{ message: string; progress?: number } | null>(null);

    const sendMessage = useCallback(
        async (content: string) => {
            if (!content.trim() || isLoading) return;

            setIsLoading(true);
            setStreamingProgress({ message: 'Initiating SSE connection with MCP server...' });

            const userMsg: ChatMessage = {
                id: 'msg_' + Math.random().toString(36).substring(2, 9),
                role: 'user',
                content,
                timestamp: Date.now(),
            };

            // 1. Determine conversation ID
            let currentConvId = activeConversationId;
            if (!currentConvId) {
                currentConvId = createConversation(userMsg);
            } else {
                appendMessage(currentConvId, userMsg);
            }

            try {
                // 2. Query MCP server with live SSE progress stream
                const result = await McpClientService.askDocument(content, (message, progress) => {
                    setStreamingProgress({ message, progress });
                });

                setStreamingProgress(null);

                // 3. Handle found passage with smooth typewriter cadence
                if (result.found && result.match) {
                    const fullText = result.match.sourceText;
                    const words = fullText.split(/(\s+)/);
                    const assistantMsgId = 'msg_' + Math.random().toString(36).substring(2, 9);

                    // Insert initial empty streaming message
                    appendMessage(currentConvId, {
                        id: assistantMsgId,
                        role: 'assistant',
                        content: '',
                        source: { ...result.match, sourceText: '' },
                        allMatches: result.allMatches,
                        isFound: true,
                        isStreaming: true,
                        timestamp: Date.now(),
                    });

                    // Word-by-word typewriter streaming
                    let accumulated = '';
                    for (let i = 0; i < words.length; i++) {
                        accumulated += words[i];
                        const isLast = i === words.length - 1;
                        const currentText = accumulated;

                        updateMessage(currentConvId, assistantMsgId, {
                            content: currentText,
                            source: { ...result.match, sourceText: currentText },
                            allMatches: result.allMatches,
                            isStreaming: !isLast,
                        });

                        await new Promise((r) => setTimeout(r, 22));
                    }
                } else {
                    // Strictly nothing found
                    appendMessage(currentConvId, {
                        id: 'msg_' + Math.random().toString(36).substring(2, 9),
                        role: 'assistant',
                        content: 'nothing found',
                        source: null,
                        isFound: false,
                        isStreaming: false,
                        timestamp: Date.now(),
                    });
                }
            } catch (error: any) {
                setStreamingProgress(null);
                appendMessage(currentConvId, {
                    id: 'msg_' + Math.random().toString(36).substring(2, 9),
                    role: 'assistant',
                    content: `Error connecting to MCP server: ${error?.message || 'Server offline'}`,
                    isFound: false,
                    isStreaming: false,
                    timestamp: Date.now(),
                });
            } finally {
                setIsLoading(false);
                setStreamingProgress(null);
            }
        },
        [activeConversationId, isLoading, createConversation, appendMessage, updateMessage]
    );

    return {
        isLoading,
        streamingProgress,
        sendMessage,
    };
}
