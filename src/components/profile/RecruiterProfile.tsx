"use client";

import { useState } from "react";
import { toast } from "sonner";

import { BriefcaseIcon, CheckIcon, MailIcon, PencilIcon, UserIcon, XIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getInitials } from "@/components/ui/ProfileAvatar";
import { useRecruiterProfile } from "@/hooks/useUser";
import { useUpdateRecruiterProfile } from "@/lib/api/hooks/useProfileMutations";

export function RecruiterProfile() {
  const profile = useRecruiterProfile();
  const updateMutation = useUpdateRecruiterProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-slate-500 mb-4">No profile found</p>
          <p className="text-sm text-slate-400">Please complete your profile setup</p>
        </div>
      </div>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const initials = getInitials(profile.firstName, profile.lastName);
  const isSaving = updateMutation.isPending;

  const handleEdit = () => {
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (!trimmedFirst || !trimmedLast) {
      toast.error("First and last name are required");
      return;
    }
    try {
      await updateMutation.mutateAsync({ firstName: trimmedFirst, lastName: trimmedLast });
      toast.success("Profile updated");
      setIsEditing(false);
    } catch (err) {
      toast.error("Failed to update profile", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  return (
    <>
      <div className="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6">
        <div>
          <h1 className="text-base font-bold text-slate-900">My Profile</h1>
          <p className="text-xs text-slate-400">Manage your recruiter profile</p>
        </div>
      </div>
      <div className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-cyan-600 rounded-2xl flex items-center justify-center shrink-0">
                <span className="text-3xl font-bold text-white">{initials}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{fullName}</h2>
                    <p className="text-sm text-slate-500 mt-1">Recruiter</p>
                  </div>
                  {!isEditing && (
                    <Button type="button" variant="link" size="xs" onClick={handleEdit}>
                      <PencilIcon className="w-3.5 h-3.5" />
                      Edit Profile
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <MailIcon className="w-4 h-4 text-slate-400" />
                    {profile.email}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-bold text-slate-900">Basic Info</h2>
              </div>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost-muted" size="xs" onClick={handleCancel} disabled={isSaving}>
                    <XIcon className="w-3.5 h-3.5" />
                    Cancel
                  </Button>
                  <Button type="button" variant="link" size="xs" onClick={handleSave} disabled={isSaving}>
                    <CheckIcon className="w-3.5 h-3.5" />
                    {isSaving ? "Saving…" : "Save"}
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="link" size="xs" onClick={handleEdit}>
                  <PencilIcon className="w-3.5 h-3.5" />
                  Edit
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <Input
                    label="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <Input
                    label="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">First name</p>
                    <p className="text-sm font-medium text-slate-900">{profile.firstName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Last name</p>
                    <p className="text-sm font-medium text-slate-900">{profile.lastName}</p>
                  </div>
                </>
              )}
              <div>
                <p className="text-xs text-slate-400 mb-1">Email</p>
                <p className="text-sm font-medium text-slate-900">{profile.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Member since</p>
                <p className="text-sm font-medium text-slate-900">
                  {new Date(profile.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <BriefcaseIcon className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">0</p>
              <p className="text-xs text-slate-500 mt-1">Active Jobs</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <UserIcon className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">0</p>
              <p className="text-xs text-slate-500 mt-1">Candidates Contacted</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center">
              <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <MailIcon className="w-5 h-5 text-cyan-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">0</p>
              <p className="text-xs text-slate-500 mt-1">Messages Sent</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
