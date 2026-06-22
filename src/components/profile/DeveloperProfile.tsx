"use client";

import { toast } from "sonner";
import { useDeveloperProfile } from "@/hooks/useUser";
import { useOnboarding } from "@/contexts/OnboardingContext";
import {
  useAddCertification,
  useAddExperience,
  useDeleteCertification,
  useDeleteExperience,
  useUpdateCertification,
  useUpdateDeveloperProfile,
  useUpdateExperience,
  useUploadIntroVideo,
  useUploadProfilePhoto,
} from "@/lib/api/hooks/useProfileMutations";
import { asCompletedDeveloper, type AvailabilityStatus } from "@/lib/api/types";

import { AVAILABILITY_STATUS } from "@/lib/constants";
import { DeveloperOnboarding } from "./onboarding/DeveloperOnboarding";
import { AboutForm, AboutFormData } from "./forms/AboutForm";
import { AvailabilityForm } from "./forms/AvailabilityForm";
import { BasicInfoForm, BasicInfoFormData } from "./forms/BasicInfoForm";
import {
  CertificationsForm,
  AddCertificationData,
  UpdateCertificationData,
} from "./forms/CertificationsForm";
import { ExperienceForm, AddExperienceData, UpdateExperienceData } from "./forms/ExperienceForm";
import { IntroVideoForm } from "./forms/IntroVideoForm";
import { ProfilePhotoForm } from "./forms/ProfilePhotoForm";
import { TechStackForm, TechStackFormData } from "./forms/TechStackForm";

export function DeveloperProfile() {
  const profile = useDeveloperProfile();
  const { showComplete: showOnboardingComplete } = useOnboarding();

  const updateProfile = useUpdateDeveloperProfile();
  const addExperienceMutation = useAddExperience();
  const updateExperienceMutation = useUpdateExperience();
  const deleteExperienceMutation = useDeleteExperience();
  const addCertMutation = useAddCertification();
  const updateCertMutation = useUpdateCertification();
  const deleteCertMutation = useDeleteCertification();
  const uploadPhotoMutation = useUploadProfilePhoto();
  const uploadVideoMutation = useUploadIntroVideo();

  const profileLoading = updateProfile.isPending;
  const experiencesLoading =
    addExperienceMutation.isPending ||
    updateExperienceMutation.isPending ||
    deleteExperienceMutation.isPending;
  const certsLoading =
    addCertMutation.isPending ||
    updateCertMutation.isPending ||
    deleteCertMutation.isPending;

  const completed = asCompletedDeveloper(profile);
  if (!completed || showOnboardingComplete) {
    return <DeveloperOnboarding />;
  }

  const fullName = `${completed.firstName} ${completed.lastName}`;

  const handleBasicInfoSubmit = async (data: BasicInfoFormData) => {
    try {
      await updateProfile.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName,
        jobTitle: data.jobTitle,
        location: data.location,
        seniorityLevel: data.seniorityLevel,
      });
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const handleAboutSubmit = async (data: AboutFormData) => {
    try {
      await updateProfile.mutateAsync({ bio: data.bio });
      toast.success("Bio updated");
    } catch {
      toast.error("Failed to update bio");
    }
  };

  const handleTechStackSubmit = async (data: TechStackFormData) => {
    try {
      await updateProfile.mutateAsync({ techStack: data.techStack });
      toast.success("Tech stack updated");
    } catch {
      toast.error("Failed to update tech stack");
    }
  };

  const handleAvailabilitySubmit = async (status: AvailabilityStatus) => {
    try {
      await updateProfile.mutateAsync({ availabilityStatus: status });
      toast.success("Availability updated");
    } catch {
      toast.error("Failed to update availability");
    }
  };

  const handleUploadProfilePhoto = async (file: File) => {
    try {
      await uploadPhotoMutation.mutateAsync(file);
      toast.success("Profile photo uploaded");
    } catch {
      toast.error("Failed to upload profile photo");
    }
  };

  const handleUploadIntroVideo = async (file: File) => {
    try {
      await uploadVideoMutation.mutateAsync(file);
      toast.success("Intro video uploaded");
    } catch {
      toast.error("Failed to upload intro video");
    }
  };

  const handleAddExperience = async (data: AddExperienceData) => {
    try {
      await addExperienceMutation.mutateAsync({
        position: data.position,
        companyName: data.companyName,
        startYear: data.startYear,
        endYear: data.endYear,
        description: data.description,
      });
      toast.success("Experience added");
    } catch {
      toast.error("Failed to add experience");
    }
  };

  const handleUpdateExperience = async (data: UpdateExperienceData) => {
    try {
      await updateExperienceMutation.mutateAsync({
        id: data.id,
        input: {
          position: data.position,
          companyName: data.companyName,
          startYear: data.startYear,
          endYear: data.endYear,
          description: data.description,
        },
      });
      toast.success("Experience updated");
    } catch {
      toast.error("Failed to update experience");
    }
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      await deleteExperienceMutation.mutateAsync(id);
      toast.success("Experience deleted");
    } catch {
      toast.error("Failed to delete experience");
    }
  };

  const handleAddCertification = async (data: AddCertificationData) => {
    try {
      await addCertMutation.mutateAsync({
        name: data.name,
        description: data.description,
      });
      toast.success("Certification added");
    } catch {
      toast.error("Failed to add certification");
    }
  };

  const handleUpdateCertification = async (data: UpdateCertificationData) => {
    try {
      await updateCertMutation.mutateAsync({
        id: data.id,
        input: { name: data.name, description: data.description },
      });
      toast.success("Certification updated");
    } catch {
      toast.error("Failed to update certification");
    }
  };

  const handleDeleteCertification = async (id: string) => {
    try {
      await deleteCertMutation.mutateAsync(id);
      toast.success("Certification deleted");
    } catch {
      toast.error("Failed to delete certification");
    }
  };

  return (
    <>
      <div className="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6">
        <div>
          <h1 className="text-base font-bold text-slate-900">My Profile</h1>
          <p className="text-xs text-slate-400">How you appear in the feed</p>
        </div>

        {completed.availabilityStatus && AVAILABILITY_STATUS[completed.availabilityStatus] && (
          <span className={`flex items-center gap-1.5 px-3 py-1 border rounded-full text-xs font-semibold ${AVAILABILITY_STATUS[completed.availabilityStatus].className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${AVAILABILITY_STATUS[completed.availabilityStatus].dotClassName}`} />
            {AVAILABILITY_STATUS[completed.availabilityStatus].label}
          </span>
        )}
      </div>
      <div className="p-6">
        <div className="max-w-5xl mx-auto flex gap-6">
          <div className="w-80 shrink-0 space-y-4">
            <ProfilePhotoForm
              profilePhoto={completed.profilePhoto || null}
              fullName={fullName}
              jobTitle={completed.jobTitle || ""}
              location={completed.location || ""}
              techStack={completed.techStack}
              onUpload={handleUploadProfilePhoto}
              isLoading={uploadPhotoMutation.isPending}
            />
            <AvailabilityForm
              availabilityStatus={completed.availabilityStatus || "Available"}
              onSubmit={handleAvailabilitySubmit}
              isLoading={profileLoading}
            />
            <IntroVideoForm
              introVideo={completed.introVideo || null}
              onUpload={handleUploadIntroVideo}
              isUploading={uploadVideoMutation.isPending}
            />
          </div>
          <div className="flex-1 space-y-4">
            <BasicInfoForm
              firstName={completed.firstName}
              lastName={completed.lastName}
              jobTitle={completed.jobTitle}
              location={completed.location}
              seniorityLevel={completed.seniorityLevel}
              onSubmit={handleBasicInfoSubmit}
              isLoading={profileLoading}
            />
            <AboutForm
              bio={completed.bio}
              onSubmit={handleAboutSubmit}
              isLoading={profileLoading}
            />
            <TechStackForm
              techStack={completed.techStack}
              onSubmit={handleTechStackSubmit}
              isLoading={profileLoading}
            />
            <ExperienceForm
              experiences={completed.experiences}
              onAdd={handleAddExperience}
              onUpdate={handleUpdateExperience}
              onDelete={handleDeleteExperience}
              isLoading={experiencesLoading}
            />
            <CertificationsForm
              certifications={completed.certifications}
              onAdd={handleAddCertification}
              onUpdate={handleUpdateCertification}
              onDelete={handleDeleteCertification}
              isLoading={certsLoading}
            />
          </div>
        </div>
      </div>
    </>
  );
}
