// hooks/useRole.ts
// Single source of truth for the current user's role and status.
// Always reads from authStore — never from navigation params or local state.

import { useAuthStore } from "@/store/authStore";

export type UserRole = "owner" | "trainer" | "member" | null;

export interface RoleState {
  role: UserRole;
  isOwner: boolean;
  isTrainer: boolean;
  isMember: boolean;
  isInvited: boolean;
}

export function useRole(): RoleState {
  const profile = useAuthStore((s) => s.profile);
  const role = (profile?.role ?? null) as UserRole;

  return {
    role,
    isOwner: role === "owner",
    isTrainer: role === "trainer",
    isMember: role === "member",
    isInvited: profile?.status === "INVITED",
  };
}
