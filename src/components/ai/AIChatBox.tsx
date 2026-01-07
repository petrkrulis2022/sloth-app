import { useState, useEffect, useRef, useCallback } from "react";
import type { AIContextType, ChatMessage } from "@/types";
import { sendMessage } from "@/services/ai";

interface AIChatBoxProps {
  contextType: AIContextType;
  contextId: string;
  userId: string;
}

interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

/**
 * AI Chat Box component with localStorage persistence
 * Requirements: 9.1, 9.5, 12.1, 12.5
 */
export function AIChatBox({ contextType, contextId, userId }: AIChatBoxProps) {
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const storageKey = `ai_chat_${contextType}_${contextId}`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load messages from localStorage on mount or context change
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setMessages(parsed);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.warn("Failed to load chat history from localStorage:", err);
      setMessages([]);
    }
  }, [storageKey]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    setInputValue("");
    setIsLoading(true);
    setError(null);

    // Convert stored messages to ChatMessage format for API
    const conversationHistory: ChatMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const result = await sendMessage(
      contextType,
      contextId,
      trimmedInput,
      userId,
      conversationHistory
    );

    if (result.success && result.data) {
      const newMessages: StoredMessage[] = [
        ...messages,
        {
          role: "user",
          content: result.data.userMessage,
          timestamp: Date.now(),
        },
        {
          role: "assistant",
          content: result.data.aiResponse,
          timestamp: Date.now(),
        },
      ];
      setMessages(newMessages);

      // Save to localStorage
      try {
        localStorage.setItem(storageKey, JSON.stringify(newMessages));
      } catch (err) {
        console.warn("Failed to save chat to localStorage:", err);
      }
    } else {
      setError(result.message || "Failed to send message");
      setInputValue(trimmedInput);
    }

    setIsLoading(false);
  };

  const handleClearConversation = () => {
    if (!confirm("Are you sure you want to clear this conversation?")) return;

    setMessages([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (err) {
      console.warn("Failed to clear chat from localStorage:", err);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const contextLabel = contextType === "view" ? "Strategic" : "Technical";

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-teal-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <h3 className="text-sm font-medium text-white">
            AI {contextLabel} Assistant
          </h3>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClearConversation}
            disabled={isLoading}
            className="text-xs text-gray-400 hover:text-gray-300 disabled:opacity-50"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[400px]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
            <svg
              className="w-8 h-8 mb-2 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p>Start a conversation with your AI assistant</p>
            <p className="text-xs text-gray-600 mt-1">
              {contextType === "view"
                ? "Ask about strategy, planning, and goals"
                : "Ask technical questions and get research help"}
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.timestamp}-${index}`}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-teal-600 text-white"
                    : "bg-gray-800 text-gray-100"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === "user" ? "text-teal-200" : "text-gray-500"
                  }`}
                >
                  {formatTimestamp(message.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="animate-pulse flex gap-1">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-xs text-gray-400">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div
          className={`px-4 py-3 border-t ${
            error.includes("CORS") || error.includes("backend proxy")
              ? "bg-yellow-900/30 border-yellow-800"
              : "bg-red-900/50 border-red-800"
          }`}
        >
          <div className="flex items-start gap-2">
            <svg
              className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                error.includes("CORS") || error.includes("backend proxy")
                  ? "text-yellow-400"
                  : "text-red-400"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p
              className={`text-xs ${
                error.includes("CORS") || error.includes("backend proxy")
                  ? "text-yellow-200"
                  : "text-red-400"
              }`}
            >
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              contextType === "view"
                ? "Ask about strategy and planning..."
                : "Ask a technical question..."
            }
            disabled={isLoading}
            className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-4 py-2 border border-gray-700 focus:border-teal-500 focus:outline-none disabled:opacity-50 placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
