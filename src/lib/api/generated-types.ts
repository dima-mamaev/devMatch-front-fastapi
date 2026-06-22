/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/** UserStatus */
export type UserStatus = "Active" | "Inactive" | "Suspended";

/** UserRole */
export type UserRole = "Admin" | "Developer" | "Recruiter";

/** SeniorityLevel */
export type SeniorityLevel = "junior" | "mid" | "senior" | "lead" | "principal";

/** OnboardingSessionStatus */
export type OnboardingSessionStatus =
  | "InProgress"
  | "ReadyForReview"
  | "Completed"
  | "Abandoned";

/** MediaType */
export type MediaType = "Image" | "Video";

/** MediaProcessingStatus */
export type MediaProcessingStatus = "Processing" | "Ready" | "Failed";

/** AvailabilityStatus */
export type AvailabilityStatus = "Available" | "OpenToOffers" | "NotAvailable";

/**
 * AnswerSubmitResult
 * Returned from the multipart answer endpoint.
 */
export interface AnswerSubmitResult {
  /** Accepted */
  accepted: boolean;
  /** Retryreason */
  retryReason?: string | null;
  /** Transcript */
  transcript?: string | null;
  /** Nextquestion */
  nextQuestion?: string | null;
  status?: OnboardingSessionStatus | null;
}

/** Body_submit_answer_api_onboarding_me_answer_post */
export interface BodySubmitAnswerApiOnboardingMeAnswerPost {
  /** File */
  file: File | Blob;
}

/** Body_upload_intro_video_api_developers_me_video_post */
export interface BodyUploadIntroVideoApiDevelopersMeVideoPost {
  /** File */
  file: File | Blob;
}

/** Body_upload_profile_photo_api_developers_me_photo_post */
export interface BodyUploadProfilePhotoApiDevelopersMePhotoPost {
  /** File */
  file: File | Blob;
}

/** CertificationCreate */
export interface CertificationCreate {
  /**
   * Name
   * @minLength 1
   * @maxLength 500
   */
  name: string;
  /** Description */
  description?: string | null;
}

/** CertificationOut */
export interface CertificationOut {
  /**
   * Id
   * @format uuid
   */
  id: string;
  /** Name */
  name: string;
  /** Description */
  description?: string | null;
  /**
   * Createdat
   * @format date-time
   */
  createdAt: string;
  /**
   * Updatedat
   * @format date-time
   */
  updatedAt: string;
}

/** CertificationUpdate */
export interface CertificationUpdate {
  /** Name */
  name?: string | null;
  /** Description */
  description?: string | null;
}

/**
 * CompleteRequest
 * Body of the complete endpoint — the dev's edited draft.
 */
export interface CompleteRequest {
  /**
   * Profile draft produced by Claude. Mirrors DeveloperUpdate's optional
   * shape; the developer edits it in the Review step before save.
   */
  draft: DraftProfile;
}

/** DeleteResult */
export interface DeleteResult {
  /** Affected */
  affected: number;
}

/** DeveloperCreate */
export interface DeveloperCreate {
  /**
   * Firstname
   * @minLength 1
   * @maxLength 100
   */
  firstName: string;
  /**
   * Lastname
   * @minLength 1
   * @maxLength 100
   */
  lastName: string;
}

/** DeveloperOut */
export interface DeveloperOut {
  /**
   * Id
   * @format uuid
   */
  id: string;
  /** Email */
  email: string;
  /** Firstname */
  firstName: string;
  /** Lastname */
  lastName: string;
  /** Jobtitle */
  jobTitle?: string | null;
  /** Location */
  location?: string | null;
  seniorityLevel?: SeniorityLevel | null;
  /** Techstack */
  techStack: string[];
  /** Githuburl */
  githubUrl?: string | null;
  /** Linkedinurl */
  linkedinUrl?: string | null;
  /** Personalsiteurl */
  personalSiteUrl?: string | null;
  /** Bio */
  bio?: string | null;
  availabilityStatus?: AvailabilityStatus | null;
  /** Onboardingcompleted */
  onboardingCompleted: boolean;
  profilePhoto?: MediaOut | null;
  introVideo?: MediaOut | null;
  /** Experiences */
  experiences: ExperienceOut[];
  /** Certifications */
  certifications: CertificationOut[];
  /**
   * Createdat
   * @format date-time
   */
  createdAt: string;
  /**
   * Updatedat
   * @format date-time
   */
  updatedAt: string;
}

/** DeveloperUpdate */
export interface DeveloperUpdate {
  /** Firstname */
  firstName?: string | null;
  /** Lastname */
  lastName?: string | null;
  /** Jobtitle */
  jobTitle?: string | null;
  /** Location */
  location?: string | null;
  seniorityLevel?: SeniorityLevel | null;
  /** Techstack */
  techStack?: string[] | null;
  /** Githuburl */
  githubUrl?: string | null;
  /** Linkedinurl */
  linkedinUrl?: string | null;
  /** Personalsiteurl */
  personalSiteUrl?: string | null;
  /** Bio */
  bio?: string | null;
  availabilityStatus?: AvailabilityStatus | null;
  /** Onboardingcompleted */
  onboardingCompleted?: boolean | null;
}

/**
 * DraftCertification
 * Draft cert entry from the interview. Same shape as CertificationCreate
 * but kept distinct so Claude's looser output can validate.
 */
export interface DraftCertification {
  /**
   * Name
   * @minLength 1
   * @maxLength 500
   */
  name: string;
  /** Description */
  description?: string | null;
}

/**
 * DraftExperience
 * Draft experience entry. More permissive than ExperienceCreate — Claude
 * may omit start_year if the dev didn't say a date.
 */
export interface DraftExperience {
  /**
   * Position
   * @minLength 1
   * @maxLength 200
   */
  position: string;
  /**
   * Companyname
   * @minLength 1
   * @maxLength 200
   */
  companyName: string;
  /** Startyear */
  startYear?: number | null;
  /** Endyear */
  endYear?: number | null;
  /** Description */
  description?: string | null;
}

/**
 * DraftProfile
 * Profile draft produced by Claude. Mirrors DeveloperUpdate's optional
 * shape; the developer edits it in the Review step before save.
 */
export interface DraftProfile {
  /** Firstname */
  firstName?: string | null;
  /** Lastname */
  lastName?: string | null;
  /** Jobtitle */
  jobTitle?: string | null;
  /** Location */
  location?: string | null;
  seniorityLevel?: SeniorityLevel | null;
  /** Bio */
  bio?: string | null;
  /** Techstack */
  techStack?: string[];
  /** Experiences */
  experiences?: DraftExperience[];
  /** Certifications */
  certifications?: DraftCertification[];
}

/** ExperienceCreate */
export interface ExperienceCreate {
  /**
   * Position
   * @minLength 1
   * @maxLength 200
   */
  position: string;
  /**
   * Companyname
   * @minLength 1
   * @maxLength 200
   */
  companyName: string;
  /**
   * Startyear
   * @min 1950
   */
  startYear: number;
  /** Endyear */
  endYear?: number | null;
  /** Description */
  description?: string | null;
}

/** ExperienceOut */
export interface ExperienceOut {
  /**
   * Id
   * @format uuid
   */
  id: string;
  /** Position */
  position: string;
  /** Companyname */
  companyName: string;
  /** Startyear */
  startYear?: number | null;
  /** Endyear */
  endYear?: number | null;
  /** Description */
  description?: string | null;
  /**
   * Createdat
   * @format date-time
   */
  createdAt: string;
  /**
   * Updatedat
   * @format date-time
   */
  updatedAt: string;
}

/** ExperienceUpdate */
export interface ExperienceUpdate {
  /** Position */
  position?: string | null;
  /** Companyname */
  companyName?: string | null;
  /** Startyear */
  startYear?: number | null;
  /** Endyear */
  endYear?: number | null;
  /** Description */
  description?: string | null;
}

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/** MediaOut */
export interface MediaOut {
  /**
   * Id
   * @format uuid
   */
  id: string;
  type: MediaType;
  /** Url */
  url: string;
  processingStatus?: MediaProcessingStatus | null;
}

/**
 * OnboardingAnswer
 * Single answered question on the session timeline.
 */
export interface OnboardingAnswer {
  /** Questionindex */
  questionIndex: number;
  /** Question */
  question: string;
  /** Transcript */
  transcript: string;
  /**
   * Recordedat
   * @format date-time
   */
  recordedAt: string;
}

/**
 * OnboardingSessionOut
 * Public view of an in-flight session.
 */
export interface OnboardingSessionOut {
  /**
   * Id
   * @format uuid
   */
  id: string;
  status: OnboardingSessionStatus;
  /** Currentquestionindex */
  currentQuestionIndex: number;
  /** Totalquestions */
  totalQuestions: number;
  /** Currentquestion */
  currentQuestion: string | null;
  /** Answers */
  answers: OnboardingAnswer[];
  extractedDraft: DraftProfile | null;
  /**
   * Createdat
   * @format date-time
   */
  createdAt: string;
  /**
   * Updatedat
   * @format date-time
   */
  updatedAt: string;
}

/** Page[DeveloperOut] */
export interface PageDeveloperOut {
  /** Results */
  results: DeveloperOut[];
  /** Total */
  total: number;
  /** Page */
  page: number;
  /** Limit */
  limit: number;
}

/** RecruiterCreate */
export interface RecruiterCreate {
  /**
   * Firstname
   * @minLength 1
   * @maxLength 100
   */
  firstName: string;
  /**
   * Lastname
   * @minLength 1
   * @maxLength 100
   */
  lastName: string;
}

/** RecruiterOut */
export interface RecruiterOut {
  /**
   * Id
   * @format uuid
   */
  id: string;
  /** Firstname */
  firstName: string;
  /** Lastname */
  lastName: string;
  /** Email */
  email: string;
  /**
   * Createdat
   * @format date-time
   */
  createdAt: string;
  /**
   * Updatedat
   * @format date-time
   */
  updatedAt: string;
}

/** RecruiterUpdate */
export interface RecruiterUpdate {
  /** Firstname */
  firstName?: string | null;
  /** Lastname */
  lastName?: string | null;
}

/** ShortlistCheck */
export interface ShortlistCheck {
  /** Inshortlist */
  inShortlist: boolean;
}

/** ShortlistCount */
export interface ShortlistCount {
  /** Count */
  count: number;
}

/** ShortlistOut */
export interface ShortlistOut {
  /**
   * Id
   * @format uuid
   */
  id: string;
  developer: DeveloperOut;
  /**
   * Createdat
   * @format date-time
   */
  createdAt: string;
}

/** UserOut */
export interface UserOut {
  /**
   * Id
   * @format uuid
   */
  id: string;
  /** Email */
  email: string;
  /** Firstname */
  firstName?: string | null;
  /** Lastname */
  lastName?: string | null;
  role: UserRole;
  status: UserStatus;
  /** Authprovider */
  authProvider?: string | null;
  /**
   * Createdat
   * @format date-time
   */
  createdAt: string;
  /** Lastseenat */
  lastSeenAt?: string | null;
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
  /** Input */
  input?: any;
  /** Context */
  ctx?: object;
}
