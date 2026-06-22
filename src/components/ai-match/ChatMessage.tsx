"use client";

import { ChatMessage as ChatMessageType, DeveloperMatch } from "@/hooks/useAIMatch";
import { DeveloperMatchCard } from "./DeveloperMatchCard";
import { AIWorkingIndicator } from "./AIWorkingIndicator";
import { SparklesIcon } from "@/components/icons";

interface ChatMessageProps {
  message: ChatMessageType;
  onAddToShortlist?: (developerId: string) => void;
  onViewProfile?: (developerId: string) => void;
}

/**
 * Render the assistant's error tag as a friendly chip with copy keyed off
 * the well-known error codes the hook emits. Anything else falls back to
 * the raw content string we already display below — no double error.
 */
function ErrorChip({ kind, content }: { kind: string; content: string }) {
  if (kind === "off_topic") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-3">
        <p className="text-sm text-amber-700">
          {content ||
            "I'm here to help you find tech & IT talent — devs, designers, PMs, DevOps, that kind of thing. What role are you looking to fill?"}
        </p>
      </div>
    );
  }
  if (kind === "rate_limited") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-3">
        <p className="text-sm text-amber-700">
          Daily search limit reached. Try again tomorrow or sign up for more.
        </p>
      </div>
    );
  }
  // Unknown kinds (stream errors, cap_hit, no_submit_matches, etc.) get a
  // generic chip — never expose the raw code to users.
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-3">
      <p className="text-sm text-red-600">
        Something went wrong on our side. Try sending the message again.
      </p>
    </div>
  );
}

export function ChatMessage({
  message,
  onAddToShortlist,
  onViewProfile,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] bg-indigo-600 text-white px-4 py-3 rounded-2xl rounded-br-md">
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
          <SparklesIcon className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          {message.error && (
            <ErrorChip kind={message.error} content={message.content} />
          )}
          {message.isStreaming && (
            <div className="mb-3">
              <AIWorkingIndicator
                thinkingStep={message.thinkingSteps?.at(-1)}
                toolCalls={message.toolCalls}
                matchCount={message.matches?.length}
              />
            </div>
          )}
          {message.matches && message.matches.length > 0 && (
            <div className="space-y-3 mb-3">
              {message.matches.map((match: DeveloperMatch, index: number) => (
                <DeveloperMatchCard
                  key={match.developerId}
                  match={match}
                  rank={index + 1}
                  onAddToShortlist={onAddToShortlist}
                  onViewProfile={onViewProfile}
                />
              ))}
            </div>
          )}
          {message.content && !message.isStreaming && !message.error && (
            <div className="bg-slate-50 rounded-xl px-4 py-3">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {message.content}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
