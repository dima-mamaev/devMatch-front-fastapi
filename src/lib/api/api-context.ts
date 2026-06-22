"use client";

import { createContext } from "react";

import type { ApiContextType } from "./types";

export const ApiContext = createContext<ApiContextType>({
  mutationFn: () => Promise.resolve(undefined),
  onError: () => false,
});
