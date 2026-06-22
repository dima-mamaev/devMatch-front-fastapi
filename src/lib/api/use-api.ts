"use client";

import { useContext } from "react";

import { ApiContext } from "./api-context";

export const useApi = () => useContext(ApiContext);
