"use client";

import { BookmarkIcon } from "@/components/icons";

interface ShortlistButtonProps {
  isShortlisted: boolean;
  isLoading?: boolean;
  onClick: () => void;
  size?: "sm" | "md";
  className?: string;
}

export function ShortlistButton({
  isShortlisted,
  isLoading = false,
  onClick,
  size = "md",
  className = "",
}: ShortlistButtonProps) {
  const sizeClasses = size === "sm"
    ? "px-3 py-1.5 text-xs gap-1"
    : "px-3 py-2 text-xs gap-1.5";

  const iconSize = size === "sm" ? "w-3 h-3" : "w-3 h-3";

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`flex items-center justify-center font-semibold text-white rounded-xl transition-colors disabled:opacity-50 ${sizeClasses} ${
        isShortlisted
          ? "bg-emerald-600 hover:bg-emerald-700"
          : "bg-indigo-600 hover:bg-indigo-700"
      } ${className}`}
      title={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
    >
      <BookmarkIcon className={iconSize} />
      {isShortlisted ? "Shortlisted" : "Shortlist"}
    </button>
  );
}
