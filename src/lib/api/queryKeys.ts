export const queryKeys = {
  me: ["users/me"] as const,
  developerMe: ["developers/me"] as const,
  recruiterMe: ["recruiters/me"] as const,
  developer: (id: string) => [`developers/${id}`] as const,
  developers: (params: Record<string, unknown>) => ["developers", params] as const,
  shortlist: ["shortlist"] as const,
  shortlistCount: ["shortlist/count"] as const,
  shortlistCheck: (developerId: string) =>
    [`shortlist/check/${developerId}`] as const,
  onboardingMe: ["onboarding/me"] as const,
  onboardingDraft: ["onboarding/me/draft"] as const,
} as const;
