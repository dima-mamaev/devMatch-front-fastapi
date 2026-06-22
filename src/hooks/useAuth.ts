"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useCallback } from "react";

import { clearAllLocalStorage } from "@/lib/utils/localStorage";

export function useAuth() {
  const {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout: auth0Logout,
  } = useAuth0();

  const signUp = useCallback(
    async (options?: {
      connection?: "google-oauth2" | "Username-Password-Authentication";
      email?: string;
    }) => {
      await loginWithRedirect({
        authorizationParams: {
          screen_hint: "signup",
          connection: options?.connection,
          login_hint: options?.email,
        },
        appState: { returnTo: "/dashboard" },
      });
    },
    [loginWithRedirect],
  );

  const signIn = useCallback(
    async (options?: { connection?: "google-oauth2" }) => {
      await loginWithRedirect({
        authorizationParams: { connection: options?.connection },
        appState: { returnTo: "/dashboard" },
      });
    },
    [loginWithRedirect],
  );

  const signInWithGoogle = useCallback(
    async () => signIn({ connection: "google-oauth2" }),
    [signIn],
  );

  const signUpWithGoogle = useCallback(
    async () => signUp({ connection: "google-oauth2" }),
    [signUp],
  );

  const logout = useCallback(() => {
    clearAllLocalStorage();
    auth0Logout({
      logoutParams: {
        returnTo: typeof window !== "undefined" ? window.location.origin : "",
      },
    });
  }, [auth0Logout]);

  return {
    isAuthenticated,
    isLoading,
    user,
    signUp,
    signIn,
    signInWithGoogle,
    signUpWithGoogle,
    logout,
  };
}
