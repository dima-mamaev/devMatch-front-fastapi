"use client";

import { SparklesIcon, RefreshIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";

interface RateLimitInfo {
  remaining: number;
  limit: number;
}

interface MatchPageHeaderProps {
  rateLimitInfo: RateLimitInfo | null;
  hasMessages: boolean;
  userType: string | null;
  onNewChat: () => void;
}

export function MatchPageHeader({
  rateLimitInfo,
  hasMessages,
  userType,
  onNewChat,
}: MatchPageHeaderProps) {
  const isGuest = userType === "guest";
  const guestExhausted =
    isGuest && rateLimitInfo !== null && rateLimitInfo.remaining <= 0;

  return (
    <div className="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-indigo-50 rounded-[10px] flex items-center justify-center">
          <SparklesIcon className="w-3.5 h-3.5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900">AI Matching Assistant</h1>
          <p className="text-xs text-slate-400">Describe your role, get a ranked shortlist</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {guestExhausted ? (
          // Guest quota burnt — flip the counter chip into the sign-up CTA.
          // The hook surfaces 10/day for authenticated users so this
          // disappears the moment the user is signed in.
          <Button href="/join" variant="primary" size="xs">
            Sign up for more searches
          </Button>
        ) : (
          rateLimitInfo && (
            <div className="text-xs text-slate-500">
              <span className="font-medium">{rateLimitInfo.remaining}</span>
              <span className="text-slate-400">/{rateLimitInfo.limit} searches left</span>
            </div>
          )
        )}
        {hasMessages && (
          <Button variant="ghost-muted" size="xs" onClick={onNewChat}>
            <RefreshIcon className="w-3.5 h-3.5" />
            New chat
          </Button>
        )}
      </div>
    </div>
  );
}
