"use client";

import { useState, useEffect, useMemo } from "react";

const TOOL_LABELS: Record<string, string> = {
  search_developers: "Searching developers",
  search_by_role: "Searching by role",
  semantic_search_developers: "Searching by meaning",
  get_developer_details: "Reviewing profiles",
  get_available_tech_stack: "Loading tech stack",
  get_developer_statistics: "Analyzing statistics",
};

interface ToolCall {
  name: string;
  status: "pending" | "running" | "completed";
}

interface AIWorkingIndicatorProps {
  thinkingStep?: string;
  toolCalls?: ToolCall[];
  matchCount?: number;
}

export function AIWorkingIndicator({
  thinkingStep,
  toolCalls = [],
  matchCount = 0,
}: AIWorkingIndicatorProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);

    return () => clearInterval(dotInterval);
  }, []);

  const statusMessage = useMemo(() => {
    if (matchCount > 0) {
      return `Found ${matchCount} match${matchCount === 1 ? "" : "es"}`;
    }

    const runningTool = toolCalls.find((tc) => tc.status === "running");
    if (runningTool) {
      return TOOL_LABELS[runningTool.name] || "Processing";
    }

    const completedTools = toolCalls.filter((tc) => tc.status === "completed");
    if (completedTools.length > 0) {
      const lastTool = completedTools[completedTools.length - 1];
      if (lastTool.name === "search_developers" || lastTool.name === "search_by_role") {
        return "Evaluating candidates";
      }
      if (lastTool.name === "get_developer_details") {
        return "Scoring compatibility";
      }
      return "Processing results";
    }

    if (thinkingStep) {
      return thinkingStep;
    }

    if (toolCalls.length > 0) {
      return "Processing";
    }

    return "Analyzing your request";
  }, [thinkingStep, toolCalls, matchCount]);

  return (
    <div className="flex items-center gap-3 py-2 px-3 bg-linear-to-r from-indigo-50 to-slate-50 rounded-xl w-fit">
      <div className="relative w-4 h-4">
        <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-30" />
        <div className="absolute inset-0.5 bg-indigo-500 rounded-full" />
      </div>
      <span className="text-sm text-slate-600 font-medium min-w-45">
        {statusMessage}
        <span className="inline-block w-6 text-left">{dots}</span>
      </span>
    </div>
  );
}
