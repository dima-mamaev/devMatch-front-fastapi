"use client";

import { DeveloperMatch } from "@/hooks/useAIMatch";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { TechStackBadges } from "@/components/ui/TechStackBadges";
import { getMatchScoreColor, AVAILABILITY_STATUS } from "@/lib/constants";

interface DeveloperMatchCardProps {
  match: DeveloperMatch;
  rank: number;
  onAddToShortlist?: (developerId: string) => void;
  onViewProfile?: (developerId: string) => void;
}

export function DeveloperMatchCard({
  match,
  rank,
  onAddToShortlist,
  onViewProfile,
}: DeveloperMatchCardProps) {
  const availability = match.availabilityStatus
    ? AVAILABILITY_STATUS[match.availabilityStatus]
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
      <div className="flex gap-4">
        <div className="shrink-0">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-slate-600">#{rank}</span>
          </div>
        </div>
        <div className="shrink-0">
          <ProfileAvatar
            photoUrl={match.profilePhotoUrl}
            firstName={match.firstName}
            lastName={match.lastName}
            size="md"
            className="rounded-xl"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-slate-900">
                {match.firstName} {match.lastName}
              </h4>
              {match.jobTitle && (
                <p className="text-sm text-slate-500">{match.jobTitle}</p>
              )}
              {match.location && (
                <p className="text-xs text-slate-400 mt-0.5">{match.location}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${getMatchScoreColor(match.score)}`} />
              <span className="text-sm font-semibold text-slate-700">
                {match.score}%
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {match.seniorityLevel && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md">
                {match.seniorityLevel}
              </span>
            )}
            {availability && (
              <span className={`px-2 py-0.5 text-xs rounded-md ${availability.className}`}>
                {availability.label}
              </span>
            )}
          </div>
          <TechStackBadges
            techStack={match.techStack || []}
            limit="detailed"
            size="xs"
            variant="indigo"
            className="mt-2"
          />
          {match.reasoning && (
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {match.reasoning}
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onViewProfile?.(match.developerId)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              View Profile
            </button>
            <button
              onClick={() => onAddToShortlist?.(match.developerId)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Add to Shortlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
