"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { CameraIcon, VideoIcon } from "@/components/icons";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useDeveloperProfile } from "@/hooks/useUser";
import { useCompleteOnboarding } from "@/lib/api/hooks/useOnboarding";
import {
  useUploadIntroVideo,
  useUploadProfilePhoto,
} from "@/lib/api/hooks/useProfileMutations";
import { queryKeys } from "@/lib/api/queryKeys";
import type {
  Developer,
  DraftCertification,
  DraftExperience,
  DraftProfile,
  SeniorityLevel,
} from "@/lib/api/types";

interface ReviewDraftProps {
  draft: DraftProfile;
  onCompleted: (developer: Developer) => void;
  onSkip: () => void;
}

const SENIORITY_OPTIONS: { value: SeniorityLevel; label: string }[] = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-Level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "principal", label: "Principal" },
];

function CertificationEditor({
  cert,
  onChange,
  onRemove,
}: {
  cert: DraftCertification;
  onChange: (next: DraftCertification) => void;
  onRemove: () => void;
}) {
  const set = (patch: Partial<DraftCertification>) =>
    onChange({ ...cert, ...patch });
  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
      <input
        type="text"
        value={cert.name}
        placeholder="Certification name"
        onChange={(e) => set({ name: e.target.value })}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <textarea
        value={cert.description ?? ""}
        placeholder="Short description (issuer, what it covered)"
        rows={2}
        onChange={(e) => set({ description: e.target.value || null })}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <button
        type="button"
        onClick={onRemove}
        className="text-xs text-red-500 hover:text-red-700"
      >
        Remove
      </button>
    </div>
  );
}

function ExperienceEditor({
  exp,
  onChange,
  onRemove,
}: {
  exp: DraftExperience;
  onChange: (next: DraftExperience) => void;
  onRemove: () => void;
}) {
  const set = (patch: Partial<DraftExperience>) => onChange({ ...exp, ...patch });
  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={exp.position}
          placeholder="Position"
          onChange={(e) => set({ position: e.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          type="text"
          value={exp.companyName}
          placeholder="Company"
          onChange={(e) => set({ companyName: e.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          value={exp.startYear ?? ""}
          placeholder="Start year"
          onChange={(e) =>
            set({ startYear: e.target.value ? Number(e.target.value) : null })
          }
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          type="number"
          value={exp.endYear ?? ""}
          placeholder="End year (blank = present)"
          onChange={(e) =>
            set({ endYear: e.target.value ? Number(e.target.value) : null })
          }
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <textarea
        value={exp.description ?? ""}
        placeholder="Short description"
        rows={2}
        onChange={(e) => set({ description: e.target.value || null })}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <button
        type="button"
        onClick={onRemove}
        className="text-xs text-red-500 hover:text-red-700"
      >
        Remove this role
      </button>
    </div>
  );
}

export function ReviewDraft({ draft, onCompleted, onSkip }: ReviewDraftProps) {
  const qc = useQueryClient();
  const { setShowComplete } = useOnboarding();
  const complete = useCompleteOnboarding();
  const uploadPhoto = useUploadProfilePhoto();
  const uploadVideo = useUploadIntroVideo();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  // If a save partially succeeds (e.g. photo + video uploaded but complete
  // throws), we don't want the retry to re-upload media that's already on the
  // developer row. Track per-asset success so retries skip the upload step.
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [videoUploaded, setVideoUploaded] = useState(false);
  // Auth0 typically populates first/last at signup. Claude is told not to
  // invent names, so if the dev didn't say their name during the interview
  // the draft's firstName/lastName are null — but the profile still has them.
  // Fall back to the profile so the review form doesn't show empty name fields
  // for a dev who already has a name on file.
  const profile = useDeveloperProfile();

  const [firstName, setFirstName] = useState(
    draft.firstName ?? profile?.firstName ?? ""
  );
  const [lastName, setLastName] = useState(
    draft.lastName ?? profile?.lastName ?? ""
  );
  const [jobTitle, setJobTitle] = useState(draft.jobTitle ?? "");
  const [location, setLocation] = useState(draft.location ?? "");
  const [seniorityLevel, setSeniorityLevel] = useState<SeniorityLevel | "">(
    draft.seniorityLevel ?? ""
  );
  const [bio, setBio] = useState(draft.bio ?? "");
  const [techStackInput, setTechStackInput] = useState(
    (draft.techStack ?? []).join(", ")
  );
  const [experiences, setExperiences] = useState<DraftExperience[]>(
    draft.experiences ?? []
  );
  const [certifications, setCertifications] = useState<DraftCertification[]>(
    draft.certifications ?? []
  );

  const techStack = techStackInput
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const isSaving =
    complete.isPending || uploadPhoto.isPending || uploadVideo.isPending;

  const validExperiences = experiences.filter(
    (e) => e.position.trim() && e.companyName.trim(),
  );

  // What's missing — used both for canSubmit and the inline hint under Save.
  const missing: string[] = [];
  if (!photoFile && !photoUploaded) missing.push("photo");
  if (!videoFile && !videoUploaded) missing.push("intro video");
  if (!firstName.trim()) missing.push("first name");
  if (!lastName.trim()) missing.push("last name");
  if (!jobTitle.trim()) missing.push("job title");
  if (!location.trim()) missing.push("location");
  if (!seniorityLevel) missing.push("seniority");
  if (!bio.trim()) missing.push("bio");
  if (techStack.length === 0) missing.push("tech stack");
  if (validExperiences.length === 0) missing.push("at least one role");

  const canSubmit = missing.length === 0 && !isSaving;

  const handleSave = async () => {
    if (!canSubmit) return;
    // Pin the parent wrapper to the onboarding view for the duration of the
    // save. Without this, `complete` flips `onboarding_completed=true` on the
    // dev row mid-write, the parent stops rendering DeveloperOnboarding, and
    // DeveloperProfile (the editor) briefly shows with stale media — exactly
    // the "upload video placeholder" flash users saw.
    setShowComplete(true);
    try {
      // Phase 1: media uploads first, in parallel (independent of each other).
      // We commit them BEFORE `complete` so a failed `complete` doesn't orphan
      // a photo/video that's already on Cloudinary + attached to the dev row.
      // On retry, the per-asset `*Uploaded` flag short-circuits the upload.
      const mediaWork: Promise<unknown>[] = [];
      if (photoFile && !photoUploaded) {
        mediaWork.push(
          uploadPhoto.mutateAsync(photoFile).then(() => setPhotoUploaded(true)),
        );
      }
      if (videoFile && !videoUploaded) {
        mediaWork.push(
          uploadVideo.mutateAsync(videoFile).then(() => setVideoUploaded(true)),
        );
      }
      await Promise.all(mediaWork);

      // Phase 2: complete. Media is already attached, so a failure here just
      // means the user retries and we skip straight to this step.
      const dev = await complete.mutateAsync({
        draft: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          jobTitle: jobTitle.trim() || null,
          location: location.trim() || null,
          seniorityLevel: seniorityLevel === "" ? null : seniorityLevel,
          bio: bio.trim() || null,
          techStack,
          experiences: validExperiences,
          certifications: certifications.filter((c) => c.name.trim()),
        },
      });

      // Force a fresh fetch and await it so the next screen sees the photo +
      // the processing video, not the empty pre-upload placeholder.
      await qc.refetchQueries({ queryKey: queryKeys.developerMe });
      onCompleted(dev);
    } catch (err) {
      setShowComplete(false);
      toast.error((err as Error).message || "Couldn't save your profile.");
    }
  };

  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setPhotoFile(f);
    // A new pick supersedes any prior upload; the retry must re-upload.
    if (f) setPhotoUploaded(false);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(f ? URL.createObjectURL(f) : null);
  };

  const handleVideoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setVideoFile(f);
    if (f) setVideoUploaded(false);
    setVideoFileName(f?.name ?? null);
  };

  const addExperience = () => {
    setExperiences((prev) => [
      ...prev,
      {
        position: "",
        companyName: "",
        startYear: null,
        endYear: null,
        description: null,
      },
    ]);
  };

  const addCertification = () => {
    setCertifications((prev) => [...prev, { name: "", description: null }]);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-slate-900">Looks right?</h1>
        <p className="text-sm text-slate-500">
          Edit anything that&apos;s off, add a photo and intro video if you have
          them, and save.
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Photo &amp; intro video</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoPick}
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-indigo-600 overflow-hidden"
            >
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <CameraIcon className="w-5 h-5" />
                  <span className="text-xs font-medium">Profile photo</span>
                  <span className="text-[10px]">JPG, PNG, or WebP</span>
                </>
              )}
            </button>
            {photoFile && (
              <button
                type="button"
                onClick={() => {
                  setPhotoFile(null);
                  if (photoPreview) URL.revokeObjectURL(photoPreview);
                  setPhotoPreview(null);
                }}
                className="text-xs text-slate-400 hover:text-red-500"
              >
                Remove photo
              </button>
            )}
          </div>
          <div className="space-y-2">
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
              className="hidden"
              onChange={handleVideoPick}
            />
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-indigo-600 px-2 text-center"
            >
              <VideoIcon className="w-5 h-5" />
              <span className="text-xs font-medium">
                {videoFileName ? "Replace video" : "Intro video"}
              </span>
              <span className="text-[10px] truncate max-w-full">
                {videoFileName ?? "MP4, MOV, or WebM"}
              </span>
            </button>
            {videoFile && (
              <button
                type="button"
                onClick={() => {
                  setVideoFile(null);
                  setVideoFileName(null);
                }}
                className="text-xs text-slate-400 hover:text-red-500"
              >
                Remove video
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-400">You can update them later in account settings.</p>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Basics</h2>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={firstName}
            placeholder="First name *"
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={lastName}
            placeholder="Last name *"
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <input
          type="text"
          value={jobTitle}
          placeholder="Job title *"
          onChange={(e) => setJobTitle(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={location}
            placeholder="Location *"
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={seniorityLevel}
            onChange={(e) =>
              setSeniorityLevel(e.target.value as SeniorityLevel | "")
            }
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Seniority… *</option>
            {SENIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Bio *</h2>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          placeholder="Tell us about yourself"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Tech stack *</h2>
        <input
          type="text"
          value={techStackInput}
          onChange={(e) => setTechStackInput(e.target.value)}
          placeholder="Next.js, React, TypeScript…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <p className="text-xs text-slate-400">Comma-separated · at least one</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Certifications</h2>
          <button
            type="button"
            onClick={addCertification}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            + Add cert
          </button>
        </div>
        {certifications.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
            No certifications listed. Add some or continue without.
          </p>
        )}
        {certifications.map((cert, i) => (
          <CertificationEditor
            key={i}
            cert={cert}
            onChange={(next) =>
              setCertifications((prev) =>
                prev.map((c, j) => (j === i ? next : c)),
              )
            }
            onRemove={() =>
              setCertifications((prev) => prev.filter((_, j) => j !== i))
            }
          />
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Experience *</h2>
          <button
            type="button"
            onClick={addExperience}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            + Add role
          </button>
        </div>
        {experiences.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
            Add at least one role.
          </p>
        )}
        {experiences.map((exp, i) => (
          <ExperienceEditor
            key={i}
            exp={exp}
            onChange={(next) =>
              setExperiences((prev) => prev.map((e, j) => (j === i ? next : e)))
            }
            onRemove={() =>
              setExperiences((prev) => prev.filter((_, j) => j !== i))
            }
          />
        ))}
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSubmit}
          className="w-full rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save profile"}
        </button>
        {!isSaving && missing.length > 0 && (
          <p className="text-xs text-amber-600 text-center">
            Still needed: {missing.join(", ")}.
          </p>
        )}
        <button
          type="button"
          onClick={onSkip}
          className="w-full rounded-full px-6 py-2 text-xs text-slate-500 hover:text-slate-700"
        >
          Start over with the manual form
        </button>
      </div>
    </div>
  );
}
