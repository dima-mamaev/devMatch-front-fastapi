"use client";

import Link from "next/link";
import {
  MapPinIcon,
  UserIcon,
  BriefcaseIcon,
  TrashIcon,
} from "@/components/icons";
import { ProfileAvatar } from "./ProfileAvatar";
import { TechStackBadges } from "./TechStackBadges";
import { SocialLinks } from "./SocialLinks";
import { ShortlistButton } from "./ShortlistButton";

export interface DeveloperPreviewData {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string | null;
  bio?: string | null;
  location?: string | null;
  seniorityLevel?: string | null;
  techStack: string[];
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  profilePhoto?: { url: string } | null;
}

interface DeveloperPreviewCardProps {
  developer: DeveloperPreviewData;
  isShortlisted?: boolean;
  isLoading?: boolean;
  onToggleShortlist?: (developerId: string) => void;
  onRemove?: (developerId: string) => void;
  showActions?: boolean;
}

export function DeveloperPreviewCard({
  developer,
  isShortlisted = false,
  isLoading = false,
  onToggleShortlist,
  onRemove,
  showActions = true,
}: DeveloperPreviewCardProps) {
  const fullName = `${developer.firstName} ${developer.lastName}`.trim();

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col justify-between">
      <div className="dlex flex-col">
        <div className="flex gap-3">
          <div className="shrink-0">
            <ProfileAvatar
              photoUrl={developer.profilePhoto?.url}
              firstName={developer.firstName}
              lastName={developer.lastName}
              size="md"
            />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <h3 className="text-base font-bold text-slate-900">{fullName}</h3>
            <p className="text-xs text-slate-500">
              {developer.jobTitle || "Developer"}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 mt-4">
          {developer.location && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <MapPinIcon className="w-3 h-3" />
              {developer.location}
            </div>
          )}
          {developer.seniorityLevel && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <BriefcaseIcon className="w-3 h-3" />
              {developer.seniorityLevel.replace(/_/g, " ")}
            </div>
          )}
        </div>
        <TechStackBadges techStack={developer.techStack} limit="preview" className="mt-4" />
        {developer.bio && (
          <p className="text-xs text-slate-500 leading-relaxed mt-4 line-clamp-3">
            {developer.bio}
          </p>
        )}
      </div>
      <div className="flex flex-col">
        <SocialLinks
          githubUrl={developer.githubUrl}
          linkedinUrl={developer.linkedinUrl}
          className="mt-4"
        />
        {showActions && (
          <div className="flex gap-2 mt-4">
            <Link
              href={`/dashboard/developers/${developer.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 rounded-[14px] text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <UserIcon className="w-3 h-3" />
              Profile
            </Link>
            {onRemove ? (
              <button
                onClick={() => onRemove(developer.id)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 border border-red-200 rounded-[14px] text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <TrashIcon className="w-3 h-3" />
                Remove
              </button>
            ) : onToggleShortlist ? (
              <ShortlistButton
                isShortlisted={isShortlisted}
                isLoading={isLoading}
                onClick={() => onToggleShortlist(developer.id)}
                className="flex-1 rounded-[14px]"
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
