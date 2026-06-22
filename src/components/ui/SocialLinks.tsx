import { GithubIcon, LinkedinIcon, MailIcon } from "@/components/icons";

type LinkSize = "sm" | "md";

interface SocialLinksProps {
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  email?: string | null;
  size?: LinkSize;
  className?: string;
}

const sizeClasses: Record<LinkSize, { container: string; icon: string }> = {
  sm: { container: "p-1.5", icon: "w-3.5 h-3.5" },
  md: { container: "p-2", icon: "w-4 h-4" },
};

export function SocialLinks({
  githubUrl,
  linkedinUrl,
  email,
  size = "sm",
  className = "",
}: SocialLinksProps) {
  const hasLinks = githubUrl || linkedinUrl || email;
  if (!hasLinks) return null;

  const config = sizeClasses[size];

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {githubUrl && (
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${config.container} rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors`}
          title="GitHub"
        >
          <GithubIcon className={config.icon} />
        </a>
      )}
      {linkedinUrl && (
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${config.container} rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors`}
          title="LinkedIn"
        >
          <LinkedinIcon className={config.icon} />
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className={`${config.container} rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors`}
          title="Email"
        >
          <MailIcon className={config.icon} />
        </a>
      )}
    </div>
  );
}
