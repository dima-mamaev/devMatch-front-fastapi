"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/api/queryKeys";
import type {
  AvailabilityStatus,
  Developer,
  DeveloperPage,
  SeniorityLevel,
} from "@/lib/api/types";

export interface DeveloperListFilter {
  page?: number;
  limit?: number;
  search?: string | null;
  techStack?: string[] | null;
  location?: string | null;
  seniorityLevels?: SeniorityLevel[] | null;
  availabilityStatus?: AvailabilityStatus[] | null;
  hasIntroVideo?: boolean | null;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  ids?: string[] | null;
  excludeIds?: string[] | null;
}

function toCsv(values: string[] | null | undefined): string | undefined {
  if (!values || values.length === 0) return undefined;
  return values.join(",");
}

function toParams(filter: DeveloperListFilter): Record<string, unknown> {
  return {
    page: filter.page ?? 1,
    limit: filter.limit ?? 20,
    search: filter.search ?? undefined,
    tech_stack: toCsv(filter.techStack),
    location: filter.location ?? undefined,
    seniority_levels: toCsv(filter.seniorityLevels),
    availability_status: toCsv(filter.availabilityStatus),
    has_intro_video: filter.hasIntroVideo ?? undefined,
    sort_by: filter.sortBy ?? "createdAt",
    sort_order: filter.sortOrder ?? "desc",
    ids: toCsv(filter.ids),
    exclude_ids: toCsv(filter.excludeIds),
  };
}

export function useDevelopers(filter: DeveloperListFilter = {}) {
  const params = toParams(filter);
  return useQuery<DeveloperPage>({
    queryKey: queryKeys.developers(params),
  });
}

export function useDeveloper(id: string | null | undefined) {
  return useQuery<Developer>({
    queryKey: queryKeys.developer(id ?? ""),
    enabled: !!id,
  });
}
