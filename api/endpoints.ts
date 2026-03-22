// mobile/src/api/endpoints.ts
// Typed wrappers for every backend endpoint.
// Mirrors the full web feature set — owner, member, trainer.

import { api } from "./client";

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
// OWNER — SUBSCRIPTION
// ─────────────────────────────────────────────────────────────────────────────

export const subscriptionApi = {
  get: () => api.get("/api/owner/subscription"),
  plans: () => api.get("/api/billing/plans"),
  subscribe: (data: {
    saasPlanId: string;
    amount: number;
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
  }) => api.post("/api/billing/subscribe", data),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

export const ownerDashboardApi = {
  get: (params?: { gymId?: string; range?: string }) =>
    api.get("/api/owner/dashboard", params),
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
  create: (data: object) => api.post("/api/owner/members", data),
  update: (id: string, data: object) =>
    api.patch(`/api/owner/members/${id}`, data),
  renew: (id: string, data: object) =>
    api.post(`/api/owner/members/${id}/renew`, data),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — TRAINERS
// ─────────────────────────────────────────────────────────────────────────────

export const trainersApi = {
  list: (params?: { gymId?: string }) => api.get("/api/owner/trainers", params),
  get: (id: string) => api.get(`/api/owner/trainers/${id}`),
  create: (data: object) => api.post("/api/owner/trainers", data),
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
  }) => api.post("/api/owner/supplements/sell", data),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — WORKOUTS & DIETS
// ─────────────────────────────────────────────────────────────────────────────

export const workoutsApi = {
  list: (params?: { gymId?: string }) => api.get("/api/owner/workouts", params),
  create: (data: object) => api.post("/api/owner/workouts", data),
  update: (id: string, data: object) =>
    api.patch(`/api/owner/workouts/${id}`, data),
};

export const dietsApi = {
  list: (params?: { gymId?: string }) => api.get("/api/owner/diets", params),
  create: (data: object) => api.post("/api/owner/diets", data),
  update: (id: string, data: object) =>
    api.patch(`/api/owner/diets/${id}`, data),
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const notificationsApi = {
  list: (params?: { gymId?: string }) =>
    api.get("/api/owner/notifications", params),
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
    api.get("/api/owner/reports", params),
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
  markRead: (id: string) => api.patch(`/api/member/notifications`, { id }),
};

export const memberPaymentsApi = {
  list: (params?: { page?: number }) => api.get("/api/member/payments", params),
};

export const memberReferralApi = {
  get: () => api.get("/api/referral"),
};

export const discoverApi = {
  list: (params?: { city?: string; search?: string }) =>
    api.get("/api/member/discover", params),
  getGym: (id: string) => api.get(`/api/member/discover/${id}`),
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

// export const trainerWorkoutsApi = {
//   list: (params?: object) => api.get("/api/trainer/workouts", params),
//   create: (data: object) => api.post("/api/trainer/workouts", data),
//   update: (id: string, data: object) =>
//     api.patch(`/api/trainer/workouts/${id}`, data),
// };

// export const trainerDietsApi = {
//   list: (params?: object) => api.get("/api/trainer/diets", params),
//   create: (data: object) => api.post("/api/trainer/diets", data),
//   update: (id: string, data: object) =>
//     api.patch(`/api/trainer/diets/${id}`, data),
// };

// export const trainerAttendanceApi = {
//   list: (params?: object) => api.get("/api/trainer/attendance", params),
//   mark: (data: object) => api.post("/api/trainer/attendance", data),
// };

export const trainerNotificationsApi = {
  list: (params?: { page?: number }) =>
    api.get("/api/trainer/notifications", params),
};

// ─────────────────────────────────────────────────────────────────────────────
// PUSH NOTIFICATIONS — register device token
// ─────────────────────────────────────────────────────────────────────────────

export const pushApi = {
  registerToken: (fcmToken: string) =>
    api.post("/api/push/register-device", { fcmToken }),
};
