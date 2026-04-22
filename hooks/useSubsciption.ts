// mobile/src/hooks/useSubscription.ts
// Mobile-side subscription state — mirrors the web SubscriptionContext.
// Fetches /api/owner/subscription and derives limit checks + feature flags.

import { subscriptionApi } from "@/api/endpoints";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";

export interface MobilePlanLimits {
  maxGyms: number | null;
  maxMembers: number | null;
  maxTrainers: number | null;
  maxMembershipPlans: number | null;
  maxNotificationsPerMonth: number | null;
  hasAttendance: boolean;
  hasWorkoutPlans: boolean;
  hasDietPlans: boolean;
  hasSupplements: boolean;
  hasPayments: boolean;
  hasMemberCrud: boolean;
  hasPlanTemplates: boolean;
  hasReferAndEarn: boolean;
  hasFullReports: boolean;
  hasDashboardAnalytics: boolean;
}

export interface MobileSubscription {
  id: string;
  status: string;
  planName: string;
  planSlug: string;
  limits: MobilePlanLimits;
  currentPeriodEnd: string | null;
  isExpired: boolean;
  isLifetime: boolean;
  isTrial: boolean;
  daysRemaining: number | null;
}

export interface MobileUsage {
  gyms: number;
  members: number;
  trainers: number;
  membershipPlans: number;
  notificationsThisMonth: number;
}

interface SubscriptionState {
  subscription: MobileSubscription | null;
  usage: MobileUsage | null;
  isLoading: boolean;
  isExpired: boolean;
  isLifetime: boolean;
  isTrial: boolean;
  planName: string;
  limits: MobilePlanLimits | null;
  daysRemaining: number | null;
  // Limit checks
  canAddGym: boolean;
  canAddMember: boolean;
  canAddTrainer: boolean;
  canAddPlan: boolean;
  canSendNotification: boolean;
  // Feature flags
  hasAttendance: boolean;
  hasWorkoutPlans: boolean;
  hasDietPlans: boolean;
  hasSupplements: boolean;
  hasPayments: boolean;
  hasMemberCrud: boolean;
  hasPlanTemplates: boolean;
  hasReferAndEarn: boolean;
  hasFullReports: boolean;
  canAddMembershipPlan: boolean;
}

const within = (
  current: number | undefined,
  max: number | null | undefined,
): boolean => {
  if (max === null || max === undefined) return true;
  return (current ?? 0) < max;
};

export function useSubscription(): SubscriptionState {
  const { profile } = useAuthStore();
  const isOwner = profile?.role === "owner";

  const { data, isLoading } = useQuery<{
    subscription: MobileSubscription;
    usage: MobileUsage;
  }>({
    queryKey: ["ownerSubscription"],
    queryFn: subscriptionApi.get as () => Promise<{
      subscription: MobileSubscription;
      usage: MobileUsage;
    }>,
    enabled: isOwner,
    staleTime: 5 * 60 * 1000,
  });

  const sub: MobileSubscription | null = data?.subscription ?? null;
  const usage: MobileUsage | null = data?.usage ?? null;
  const limits = sub?.limits ?? null;

  return {
    subscription: sub,
    usage,
    isLoading: isOwner && isLoading,
    isExpired: sub?.isExpired ?? false,
    isLifetime: sub?.isLifetime ?? false,
    isTrial: sub?.isTrial ?? false,
    planName: sub?.planName ?? "No Plan",
    limits,
    daysRemaining: sub?.daysRemaining ?? null,

    canAddGym: !sub?.isExpired && within(usage?.gyms, limits?.maxGyms),
    canAddMember: !sub?.isExpired && within(usage?.members, limits?.maxMembers),
    canAddTrainer:
      !sub?.isExpired && within(usage?.trainers, limits?.maxTrainers),
    canAddPlan:
      !sub?.isExpired &&
      within(usage?.membershipPlans, limits?.maxMembershipPlans),
    canSendNotification:
      !sub?.isExpired &&
      within(usage?.notificationsThisMonth, limits?.maxNotificationsPerMonth),

    hasAttendance: limits?.hasAttendance ?? false,
    hasWorkoutPlans: limits?.hasWorkoutPlans ?? false,
    hasDietPlans: limits?.hasDietPlans ?? false,
    hasSupplements: limits?.hasSupplements ?? false,
    hasPayments: limits?.hasPayments ?? false,
    hasMemberCrud: limits?.hasMemberCrud ?? false,
    hasPlanTemplates: limits?.hasPlanTemplates ?? false,
    hasReferAndEarn: limits?.hasReferAndEarn ?? false,
    hasFullReports: limits?.hasFullReports ?? false,
    canAddMembershipPlan:
      !sub?.isExpired &&
      within(usage?.membershipPlans, limits?.maxMembershipPlans),
  };
}
