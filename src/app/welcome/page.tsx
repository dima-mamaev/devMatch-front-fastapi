"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ArrowRightIcon } from "@/components/icons";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { RoleCard } from "@/components/ui/RoleCard";
import { useAuth } from "@/hooks/useAuth";
import {
  useCreateDeveloperProfile,
  useCreateRecruiterProfile,
} from "@/lib/api/hooks/useProfileMutations";
import type { UserRole } from "@/lib/api/types";

type PickableRole = Extract<UserRole, "Developer" | "Recruiter">;

function splitName(name: string | undefined): { firstName: string; lastName: string } {
  if (!name) return { firstName: "", lastName: "" };
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

export default function WelcomePage() {
  const router = useRouter();
  const { user: auth0User } = useAuth0();
  const { logout } = useAuth();

  const [selectedRole, setSelectedRole] = useState<PickableRole | null>(null);

  const createDev = useCreateDeveloperProfile();
  const createRec = useCreateRecruiterProfile();

  const fallbackNames = splitName(auth0User?.name);
  const firstName = auth0User?.given_name ?? fallbackNames.firstName;
  const lastName = auth0User?.family_name ?? fallbackNames.lastName;

  const isSubmitting = createDev.isPending || createRec.isPending;
  const error = createDev.error || createRec.error;

  const handleSubmit = async () => {
    if (!selectedRole || isSubmitting) return;

    const mutation = selectedRole === "Developer" ? createDev : createRec;
    try {
      await mutation.mutateAsync({ firstName, lastName });
      router.replace(selectedRole === "Developer" ? "/dashboard/profile" : "/dashboard");
    } catch {
      /* error is reflected via createDev/Rec.error below */
    }
  };

  return (
    <AuthLayout>
      <header className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Welcome to DevMatch</h1>
        <p className="text-sm text-gray-500">
          Tell us who you are so we can set up your account
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <RoleCard
          role="Developer"
          selected={selectedRole === "Developer"}
          onSelect={() => setSelectedRole("Developer")}
        />
        <RoleCard
          role="Recruiter"
          selected={selectedRole === "Recruiter"}
          onSelect={() => setSelectedRole("Recruiter")}
        />
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          Couldn&apos;t finish setting up your account: {error.message}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!selectedRole || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Setting up your account…" : "Continue"}
        {!isSubmitting && <ArrowRightIcon className="w-4 h-4" />}
      </Button>

      <button
        onClick={logout}
        className="block mx-auto mt-6 text-xs text-gray-400 hover:text-gray-600"
      >
        Sign out
      </button>
    </AuthLayout>
  );
}
