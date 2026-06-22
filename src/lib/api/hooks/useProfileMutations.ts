"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ApiError, apiFetch } from "@/lib/api/api-fetch";
import { queryKeys } from "@/lib/api/queryKeys";
import type {
  Certification,
  CreateCertification,
  CreateDeveloper,
  CreateExperience,
  CreateRecruiter,
  Developer,
  Experience,
  Recruiter,
  UpdateCertification,
  UpdateDeveloper,
  UpdateExperience,
  UpdateRecruiter,
} from "@/lib/api/types";

function invalidateProfile(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.me });
  qc.invalidateQueries({ queryKey: queryKeys.developerMe });
  qc.invalidateQueries({ queryKey: queryKeys.recruiterMe });
}

function uploadBody(file: File): FormData {
  const form = new FormData();
  form.append("file", file);
  return form;
}

export function useCreateDeveloperProfile() {
  const qc = useQueryClient();
  return useMutation<Developer, ApiError, CreateDeveloper>({
    mutationFn: (input) =>
      apiFetch<Developer>("developers", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateProfile(qc),
  });
}

export function useUpdateDeveloperProfile() {
  const qc = useQueryClient();
  return useMutation<Developer, ApiError, UpdateDeveloper>({
    mutationFn: (input) =>
      apiFetch<Developer>("developers/me", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateProfile(qc),
  });
}

export function useCreateRecruiterProfile() {
  const qc = useQueryClient();
  return useMutation<Recruiter, ApiError, CreateRecruiter>({
    mutationFn: (input) =>
      apiFetch<Recruiter>("recruiters", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateProfile(qc),
  });
}

export function useUpdateRecruiterProfile() {
  const qc = useQueryClient();
  return useMutation<Recruiter, ApiError, UpdateRecruiter>({
    mutationFn: (input) =>
      apiFetch<Recruiter>("recruiters/me", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateProfile(qc),
  });
}

export function useAddExperience() {
  const qc = useQueryClient();
  return useMutation<Experience, ApiError, CreateExperience>({
    mutationFn: (input) =>
      apiFetch<Experience>("developers/me/experiences", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateProfile(qc),
  });
}

export function useUpdateExperience() {
  const qc = useQueryClient();
  return useMutation<Experience, ApiError, { id: string; input: UpdateExperience }>({
    mutationFn: ({ id, input }) =>
      apiFetch<Experience>(`developers/me/experiences/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateProfile(qc),
  });
}

export function useDeleteExperience() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: async (id) => {
      await apiFetch(`developers/me/experiences/${id}`, { method: "DELETE" });
    },
    onSuccess: () => invalidateProfile(qc),
  });
}

export function useAddCertification() {
  const qc = useQueryClient();
  return useMutation<Certification, ApiError, CreateCertification>({
    mutationFn: (input) =>
      apiFetch<Certification>("developers/me/certifications", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateProfile(qc),
  });
}

export function useUpdateCertification() {
  const qc = useQueryClient();
  return useMutation<
    Certification,
    ApiError,
    { id: string; input: UpdateCertification }
  >({
    mutationFn: ({ id, input }) =>
      apiFetch<Certification>(`developers/me/certifications/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateProfile(qc),
  });
}

export function useDeleteCertification() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: async (id) => {
      await apiFetch(`developers/me/certifications/${id}`, { method: "DELETE" });
    },
    onSuccess: () => invalidateProfile(qc),
  });
}

export function useUploadProfilePhoto() {
  const qc = useQueryClient();
  return useMutation<Developer, ApiError, File>({
    mutationFn: (file) =>
      apiFetch<Developer>("developers/me/photo", {
        method: "POST",
        body: uploadBody(file),
      }),
    onSuccess: () => invalidateProfile(qc),
  });
}

export function useDeleteProfilePhoto() {
  const qc = useQueryClient();
  return useMutation<Developer, ApiError, void>({
    mutationFn: () =>
      apiFetch<Developer>("developers/me/photo", { method: "DELETE" }),
    onSuccess: () => invalidateProfile(qc),
  });
}

export function useUploadIntroVideo() {
  const qc = useQueryClient();
  return useMutation<Developer, ApiError, File>({
    mutationFn: (file) =>
      apiFetch<Developer>("developers/me/video", {
        method: "POST",
        body: uploadBody(file),
      }),
    onSuccess: () => invalidateProfile(qc),
  });
}

export function useDeleteIntroVideo() {
  const qc = useQueryClient();
  return useMutation<Developer, ApiError, void>({
    mutationFn: () =>
      apiFetch<Developer>("developers/me/video", { method: "DELETE" }),
    onSuccess: () => invalidateProfile(qc),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation<{ affected: number }, ApiError, void>({
    mutationFn: () =>
      apiFetch<{ affected: number }>("users/me", { method: "DELETE" }),
    onSuccess: () => {
      qc.clear();
    },
  });
}
