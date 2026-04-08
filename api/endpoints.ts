// mobile/src/api/endpoints.ts
// Typed wrappers for every backend endpoint.
// Mirrors the full web feature set — owner, member, trainer.

import { api } from "./client";
export { API_BASE } from "./client";

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export const profileApi = {
  me: () => api.get("/api/profile/me"),

  update: (data: {
    fullName?: string;
    mobileNumber?: string;
    city?: string;
    gender?: string;
    dateOfBirth?: string;
    avatarUrl?: string;
  }) => api.patch("/api/profile/update", data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post("/api/profile/change-password", data),
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTH — INVITED PROFILE COMPLETION
// ─────────────────────────────────────────────────────────────────────────────

export const authCompletionApi = {
  // Request OTP to verify by email (alternative to SMS token)
  requestOtp: (data: { email: string }) =>
    api.post("/api/auth/request-completion-otp", data),

  // Complete an INVITED profile — either via SMS token or email OTP
  complete: (data: {
    profileId: string;
    token?: string;      // SMS token from invitation
    emailOtp?: string;   // OTP sent to email
    email: string;
    password: string;
    city?: string;
    gender?: string;
  }) => api.post("/api/auth/complete-profile", data),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — SUBSCRIPTION
// ─────────────────────────────────────────────────────────────────────────────

export const subscriptionApi = {
  get: () => api.get("/api/owner/subscription"),
  // Load available SaaS plan definitions
  plans: () => api.get("/api/subscriptions/plans"),
  // Legacy endpoint (keep for BillingScreen)
  billingPlans: () => api.get("/api/billing/plans"),
  subscribe: (data: {
    saasPlanId: string;
    amount: number;
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
  }) => api.post("/api/subscriptions/subscribe", data),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

export const ownerDashboardApi = {
  get: (params?: { gymId?: string; range?: string }) =>
    api.get<any>("/api/owner/dashboard", params),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — GYMS
// ─────────────────────────────────────────────────────────────────────────────

export const gymsApi = {
  list: () => api.get("/api/owner/gyms"),
  get: (id: string) => api.get(`/api/owner/gyms/${id}`),
  create: (data: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    contactNumber?: string;
    services?: string[];
    facilities?: string[];
    gymImages?: string[];
  }) => api.post("/api/owner/gyms", data),
  update: (id: string, data: object) => api.patch(`/api/owner/gyms/${id}`, data),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — MEMBERS
// ─────────────────────────────────────────────────────────────────────────────

export const membersApi = {
  list: (params?: {
    gymId?: string;
    status?: string;
    search?: string;
    page?: number;
  }) => api.get("/api/owner/members", params),
  get: (id: string) => api.get(`/api/owner/members/${id}`),
  // Simplified create — backend handles check/create profile by mobile, sends SMS if INVITED
  create: (data: {
    gymId: string;
    fullName: string;
    mobileNumber: string;
  }) => api.post("/api/owner/members", data),
  update: (id: string, data: object) => api.patch(`/api/owner/members/${id}`, data),
  renew: (id: string, data: object) => api.post(`/api/owner/members/${id}/renew`, data),
  // Bulk add members — backend handles SMS / in-app notifications per status
  bulkAdd: (data: {
    gymId: string;
    members: { fullName: string; mobileNumber: string }[];
  }) => api.post("/api/owner/members/bulk", data),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — TRAINERS
// ─────────────────────────────────────────────────────────────────────────────

export const trainersApi = {
  list: (params?: { gymId?: string }) => api.get("/api/owner/trainers", params),
  get: (id: string) => api.get(`/api/owner/trainers/${id}`),
  // Simplified create — backend handles profile lookup by mobile + SMS/notification
  create: (data: {
    gymId: string;
    fullName: string;
    mobileNumber: string;
  }) => api.post("/api/owner/trainers", data),
  update: (id: string, data: object) => api.patch(`/api/owner/trainers/${id}`, data),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — PLANS
// ─────────────────────────────────────────────────────────────────────────────

export const membershipPlansApi = {
  list: (gymId: string) => api.get("/api/owner/plans", { gymId }),
  create: (data: object) => api.post("/api/owner/plans", data),
  update: (id: string, data: object) => api.patch(`/api/owner/plans/${id}`, data),
  delete: (id: string) => api.delete(`/api/owner/plans/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const paymentsApi = {
  list: (params?: { gymId?: string; page?: number }) =>
    api.get("/api/owner/payments", params),
  create: (data: object) => api.post("/api/owner/payments", data),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — ATTENDANCE
// ─────────────────────────────────────────────────────────────────────────────

export const ownerAttendanceApi = {
  list: (params?: { gymId?: string; date?: string; search?: string }) =>
    api.get("/api/owner/attendance", params),
  mark: (data: {
    gymId: string;
    memberId: string;
    checkInTime?: string;
    checkOutTime?: string;
  }) => api.post("/api/owner/attendance", data),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — SUPPLEMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const supplementsApi = {
  list: (params?: { gymId?: string; search?: string }) =>
    api.get("/api/owner/supplements", params),
  create: (data: object) => api.post("/api/owner/supplements", data),
  update: (id: string, data: object) => api.patch(`/api/owner/supplements/${id}`, data),
  sell: (data: {
    supplementId: string;
    gymId: string;
    qty: number;
    memberId?: string;
    memberName?: string;
    paymentMethod?: string;
    unitPrice?: number;   // override listed price for this sale
  }) => api.post("/api/owner/supplements/sell", data),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — WORKOUTS & DIETS
// ─────────────────────────────────────────────────────────────────────────────

export const workoutsApi = {
  list: (params?: { gymId?: string }) => api.get("/api/owner/workouts", params),
  create: (data: object) => api.post("/api/owner/workouts", data),
  update: (id: string, data: object) => api.patch(`/api/owner/workouts/${id}`, data),
};

export const dietsApi = {
  list: (params?: { gymId?: string }) => api.get("/api/owner/diets", params),
  create: (data: object) => api.post("/api/owner/diets", data),
  update: (id: string, data: object) => api.patch(`/api/owner/diets/${id}`, data),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const notificationsApi = {
  list: (params?: { gymId?: string }) => api.get("/api/owner/notifications", params),
  send: (data: {
    gymId: string;
    title: string;
    body: string;
    targetRole?: string;
  }) => api.post("/api/owner/notifications", data),
  delete: (id: string) => api.delete(`/api/owner/notifications?id=${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — REPORTS
// ─────────────────────────────────────────────────────────────────────────────

export const reportsApi = {
  get: (params?: { range?: string; gymId?: string }) =>
    api.get<any>("/api/owner/reports", params),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — REFERRAL
// ─────────────────────────────────────────────────────────────────────────────

export const referralApi = {
  get: () => api.get("/api/owner/referral"),
};

// ─────────────────────────────────────────────────────────────────────────────
// MEMBER — DASHBOARD, ATTENDANCE, WORKOUTS, DIET, NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const memberDashboardApi = {
  get: () => api.get("/api/member/dashboard"),
};

export const memberAttendanceApi = {
  list: (params?: { page?: number }) => api.get("/api/member/attendance", params),
  checkIn: () => api.post("/api/member/attendance"),
};

export const memberWorkoutsApi = {
  list: () => api.get("/api/member/workouts"),
};

export const memberDietApi = {
  get: () => api.get("/api/member/diet"),
};

export const memberNotificationsApi = {
  list: (params?: { page?: number }) => api.get("/api/member/notifications", params),
  markRead: (id: string) => api.patch("/api/member/notifications", { id }),
  markAllRead: () => api.patch("/api/member/notifications", { markAllRead: true }),
  unreadCount: () => api.get("/api/notifications/unread-count"),
};

export const memberPaymentsApi = {
  list: async (params?: { page?: number }): Promise<any[]> => {
    const res: any = await api.get("/api/member/payments", params);
    return Array.isArray(res) ? res : (res?.payments ?? []);
  },
};

export const memberReferralApi = {
  get: () => api.get("/api/referral"),
};

export const discoverApi = {
  list: (params?: { city?: string; search?: string }) =>
    api.get("/api/member/discover", params),
  getGym: (id: string) => api.get(`/api/member/discover/${id}`),
};

export const memberSupplementsApi = {
  list: (params?: { search?: string; category?: string }) =>
    api.get("/api/member/supplements", params),
};

export const memberAnnouncementsApi = {
  list: (params?: { page?: number }) => api.get("/api/member/announcements", params),
};

// Member body metrics — read-only view of metrics logged by trainer
export const memberBodyMetricsApi = {
  list: () => api.get("/api/member/body-metrics"),
};

// ─────────────────────────────────────────────────────────────────────────────
// TRAINER
// ─────────────────────────────────────────────────────────────────────────────

export const trainerDashboardApi = {
  get: () => api.get("/api/trainer/dashboard"),
};

export const trainerMembersApi = {
  list: (params?: { search?: string }) => api.get("/api/trainer/members", params),
  get: (id: string) => api.get(`/api/trainer/members/${id}`),
};

export const trainerDietsApi = {
  list: (params?: object) => api.get("/api/trainer/diets", params),
  create: (data: object) => api.post("/api/trainer/diets", data),
  update: (id: string, data: object) => api.patch(`/api/trainer/diets/${id}`, data),
  delete: (id: string) => api.delete(`/api/trainer/diets/${id}`),
  assignToMember: (dietId: string, data: { memberId: string }) =>
    api.post(`/api/trainer/diets/${dietId}/assign`, data),
};

// Trainer body metrics — log measurements for a specific member
export const trainerBodyMetricsApi = {
  list: (memberId: string) =>
    api.get(`/api/trainer/members/${memberId}/body-metrics`),
  create: (memberId: string, data: {
    date?: string;
    weight?: number;
    bodyFatPercent?: number;
    muscleMass?: number;
    bmi?: number;
    chestCm?: number;
    waistCm?: number;
    hipsCm?: number;
    notes?: string;
  }) => api.post(`/api/trainer/members/${memberId}/body-metrics`, data),
};

export const trainerNotificationsApi = {
  list: (params?: { page?: number }) => api.get("/api/trainer/notifications", params),
  markRead: (id: string) =>
    api.patch("/api/trainer/notifications", { notificationId: id }),
  markAllRead: () => api.patch("/api/trainer/notifications", { markAllRead: true }),
  unreadCount: () => api.get("/api/notifications/unread-count"),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — EXPENSES
// ─────────────────────────────────────────────────────────────────────────────

export const expensesApi = {
  list: (params?: {
    gymId?: string;
    range?: string;
    category?: string;
    page?: number;
  }) => api.get("/api/owner/expenses", params),
  create: (data: {
    gymId: string;
    title: string;
    amount: string | number;
    category?: string;
    description?: string;
    expenseDate: string;
    receiptUrl?: string;
  }) => api.post("/api/owner/expenses", data),
  update: (id: string, data: object) => api.patch(`/api/owner/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/api/owner/expenses/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — LOCKERS
// ─────────────────────────────────────────────────────────────────────────────

export const lockersApi = {
  list: (gymId: string, status?: string) =>
    api.get("/api/owner/lockers", { gymId, status }),
  create: (data: object) => api.post("/api/owner/lockers", data),
  update: (id: string, data: object) => api.patch(`/api/owner/lockers/${id}`, data),
  delete: (id: string) => api.delete(`/api/owner/lockers/${id}`),
  assign: (
    lockerId: string,
    data: { memberId: string; expiresAt?: string; notes?: string; feeCollected?: boolean },
  ) => api.post(`/api/owner/lockers/${lockerId}/assign`, data),
  unassign: (lockerId: string) => api.delete(`/api/owner/lockers/${lockerId}/assign`),
  updateAssignment: (
    lockerId: string,
    data: { expiresAt?: string; notes?: string; feeCollected?: boolean },
  ) => api.patch(`/api/owner/lockers/${lockerId}/assign`, data),
};

// ─────────────────────────────────────────────────────────────────────────────
// PUSH NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const pushApi = {
  registerToken: (expoPushToken: string) =>
    api.post("/api/push/register-device", { expoPushToken }),
  unregisterToken: (expoPushToken?: string) =>
    api.delete("/api/push/register-device", expoPushToken ? ({ expoPushToken } as Record<string, string>) : undefined),
};
