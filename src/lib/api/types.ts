import type { MutationFunction } from "@tanstack/react-query";

import type {
  AnswerSubmitResult,
  AvailabilityStatus as GenAvailabilityStatus,
  CertificationCreate,
  CertificationOut,
  CertificationUpdate,
  CompleteRequest,
  DeveloperCreate,
  DeveloperOut,
  DeveloperUpdate,
  DraftCertification,
  DraftExperience,
  DraftProfile,
  ExperienceCreate,
  ExperienceOut,
  ExperienceUpdate,
  MediaOut,
  MediaProcessingStatus as GenMediaProcessingStatus,
  MediaType as GenMediaType,
  OnboardingAnswer,
  OnboardingSessionOut,
  OnboardingSessionStatus as GenOnboardingSessionStatus,
  PageDeveloperOut,
  RecruiterCreate,
  RecruiterOut,
  RecruiterUpdate,
  SeniorityLevel as GenSeniorityLevel,
  ShortlistCheck,
  ShortlistCount,
  ShortlistOut,
  UserOut,
  UserRole as GenUserRole,
  UserStatus as GenUserStatus,
} from "./generated-types";

export type User = UserOut;
export type Developer = DeveloperOut;
export type Recruiter = RecruiterOut;
export type Experience = ExperienceOut;
export type Media = MediaOut;
export type Certification = CertificationOut;
export type Shortlist = ShortlistOut;
export type DeveloperPage = PageDeveloperOut;
export type { ShortlistCheck, ShortlistCount };

export type CreateDeveloper = DeveloperCreate;
export type UpdateDeveloper = DeveloperUpdate;
export type CreateRecruiter = RecruiterCreate;
export type UpdateRecruiter = RecruiterUpdate;
export type CreateExperience = ExperienceCreate;
export type UpdateExperience = ExperienceUpdate;
export type CreateCertification = CertificationCreate;
export type UpdateCertification = CertificationUpdate;

export type SeniorityLevel = GenSeniorityLevel;
export type AvailabilityStatus = GenAvailabilityStatus;
export type UserRole = GenUserRole;
export type UserStatus = GenUserStatus;
export type MediaType = GenMediaType;
export type MediaProcessingStatus = GenMediaProcessingStatus;

export type OnboardingSessionStatus = GenOnboardingSessionStatus;
export type OnboardingSession = OnboardingSessionOut;
export type {
  AnswerSubmitResult,
  CompleteRequest,
  DraftCertification,
  DraftExperience,
  DraftProfile,
  OnboardingAnswer,
};

export type UserProfile = Developer | Recruiter | null;

/**
 * Developer narrowed to the post-onboarding shape: scalar fields the
 * `complete` flow promises to populate are non-null. The Pydantic schema
 * keeps them optional because a partial developer is legal pre-completion,
 * so without this guard the editor has to litter `!` over every read.
 */
export type CompletedDeveloper = Omit<
  Developer,
  "jobTitle" | "location" | "seniorityLevel" | "bio"
> & {
  jobTitle: string;
  location: string;
  seniorityLevel: SeniorityLevel;
  bio: string;
};

export function asCompletedDeveloper(
  dev: Developer | null | undefined
): CompletedDeveloper | null {
  if (!dev || !dev.onboardingCompleted) return null;
  if (!dev.jobTitle || !dev.location || !dev.seniorityLevel || !dev.bio) {
    return null;
  }
  return dev as CompletedDeveloper;
}

export type MutationVariables = {
  path: string;
  method?: "POST" | "PATCH" | "PUT" | "DELETE";
  headers?: HeadersInit;
  body?: BodyInit | null;
};

export type ApiContextType<T = unknown> = {
  mutationFn: MutationFunction<T, MutationVariables>;
  onError: (error: Error) => boolean;
};
