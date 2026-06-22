"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SendIcon, StopIcon, XIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { ChatMessage } from "@/components/ai-match/ChatMessage";
import { ConnectionStatus } from "@/components/ai-match/ConnectionStatus";
import { MatchPageHeader } from "@/components/ai-match/MatchPageHeader";
import { EmptyMatchState } from "@/components/ai-match/EmptyMatchState";
import { useAIMatch } from "@/hooks/useAIMatch";
import { useAddToShortlist } from "@/lib/api/hooks/useShortlistApi";
import { toast } from "sonner";

export default function AIMatchPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    sessionId,
    messages,
    isLoading,
    isProcessing,
    error,
    rateLimitInfo,
    userType,
    sendMessage,
    cancelCurrent,
    clearMessages,
    clearError,
  } = useAIMatch();

  const addToShortlistMutation = useAddToShortlist();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [prompt]);

  const handleExampleClick = (example: string) => {
    setPrompt(example);
    textareaRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || isProcessing) return;
    const messageToSend = prompt;
    setPrompt("");
    await sendMessage(messageToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleAddToShortlist = async (developerId: string) => {
    try {
      await addToShortlistMutation.mutateAsync(developerId);
      toast.success("Developer added to shortlist");
    } catch {
      toast.error("Failed to add to shortlist");
    }
  };

  const handleViewProfile = (developerId: string) => {
    router.push(`/dashboard/developers/${developerId}`);
  };

  const hasMessages = messages.length > 0;

  return (
    <DashboardLayout>
      <MatchPageHeader
        rateLimitInfo={rateLimitInfo}
        hasMessages={hasMessages}
        userType={userType}
        onNewChat={() => clearMessages(true)}
      />

      <div className="flex flex-col h-[calc(100vh-56px)]">
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-sm text-slate-500">Loading conversation...</p>
              </div>
            </div>
          ) : !hasMessages ? (
            <EmptyMatchState userType={userType} onExampleClick={handleExampleClick} />
          ) : (
            <div className="max-w-3xl mx-auto">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onAddToShortlist={handleAddToShortlist}
                  onViewProfile={handleViewProfile}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        {error && (
          <div className="mx-6 mb-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={clearError}
              className="shrink-0 p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              aria-label="Dismiss error"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="bg-white border-t border-slate-200 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your ideal developer or project requirements..."
                rows={1}
                disabled={isLoading || !sessionId}
                className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white disabled:opacity-50"
              />
              {isProcessing ? (
                <Button variant="danger-solid" size="icon-lg" onClick={cancelCurrent}>
                  <StopIcon className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="icon-lg"
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || isLoading || !sessionId}
                >
                  <SendIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-400 text-center mt-2">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
      <ConnectionStatus />
    </DashboardLayout>
  );
}
