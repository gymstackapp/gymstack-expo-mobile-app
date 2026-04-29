// mobile/src/api/endpoints.ts
// Typed wrappers for every backend endpoint.
// Mirrors the full web feature set — owner, member, trainer.

import { api, apiRequestFormData } from "./client";
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
    token?: string; // SMS token from invitation
    emailOtp?: string; // OTP sent to email
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
  plans: () => api.get("/api/subscriptions/plans"),
  billingPlans: () => api.get("/api/billing/plans"),
  createOrder: (data: { saasPlanId: string }) =>
    api.post("/api/subscriptions/create-order", data),
  subscribe: (data: {
    saasPlanId: string;
    amount: number;
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    razorpaySignature?: string;
  }) => api.post("/api/subscriptions/subscribe", data),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

export const ownerDashboardApi = {
  get: (params?: {
    gymId?: string;
    range?: string;
    customStart?: string;
    customEnd?: string;
  }) => api.get<any>("/api/owner/dashboard", params),
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
  update: (id: string, data: object) =>
    api.patch(`/api/owner/gyms/${id}`, data),
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
  create: (data: {
    gymId: string;
    fullName: string;
    mobileNumber: string;
    membershipPlanId?: string;
    startDate?: string;
    endDate?: string;
    paymentReceived?: boolean;
    email?: string;
    gender?: string;
    dateOfBirth?: string;
    address?: string;
    goals?: string[];
    avatarUrl?: string;
  }) => api.post("/api/owner/members", data),
  update: (id: string, data: object) =>
    api.patch(`/api/owner/members/${id}`, data),
  renew: (id: string, data: object) =>
    api.post(`/api/owner/members/${id}/renew`, data),
  // Preview bulk add — returns categorised rows, no DB writes
  bulkPreview: (data: {
    gymId: string;
    rows: { name: string; mobile: string }[];
  }) => api.post("/api/owner/members/bulk", data),
  // Commit bulk add — transaction-wrapped DB writes
  bulkConfirm: (data: {
    gymId: string;
    rows: {
      name: string;
      mobile: string;
      startDate?: string;
      endDate?: string;
      membershipPlanId?: string;
      paymentReceived?: boolean;
    }[];
  }) => api.post("/api/owner/members/bulk/confirm", data),
  // upload EXCEL/CSV - returns same preview shape as bulkPreview (Pro+ plan required)
  bulkUploadExcel: (
    gymId: string,
    file: { uri: string; name: string; mimeType: string },
  ) => {
    const fd = new FormData();
    fd.append("gymId", gymId);
    fd.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    } as any);
    return apiRequestFormData("/api/owner/members/upload-excel", fd);
  },
  // Probe whether the plan allows Excel upload (no file needed - server returns upgradeRequired)
  checkExcelFeature: () => {
    const fd = new FormData();
    return apiRequestFormData("/api/owner/members/upload-excel", fd).catch(
      () => ({
        upgradeRequired: true,
      }),
    );
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — TRAINERS
// ─────────────────────────────────────────────────────────────────────────────

export const trainersApi = {
  list: (params?: { gymId?: string }) => api.get("/api/owner/trainers", params),
  get: (id: string) => api.get(`/api/owner/trainers/${id}`),
  // Simplified create — backend handles profile lookup by mobile + SMS/notification
  create: (data: { gymId: string; fullName: string; mobileNumber: string }) =>
    api.post("/api/owner/trainers", data),
  update: (id: string, data: object) =>
    api.patch(`/api/owner/trainers/${id}`, data),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — PLANS
// ─────────────────────────────────────────────────────────────────────────────

export const membershipPlansApi = {
  list: (gymId: string) => api.get("/api/owner/plans", { gymId }),
  create: (data: object) => api.post("/api/owner/plans", data),
  update: (id: string, data: object) =>
    api.patch(`/api/owner/plans/${id}`, data),
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
  update: (id: string, data: object) =>
    api.patch(`/api/owner/supplements/${id}`, data),
  sell: (data: {
    supplementId: string;
    gymId: string;
    qty: number;
    memberId?: string;
    memberName?: string;
    paymentMethod?: string;
    unitPrice?: number;
    notes?: string;
  }) => api.post("/api/owner/supplements/sell", data),
  listSales: (params?: { gymId?: string; range?: string; page?: number }) =>
    api.get("/api/owner/supplements/sell", params),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — WORKOUTS & DIETS
// ─────────────────────────────────────────────────────────────────────────────

export const workoutsApi = {
  list: (params?: { gymId?: string }) => api.get("/api/owner/workouts", params),
  getById: (id: string) => api.get(`/api/owner/workouts/${id}`),
  create: (data: object) => api.post("/api/owner/workouts", data),
  update: (id: string, data: object) =>
    api.patch(`/api/owner/workouts/${id}`, data),
  delete: (id: string) => api.delete(`/api/owner/workouts/${id}`),
};

export const planTemplatesApi = {
  list: (params?: { type?: string }) =>
    api.get("/api/owner/plan-templates", params),
  create: (data: object) => api.post("/api/owner/plan-templates", data),
  incrementUsage: (templateId: string) =>
    api.post("/api/owner/plan-templates/use-count", { templateId }),
};

export const dietsApi = {
  list: (params?: { gymId?: string }) => api.get("/api/owner/diets", params),
  create: (data: object) => api.post("/api/owner/diets", data),
  update: (id: string, data: object) =>
    api.patch(`/api/owner/diets/${id}`, data),
  delete: (id: string) => api.delete(`/api/owner/diets/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const notificationsApi = {
  list: (params?: { gymId?: string; page?: number }) =>
    api.get("/api/owner/notifications", params),
  send: (data: {
    gymId: string;
    title: string;
    body: string;
    targetRole?: string;
    expiresAt?: string;
  }) => api.post("/api/owner/notifications", data),
  delete: (id: string) => api.delete(`/api/owner/notifications?id=${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — REPORTS
// ─────────────────────────────────────────────────────────────────────────────

export const reportsApi = {
  get: (params?: {
    range?: string;
    gymId?: string;
    customStart?: string;
    customEnd?: string;
  }) => api.get<any>("/api/owner/reports", params),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — REFERRAL
// ─────────────────────────────────────────────────────────────────────────────

export const referralApi = {
  get: () => api.get("/api/referral"),
};

// ─────────────────────────────────────────────────────────────────────────────
// MEMBER — DASHBOARD, ATTENDANCE, WORKOUTS, DIET, NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const memberDashboardApi = {
  get: () => api.get("/api/member/dashboard"),
};

export const memberAttendanceApi = {
  list: (params?: { page?: number }) =>
    api.get("/api/member/attendance", params),
  checkIn: () => api.post("/api/member/attendance"),
};

export const memberWorkoutsApi = {
  list: () => api.get("/api/member/workouts"),
};

export const memberDietApi = {
  get: () => api.get("/api/member/diet"),
};

export const memberNotificationsApi = {
  list: (params?: { page?: number }) =>
    api.get("/api/member/notifications", params),
  markRead: (id: string) => api.patch("/api/member/notifications", { id }),
  markAllRead: () =>
    api.patch("/api/member/notifications", { markAllRead: true }),
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

export const memberGymsApi = {
  list: () => api.get("/api/member/gyms"),
};

export const memberSupplementsApi = {
  list: (params?: { search?: string; category?: string }) =>
    api.get("/api/member/supplements", params),
};

export const memberAnnouncementsApi = {
  list: (params?: { page?: number }) =>
    api.get("/api/member/announcements", params),
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
  list: (params?: { search?: string }) =>
    api.get("/api/trainer/members", params),
  get: (id: string) => api.get(`/api/trainer/members/${id}`),
};

export const trainerDietsApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    api.get("/api/trainer/diets", params),
  create: (data: object) => api.post("/api/trainer/diets", data),
  update: (id: string, data: object) =>
    api.patch(`/api/trainer/diets/${id}`, data),
  delete: (id: string) => api.delete(`/api/trainer/diets/${id}`),
  assignToMember: (dietId: string, data: { memberId: string }) =>
    api.post(`/api/trainer/diets/${dietId}/assign`, data),
};

// Trainer body metrics — log measurements for a specific member
export const trainerBodyMetricsApi = {
  list: (memberId: string) =>
    api.get(`/api/trainer/members/${memberId}/body-metrics`),
  create: (
    memberId: string,
    data: {
      date?: string;
      weight?: number;
      bodyFatPercent?: number;
      muscleMass?: number;
      bmi?: number;
      chestCm?: number;
      waistCm?: number;
      hipsCm?: number;
      notes?: string;
    },
  ) => api.post(`/api/trainer/members/${memberId}/body-metrics`, data),
};

export const trainerNotificationsApi = {
  listSent: () => api.get("/api/trainer/notifications"),
  listInbox: (params?: { page?: number }) =>
    api.get("/api/trainer/notifications", { type: "inbox", ...params }),
  send: (data: { title: string; body: string; expiresAt?: string | null }) =>
    api.post("/api/trainer/notifications", data),
  delete: (id: string) => api.delete(`/api/trainer/notifications?id=${id}`),
  markRead: (id: string) =>
    api.patch("/api/trainer/notifications", { notificationId: id }),
  markAllRead: () =>
    api.patch("/api/trainer/notifications", { markAllRead: true }),
  unreadCount: () => api.get("/api/notifications/unread-count"),
};

export const trainerWorkoutsApi = {
  list: () => api.get("/api/trainer/workouts"),
  get: (id: string) => api.get(`/api/trainer/workouts/${id}`),
  create: (data: object) => api.post("/api/trainer/workouts", data),
  update: (id: string, data: object) =>
    api.patch(`/api/trainer/workouts/${id}`, data),
  delete: (id: string) => api.delete(`/api/trainer/workouts/${id}`),
};

export const trainerAttendanceApi = {
  list: (params?: { date?: string; endDate?: string }) =>
    api.get("/api/trainer/attendance", params),
};

export const trainerGymsApi = {
  list: () => api.get("/api/trainer/gyms"),
};

export const trainerDiscoverApi = {
  list: (params?: { search?: string; city?: string }) =>
    api.get("/api/trainer/discover", params),
  getGym: (id: string) => api.get(`/api/trainer/discover/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// GYM REVIEWS  (members and trainers review a gym)
// ─────────────────────────────────────────────────────────────────────────────

export const memberGymReviewsApi = {
  list: (gymId: string, params?: { page?: number }) =>
    api.get(`/api/member/gyms/${gymId}/reviews`, params),
  submit: (gymId: string, data: { rating: number; comment?: string }) =>
    api.post(`/api/member/gyms/${gymId}/reviews`, data),
};

export const trainerGymReviewsApi = {
  list: (gymId: string, params?: { page?: number }) =>
    api.get(`/api/trainer/gyms/${gymId}/reviews`, params),
  submit: (gymId: string, data: { rating: number; comment?: string }) =>
    api.post(`/api/trainer/gyms/${gymId}/reviews`, data),
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
  update: (id: string, data: object) =>
    api.patch(`/api/owner/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/api/owner/expenses/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — LOCKERS
// ─────────────────────────────────────────────────────────────────────────────

export const lockersApi = {
  list: (gymId: string, status?: string) =>
    api.get("/api/owner/lockers", { gymId, status }),
  create: (data: object) => api.post("/api/owner/lockers", data),
  update: (id: string, data: object) =>
    api.patch(`/api/owner/lockers/${id}`, data),
  delete: (id: string) => api.delete(`/api/owner/lockers/${id}`),
  assign: (
    lockerId: string,
    data: {
      memberId: string;
      expiresAt?: string;
      notes?: string;
      feeCollected?: boolean;
    },
  ) => api.post(`/api/owner/lockers/${lockerId}/assign`, data),
  unassign: (lockerId: string) =>
    api.delete(`/api/owner/lockers/${lockerId}/assign`),
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
    api.delete(
      "/api/push/register-device",
      expoPushToken ? ({ expoPushToken } as Record<string, string>) : undefined,
    ),
};
