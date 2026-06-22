"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SearchIcon, XIcon } from "@/components/icons";
import { useDevelopers } from "@/lib/api/hooks/useDevelopers";
import type { AvailabilityStatus, SeniorityLevel } from "@/lib/api/types";
import { useShortlist } from "@/hooks/useShortlist";
import { DeveloperPreviewCard } from "@/components/ui/DeveloperPreviewCard";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/Button";
import { FilterDropdown, FilterOption } from "@/components/ui/FilterDropdown";
import { Input } from "@/components/ui/Input";

const ITEMS_PER_PAGE = 6;

const SENIORITY_OPTIONS: FilterOption<SeniorityLevel>[] = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-Level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "principal", label: "Principal" },
];

const AVAILABILITY_OPTIONS: FilterOption<AvailabilityStatus>[] = [
  { value: "Available", label: "Available" },
  { value: "OpenToOffers", label: "Open to Offers" },
  { value: "NotAvailable", label: "Not Available" },
];

export default function DevelopersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [seniorityFilter, setSeniorityFilter] = useState<SeniorityLevel | "">("");
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityStatus | "">("");

  const {
    isInShortlist,
    toggleShortlist,
    isLoading: shortlistLoading,
  } = useShortlist();

  // The API auto-excludes the caller's own developer row + filters to
  // onboarding-complete profiles, so no manual `excludeIds` is needed.
  const { data, isLoading: loading } = useDevelopers({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    search: debouncedSearch || null,
    seniorityLevels: seniorityFilter ? [seniorityFilter as SeniorityLevel] : null,
    availabilityStatus: availabilityFilter ? [availabilityFilter as AvailabilityStatus] : null,
  });

  const developers = data?.results ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (debouncedSearch !== searchQuery) {
        setDebouncedSearch(searchQuery);
        setCurrentPage(1);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSeniorityChange = (value: SeniorityLevel | "") => {
    setSeniorityFilter(value);
    setCurrentPage(1);
  };

  const handleAvailabilityChange = (value: AvailabilityStatus | "") => {
    setAvailabilityFilter(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSeniorityFilter("");
    setAvailabilityFilter("");
    setCurrentPage(1);
  };

  const hasActiveFilters = seniorityFilter || availabilityFilter;

  const handleToggleShortlist = async (developerId: string) => {
    const wasShortlisted = isInShortlist(developerId);
    const success = await toggleShortlist(developerId);
    if (success) {
      toast.success(wasShortlisted ? "Removed from shortlist" : "Added to shortlist");
    } else {
      toast.error(wasShortlisted ? "Failed to remove from shortlist" : "Failed to add to shortlist");
    }
  };

  return (
    <DashboardLayout>
      <div className="bg-white border-b border-slate-200 h-14 flex items-center px-6">
        <div>
          <h1 className="text-base font-bold text-slate-900">Developers</h1>
          <p className="text-xs text-slate-400">
            {loading ? "Loading..." : `${total} developers`}
          </p>
        </div>
      </div>
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by name, title, or skill..."
              icon={<SearchIcon className="w-4 h-4" />}
              className="bg-white shadow-sm py-2.5"
            />
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <FilterDropdown
            value={seniorityFilter}
            onChange={handleSeniorityChange}
            options={SENIORITY_OPTIONS}
            placeholder="Seniority"
            allLabel="All Levels"
          />
          <FilterDropdown
            value={availabilityFilter}
            onChange={handleAvailabilityChange}
            options={AVAILABILITY_OPTIONS}
            placeholder="Availability"
            allLabel="Any Status"
          />
          <Button
            variant="outline"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            type="button"
          >
            <XIcon className="w-4 h-4" />
            Clear Filters
          </Button>
        </div>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : developers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {developers.map((developer) => (
                <DeveloperPreviewCard
                  key={developer.id}
                  developer={developer}
                  isShortlisted={isInShortlist(developer.id)}
                  isLoading={shortlistLoading}
                  onToggleShortlist={handleToggleShortlist}
                />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              No developers found
            </h2>
            <p className="text-sm text-slate-500">
              Try adjusting your search or filters to find what you&apos;re looking for.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
