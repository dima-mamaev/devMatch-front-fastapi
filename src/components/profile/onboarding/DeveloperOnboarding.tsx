"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DeveloperOnboardingIntro } from "./DeveloperOnboardingIntro";
import { OnboardingStepPhoto } from "./OnboardingStepPhoto";
import { OnboardingStepRole } from "./OnboardingStepRole";
import { OnboardingStepExperience } from "./OnboardingStepExperience";
import { OnboardingStepTechStack } from "./OnboardingStepTechStack";
import { OnboardingStepLinks } from "./OnboardingStepLinks";
import { OnboardingStepVideo } from "./OnboardingStepVideo";
import { OnboardingStepComplete } from "./OnboardingStepComplete";
import { InterviewFlow } from "./interview/InterviewFlow";
import {
  useUpdateDeveloperProfile,
  useUploadIntroVideo,
  useUploadProfilePhoto,
} from "@/lib/api/hooks/useProfileMutations";
import type { SeniorityLevel } from "@/lib/api/types";
import { useDeveloperProfile } from "@/hooks/useUser";
import {
  type OnboardingStep,
  useOnboardingStateMachine,
} from "./useOnboardingStateMachine";

export type { OnboardingStep };

export interface OnboardingData {
  firstName: string;
  lastName: string;
  photo: File | null;
  photoPreview: string | null;
  jobTitle: string;
  location: string;
  seniorityLevel: SeniorityLevel | null;
  techStack: string[];
  bio: string;
  githubUrl: string;
  linkedinUrl: string;
  personalSiteUrl: string;
  introVideo: File | null;
  videoPreview: string | null;
}

export function DeveloperOnboarding() {
  const router = useRouter();
  const currentProfile = useDeveloperProfile();
  const machine = useOnboardingStateMachine();
  // Kept for parity with the original step decision in the photo handler.
  // Always false today — the AI-filled-followups check below carries the load.
  const interviewCompleted = false;
  const [data, setData] = useState<OnboardingData>({
    firstName: currentProfile?.firstName || "",
    lastName: currentProfile?.lastName || "",
    photo: null,
    photoPreview: currentProfile?.profilePhoto?.url || null,
    jobTitle: currentProfile?.jobTitle || "",
    location: currentProfile?.location || "",
    seniorityLevel: currentProfile?.seniorityLevel || null,
    techStack: currentProfile?.techStack || [],
    bio: currentProfile?.bio || "",
    githubUrl: currentProfile?.githubUrl || "",
    linkedinUrl: currentProfile?.linkedinUrl || "",
    personalSiteUrl: currentProfile?.personalSiteUrl || "",
    introVideo: null,
    videoPreview: currentProfile?.introVideo?.url || null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateDeveloperProfileMutation = useUpdateDeveloperProfile();
  const uploadProfilePhotoMutation = useUploadProfilePhoto();
  const uploadIntroVideoMutation = useUploadIntroVideo();

  // Mirror the live profile into the manual-flow form's `data` so a step that
  // doesn't re-fetch (e.g. user navigates back) still shows the latest values.
  // Step-decision and settle logic live in useOnboardingStateMachine.
  useEffect(() => {
    if (!currentProfile) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData((prev) => ({
      ...prev,
      firstName: currentProfile.firstName || prev.firstName,
      lastName: currentProfile.lastName || prev.lastName,
      photoPreview: currentProfile.profilePhoto?.url || prev.photoPreview,
      jobTitle: currentProfile.jobTitle || prev.jobTitle,
      location: currentProfile.location || prev.location,
      seniorityLevel: currentProfile.seniorityLevel || prev.seniorityLevel,
      techStack:
        currentProfile.techStack.length > 0
          ? currentProfile.techStack
          : prev.techStack,
      bio: currentProfile.bio || prev.bio,
      githubUrl: currentProfile.githubUrl || prev.githubUrl,
      linkedinUrl: currentProfile.linkedinUrl || prev.linkedinUrl,
      personalSiteUrl: currentProfile.personalSiteUrl || prev.personalSiteUrl,
      videoPreview: currentProfile.introVideo?.url || prev.videoPreview,
    }));
  }, [currentProfile]);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const handleIntroStart = () => {
    machine.goTo("photo-name");
  };

  const handleTryInterview = () => {
    // Safe to call from the manual intro because the dev hasn't filled any
    // fields yet — interview-complete would otherwise replace their experience
    // rows.
    machine.enterInterview();
  };

  const handlePhotoComplete = async (stepData: {
    firstName: string;
    lastName: string;
    photo: File | null;
    photoPreview: string | null;
  }) => {
    try {
      setIsSubmitting(true);
      await updateDeveloperProfileMutation.mutateAsync({
            firstName: stepData.firstName,
            lastName: stepData.lastName,
          });
      let newPhotoUrl: string | undefined;
      if (stepData.photo) {
        const photoData = await uploadProfilePhotoMutation.mutateAsync(stepData.photo);
        newPhotoUrl = photoData?.profilePhoto?.url;
      }
      updateData({
        firstName: stepData.firstName,
        lastName: stepData.lastName,
        photo: null,
        photoPreview: newPhotoUrl || stepData.photoPreview,
      });
      // Skip role/exp/tech/links if the AI-filled fields are already populated
      // on the profile — covers both same-session interview completion AND
      // refresh-then-resume after closing the tab. Don't trust `interviewCompleted`
      // alone, since that boolean is lost on reload.
      const aiFilledFollowups =
        !!currentProfile?.jobTitle &&
        !!currentProfile?.bio &&
        (currentProfile?.techStack.length ?? 0) > 0 &&
        (currentProfile?.experiences.length ?? 0) > 0;
      machine.goTo(
        interviewCompleted || aiFilledFollowups ? "intro-video" : "role-location",
      );
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoBack = (stepData: {
    firstName: string;
    lastName: string;
    photo: File | null;
    photoPreview: string | null;
  }) => {
    updateData({
      firstName: stepData.firstName,
      lastName: stepData.lastName,
      photo: stepData.photo,
      photoPreview: stepData.photoPreview,
    });
    machine.goTo("intro");
  };

  const handleRoleComplete = async (stepData: { jobTitle: string; location: string }) => {
    try {
      setIsSubmitting(true);
      await updateDeveloperProfileMutation.mutateAsync({
            jobTitle: stepData.jobTitle,
            location: stepData.location,
          });
      updateData({
        jobTitle: stepData.jobTitle,
        location: stepData.location,
      });
      machine.goTo("experience");
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleBack = (stepData: { jobTitle: string; location: string }) => {
    updateData({
      jobTitle: stepData.jobTitle,
      location: stepData.location,
    });
    machine.goTo("photo-name");
  };

  const handleExperienceComplete = async (stepData: { seniorityLevel: SeniorityLevel }) => {
    try {
      setIsSubmitting(true);
      await updateDeveloperProfileMutation.mutateAsync({
            seniorityLevel: stepData.seniorityLevel,
          });
      updateData({
        seniorityLevel: stepData.seniorityLevel,
      });
      machine.goTo("tech-stack");
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExperienceBack = (stepData: { seniorityLevel: SeniorityLevel | null }) => {
    updateData({
      seniorityLevel: stepData.seniorityLevel,
    });
    machine.goTo("role-location");
  };

  const handleTechStackComplete = async (stepData: { techStack: string[] }) => {
    try {
      setIsSubmitting(true);
      await updateDeveloperProfileMutation.mutateAsync({
            techStack: stepData.techStack,
          });
      updateData({
        techStack: stepData.techStack,
      });
      machine.goTo("links-bio");
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTechStackBack = (stepData: { techStack: string[] }) => {
    updateData({ techStack: stepData.techStack });
    machine.goTo("experience");
  };

  const handleLinksComplete = async (stepData: {
    githubUrl: string;
    linkedinUrl: string;
    personalSiteUrl: string;
    bio: string;
  }) => {
    try {
      setIsSubmitting(true);
      await updateDeveloperProfileMutation.mutateAsync({
            bio: stepData.bio,
            githubUrl: stepData.githubUrl,
            linkedinUrl: stepData.linkedinUrl,
            personalSiteUrl: stepData.personalSiteUrl || undefined,
          });
      updateData({
        githubUrl: stepData.githubUrl,
        linkedinUrl: stepData.linkedinUrl,
        personalSiteUrl: stepData.personalSiteUrl,
        bio: stepData.bio,
      });
      machine.goTo("intro-video");
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinksBack = (stepData: {
    githubUrl: string;
    linkedinUrl: string;
    personalSiteUrl: string;
    bio: string;
  }) => {
    updateData({
      githubUrl: stepData.githubUrl,
      linkedinUrl: stepData.linkedinUrl,
      personalSiteUrl: stepData.personalSiteUrl,
      bio: stepData.bio,
    });
    machine.goTo("tech-stack");
  };

  const handleVideoComplete = async (stepData: {
    introVideo: File | null;
    videoPreview: string | null;
  }) => {
    try {
      setIsSubmitting(true);
      if (stepData.introVideo) {
        await uploadIntroVideoMutation.mutateAsync(stepData.introVideo);
      }
      updateData({
        introVideo: null,
        videoPreview: stepData.videoPreview,
      });
      machine.markComplete();
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVideoBack = (stepData: {
    introVideo: File | null;
    videoPreview: string | null;
  }) => {
    updateData({
      introVideo: stepData.introVideo,
      videoPreview: stepData.videoPreview,
    });
    machine.goTo("links-bio");
  };

  const handleBrowseFeed = async () => {
    try {
      setIsSubmitting(true);
      await updateDeveloperProfileMutation.mutateAsync({
        onboardingCompleted: true,
      });
      machine.finishInterview();
      router.push("/dashboard");
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  // ReviewDraft has already written everything (text + photo + video) and
  // awaited a fresh developer refetch. Release the wrapper lock — the parent
  // re-renders with onboarding_completed=true and naturally flips to
  // DeveloperProfile (the editor) with fresh cache. User stays on /profile.
  const handleInterviewCompleted = machine.finishInterview;
  // Skip persists in localStorage; refreshing the page won't drop the dev back
  // onto the interview entry screen.
  const handleInterviewSkip = machine.exitInterviewToManual;

  // Until the machine settles (both profile + session queries landed), render
  // a spinner so the manual `intro` doesn't flash for devs on the AI track.
  if (machine.step === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
      </div>
    );
  }

  switch (machine.step) {
    case "interview":
      return (
        <InterviewFlow
          onCompleted={handleInterviewCompleted}
          onSkip={handleInterviewSkip}
        />
      );

    case "intro":
      return (
        <DeveloperOnboardingIntro
          onStart={handleIntroStart}
          onTryInterview={handleTryInterview}
        />
      );

    case "photo-name":
      return (
        <OnboardingStepPhoto
          onBack={handlePhotoBack}
          onContinue={handlePhotoComplete}
          initialData={{
            firstName: data.firstName,
            lastName: data.lastName,
            photo: data.photo,
            photoPreview: data.photoPreview,
          }}
          isSubmitting={isSubmitting}
        />
      );

    case "role-location":
      return (
        <OnboardingStepRole
          onBack={handleRoleBack}
          onContinue={handleRoleComplete}
          initialData={{
            jobTitle: data.jobTitle,
            location: data.location,
          }}
          isSubmitting={isSubmitting}
        />
      );

    case "experience":
      return (
        <OnboardingStepExperience
          onBack={handleExperienceBack}
          onContinue={handleExperienceComplete}
          initialData={{
            seniorityLevel: data.seniorityLevel || undefined,
          }}
          isSubmitting={isSubmitting}
        />
      );

    case "tech-stack":
      return (
        <OnboardingStepTechStack
          onBack={handleTechStackBack}
          onContinue={handleTechStackComplete}
          initialData={{
            techStack: data.techStack,
          }}
          isSubmitting={isSubmitting}
        />
      );

    case "links-bio":
      return (
        <OnboardingStepLinks
          onBack={handleLinksBack}
          onContinue={handleLinksComplete}
          initialData={{
            githubUrl: data.githubUrl,
            linkedinUrl: data.linkedinUrl,
            personalSiteUrl: data.personalSiteUrl,
            bio: data.bio,
          }}
          isSubmitting={isSubmitting}
        />
      );

    case "intro-video":
      return (
        <OnboardingStepVideo
          onBack={handleVideoBack}
          onContinue={handleVideoComplete}
          initialData={{
            introVideo: data.introVideo,
            videoPreview: data.videoPreview,
          }}
          isSubmitting={isSubmitting}
        />
      );

    case "complete":
      return (
        <OnboardingStepComplete
          profileData={{
            firstName: data.firstName,
            lastName: data.lastName,
            jobTitle: data.jobTitle,
            techStack: data.techStack,
            seniorityLevel: data.seniorityLevel,
            photoPreview: data.photoPreview,
          }}
          onBrowseFeed={handleBrowseFeed}
          isSubmitting={isSubmitting}
        />
      );

    default:
      return null;
  }
}
