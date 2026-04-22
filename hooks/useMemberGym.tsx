// Fetches /api/member/has-gym once at the navigator level and shares the result
// via context so every gated screen can read it without a separate API call.

import { api } from "@/api/client";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import React, { JSX, createContext, useContext } from "react";

interface MemberGymContextValue {
  hasGym: boolean;
  gymLoading: boolean;
}

const MemberGymContext = createContext<MemberGymContextValue>({
  hasGym: false,
  gymLoading: true,
});

export function MemberGymProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const { profile } = useAuthStore();
  const isMember = profile?.role === "member";

  const { data, isLoading } = useQuery<{ hasGym: boolean }>({
    queryKey: ["memberHasGym"],
    queryFn: () => api.get("/api/member/has-gym") as Promise<{ hasGym: boolean }>,
    enabled: isMember,
    staleTime: 5 * 60_000,
  });

  return (
    <MemberGymContext.Provider
      value={{
        hasGym: data?.hasGym ?? false,
        gymLoading: isMember ? isLoading : false
      }}
    >
      {children}
    </MemberGymContext.Provider>
  );
}

export function useMemberGym(): MemberGymContextValue {
  return useContext(MemberGymContext);
}
