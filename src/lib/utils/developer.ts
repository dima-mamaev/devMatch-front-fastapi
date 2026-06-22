import { SENIORITY_YEARS } from "@/lib/constants";

export function formatSeniorityLevel(level: string): string {
  const years = SENIORITY_YEARS[level.toLowerCase()];
  return years ? `${years} exp` : level;
}
