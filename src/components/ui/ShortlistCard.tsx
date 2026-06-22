"use client";

import {
  GithubIcon,
  LinkedinIcon,
  MailIcon,
  UserIcon,
  TrashIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { ProfileAvatar } from "./ProfileAvatar";
import { TechStackBadges } from "./TechStackBadges";
import { SENIORITY_YEARS } from "@/lib/constants";

interface Developer {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string | null;
  location?: string | null;
  seniorityLevel?: string | null;
  techStack: string[];
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  email?: string | null;
  bio?: string | null;
  profilePhoto?: { url: string } | null;
}

interface ShortlistCardProps {
  developer: Developer;
  onRemove: (developerId: string) => void;
  isLoading?: boolean;
}

export function ShortlistCard({
  developer,
  onRemove,
  isLoading = false,
}: ShortlistCardProps) {
  const fullName = `${developer.firstName} ${developer.lastName}`.trim();

  const experienceText = developer.seniorityLevel
    ? SENIORITY_YEARS[developer.seniorityLevel.toLowerCase()] || developer.seniorityLevel
    : null;

  const locationExperience = [developer.location, experienceText ? `${experienceText} experience` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div className="flex gap-4">
        <div className="shrink-0">
          <ProfileAvatar
            photoUrl={developer.profilePhoto?.url}
            firstName={developer.firstName}
            lastName={developer.lastName}
            size="lg"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-slate-900">{fullName}</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {developer.jobTitle || "Developer"}
          </p>
          {locationExperience && (
            <p className="text-xs text-slate-400 mt-0.5">{locationExperience}</p>
          )}
          <TechStackBadges techStack={developer.techStack} limit="detailed" size="xs" className="mt-3" />
        </div>
        <div className="shrink-0 flex flex-col gap-2">
          <div className="flex gap-2">
            {developer.githubUrl && (
              <Button variant="outline-muted" size="xs" href={developer.githubUrl}>
                <GithubIcon className="w-3 h-3" />
                GitHub
              </Button>
            )}
            {developer.linkedinUrl && (
              <Button variant="outline-muted" size="xs" href={developer.linkedinUrl}>
                <LinkedinIcon className="w-3 h-3" />
                LinkedIn
              </Button>
            )}
            {developer.email && (
              <Button variant="outline-muted" size="xs" href={`mailto:${developer.email}`}>
                <MailIcon className="w-3 h-3" />
                Email
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="xs"
              href={`/dashboard/developers/${developer.id}`}
              className="flex-1"
            >
              <UserIcon className="w-3 h-3" />
              Profile
            </Button>
            <Button
              variant="danger"
              size="xs"
              onClick={() => onRemove(developer.id)}
              disabled={isLoading}
            >
              <TrashIcon className="w-3 h-3" />
              Remove
            </Button>
          </div>
        </div>
      </div>
      {developer.bio && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
            {developer.bio}
          </p>
        </div>
      )}
    </div>
  );
}
