"use client";

import {
  Auth0Provider as BaseAuth0Provider,
  AppState,
} from "@auth0/auth0-react";
import { useRouter } from "next/navigation";

interface Auth0ProviderProps {
  children: React.ReactNode;
}

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Set it in .env.local (dev) or your deployment env (Vercel).`
    );
  }
  return value;
}

export function Auth0Provider({ children }: Auth0ProviderProps) {
  const router = useRouter();

  const domain = requireEnv(
    "NEXT_PUBLIC_AUTH0_DOMAIN",
    process.env.NEXT_PUBLIC_AUTH0_DOMAIN
  );
  const clientId = requireEnv(
    "NEXT_PUBLIC_AUTH0_CLIENT_ID",
    process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID
  );
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || undefined;
  const redirectUri =
    typeof window !== "undefined" ? window.location.origin : "";

  const onRedirectCallback = (appState?: AppState) => {
    router.replace(appState?.returnTo || "/dashboard");
  };

  return (
    <BaseAuth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        ...(audience && { audience }),
        scope: "openid profile email",
      }}
      onRedirectCallback={onRedirectCallback}
      cacheLocation="localstorage"
    >
      {children}
    </BaseAuth0Provider>
  );
}
