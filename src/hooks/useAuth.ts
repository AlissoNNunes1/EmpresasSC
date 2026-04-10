"use client";

import { useSession } from "next-auth/react";

export function useAuth() {
  const { data, status } = useSession();

  return {
    user: data?.user ?? null,
    role: data?.user?.role,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
