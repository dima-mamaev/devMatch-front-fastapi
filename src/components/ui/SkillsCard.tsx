import { TechStackBadges } from "./TechStackBadges";

interface SkillsCardProps {
  techStack: string[];
  title?: string;
}

export function SkillsCard({ techStack, title = "Skills & Tech Stack" }: SkillsCardProps) {
  if (techStack.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
      <h2 className="text-base font-bold text-slate-900 mb-4">{title}</h2>
      <TechStackBadges techStack={techStack} limit="full" size="md" />
    </div>
  );
}
