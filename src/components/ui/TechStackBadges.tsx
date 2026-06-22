import { TECH_STACK_LIMITS } from "@/lib/constants";

type BadgeSize = "xs" | "sm" | "md";
type BadgeVariant = "default" | "indigo" | "glass";

interface TechStackBadgesProps {
  techStack: string[];
  limit?: number | keyof typeof TECH_STACK_LIMITS;
  size?: BadgeSize;
  variant?: BadgeVariant;
  className?: string;
}

const sizeClasses: Record<BadgeSize, string> = {
  xs: "px-2 py-0.5 text-xs",
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
};

const variantClasses: Record<BadgeVariant, { badge: string; overflow: string }> = {
  default: {
    badge: "bg-slate-100 border border-slate-200 text-slate-600",
    overflow: "text-slate-400",
  },
  indigo: {
    badge: "bg-indigo-50 text-indigo-700",
    overflow: "text-slate-400",
  },
  glass: {
    badge: "bg-white/20 text-white",
    overflow: "text-white/70",
  },
};

export function TechStackBadges({
  techStack,
  limit = "compact",
  size = "sm",
  variant = "default",
  className = "",
}: TechStackBadgesProps) {
  if (techStack.length === 0) return null;

  const maxItems = typeof limit === "number" ? limit : TECH_STACK_LIMITS[limit];
  const visibleItems = techStack.slice(0, maxItems);
  const remainingCount = techStack.length - visibleItems.length;
  const styles = variantClasses[variant];

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {visibleItems.map((tech) => (
        <span
          key={tech}
          className={`rounded-lg font-medium ${sizeClasses[size]} ${styles.badge}`}
        >
          {tech}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className={`${sizeClasses[size]} ${styles.overflow}`}>
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
