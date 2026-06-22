export const SENIORITY_YEARS: Record<string, string> = {
  junior: "0-2 yrs",
  mid: "2-4 yrs",
  senior: "4-8 yrs",
  lead: "8-12 yrs",
  principal: "12+ yrs",
};

export const TECH_STACK_LIMITS = {
  compact: 3,
  preview: 4,
  detailed: 5,
  full: Infinity,
} as const;

export const AVAILABILITY_STATUS: Record<string, { label: string; className: string; dotClassName: string }> = {
  Available: { label: "Available", className: "bg-green-50 border-green-200 text-green-600", dotClassName: "bg-green-500" },
  OpenToWork: { label: "Open to work", className: "bg-emerald-50 text-emerald-700", dotClassName: "bg-emerald-500" },
  OpenToOffers: { label: "Open to offers", className: "bg-amber-50 border-amber-200 text-amber-600", dotClassName: "bg-amber-500" },
  NotAvailable: { label: "Not available", className: "bg-slate-50 border-slate-200 text-slate-500", dotClassName: "bg-slate-400" },
};

export const MATCH_SCORE_COLORS = {
  excellent: { min: 90, className: "bg-emerald-500" },
  good: { min: 75, className: "bg-lime-500" },
  fair: { min: 60, className: "bg-yellow-500" },
  low: { min: 0, className: "bg-orange-500" },
} as const;

export function getMatchScoreColor(score: number): string {
  if (score >= MATCH_SCORE_COLORS.excellent.min) return MATCH_SCORE_COLORS.excellent.className;
  if (score >= MATCH_SCORE_COLORS.good.min) return MATCH_SCORE_COLORS.good.className;
  if (score >= MATCH_SCORE_COLORS.fair.min) return MATCH_SCORE_COLORS.fair.className;
  return MATCH_SCORE_COLORS.low.className;
}
