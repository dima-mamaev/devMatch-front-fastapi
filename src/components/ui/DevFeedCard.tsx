import Link from "next/link";
import { toast } from "sonner";
import { useShortlist } from "@/hooks/useShortlist";
import { formatSeniorityLevel } from "@/lib/utils/developer";
import { ProfileAvatar } from "./ProfileAvatar";
import { TechStackBadges } from "./TechStackBadges";
import { ShortlistButton } from "./ShortlistButton";

interface Developer {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string | null;
  location?: string | null;
  seniorityLevel?: string | null;
  techStack: string[];
  profilePhoto?: {
    url: string;
  } | null;
}

interface DevFeedCardProps {
  developer: Developer;
}

function DevFeedCard({ developer }: DevFeedCardProps) {
  const {
    isInShortlist,
    toggleShortlist,
    isLoading: shortlistLoading,
  } = useShortlist();

  const isShortlisted = isInShortlist(developer.id);
  const fullName = `${developer.firstName} ${developer.lastName}`.trim();

  const handleToggleShortlist = async () => {
    const wasShortlisted = isShortlisted;
    const success = await toggleShortlist(developer.id);
    if (success) {
      toast.success(wasShortlisted ? "Removed from shortlist" : "Added to shortlist");
    } else {
      toast.error(wasShortlisted ? "Failed to remove from shortlist" : "Failed to add to shortlist");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
      <div className="flex gap-3 mb-3">
        <div className="shrink-0">
          <ProfileAvatar
            photoUrl={developer.profilePhoto?.url}
            firstName={developer.firstName}
            lastName={developer.lastName}
            size="md"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {fullName}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {developer.jobTitle || "Developer"}
          </p>
          <p className="text-xs text-slate-400">
            {[
              developer.location,
              developer.seniorityLevel && formatSeniorityLevel(developer.seniorityLevel),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>
      <TechStackBadges techStack={developer.techStack} limit="compact" className="mb-3" />
      <div className="flex gap-2">
        <Link
          href={`/dashboard/developers/${developer.id}`}
          className="flex-1 flex items-center justify-center px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          View Profile
        </Link>
        <ShortlistButton
          isShortlisted={isShortlisted}
          isLoading={shortlistLoading}
          onClick={handleToggleShortlist}
          className="flex-1"
        />
      </div>
    </div>
  );
}

export default DevFeedCard;
