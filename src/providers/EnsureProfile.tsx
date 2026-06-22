"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useMe } from "@/lib/api/hooks/useMe";

/**
 * Redirects authenticated users without a DB row to the mandatory /welcome
 * role picker. The picker itself owns the profile-creation mutation, so this
 * provider stays small.
 */
export function EnsureProfile({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const me = useMe();

  useEffect(() => {
    if (!me.needsSignupCompletion) return;
    if (pathname === "/welcome") return;
    router.replace("/welcome");
  }, [me.needsSignupCompletion, pathname, router]);

  return <>{children}</>;
}
