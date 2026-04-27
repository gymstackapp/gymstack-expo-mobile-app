// mobile/src/types/api.ts
// Single source of truth for every API response shape used across owner screens.
// Import from here instead of declaring local interfaces in each screen.

// ─────────────────────────────────────────────────────────────────────────────
// SHARED
// ─────────────────────────────────────────────────────────────────────────────

export interface ProfileSummary {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  mobileNumber: string | null;
  city: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  role: "owner" | "trainer" | "member" | null;
  wallet: { balance: number } | null;
  referralCode: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// GYMS
// ─────────────────────────────────────────────────────────────────────────────

export interface MembershipPlanSummary {
  id: string;
  name: string;
  price: number;
}

export interface Gym {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  state: string | null;
  pincode: string | null;
  isActive: boolean;
  contactNumber: string | null;
  logoUrl: string | null;
  gymImages: string[];
  services: string[];
  facilities: string[];
  _count: {
    members: number;
    trainers: number;
  };
  membershipPlans: MembershipPlanSummary[];
}

// ─────────────────────────────────────────────────────────────────────────────
// MEMBERSHIP PLANS
// ─────────────────────────────────────────────────────────────────────────────

export interface MembershipPlan {
  id: string;
  gymId: string;
  name: string;
  description: string | null;
  durationMonths: number;
  price: number;
  features: string[];
  maxClasses: number | null;
  isActive: boolean;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MEMBERS
// ─────────────────────────────────────────────────────────────────────────────

export type MemberStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "EXPIRED";

export interface GymMemberListItem {
  id: string;
  status: MemberStatus;
  startDate: string;
  endDate: string | null;
  gymNameSnapshot: string | null;
  currentStreak: number;
  profile: {
    fullName: string;
    email: string;
    mobileNumber: string | null;
    avatarUrl: string | null;
    gender: string | null;
    dateOfBirth: string | null;
    city: string | null;
  };
  membershipPlan: {
    id: string;
    name: string;
    price: number;
  } | null;
  gym: {
    id: string;
    name: string;
  };
}

export interface AttendanceRecord {
  id: string;
  checkInTime: string;
  checkOutTime: string | null;
  method: string;
  gym?: {
    name: string;
  };
}

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  status: string;
  paymentDate: string | null;
  planNameSnapshot: string | null;
  notes: string | null;
}

export interface TrainerSummary {
  id: string;
  profile: { fullName: string; avatarUrl: string | null };
}

export interface GymMemberDetail extends GymMemberListItem {
  heightCm: number | null;
  weightKg: number | null;
  medicalNotes: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  workoutStartTime: string | null;
  workoutEndTime: string | null;
  assignedTrainer: TrainerSummary | null;
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  gymTrainers: TrainerSummary[];
}

export interface MembersListResponse {
  members: GymMemberListItem[];
  total: number;
  pages: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// TRAINERS
// ─────────────────────────────────────────────────────────────────────────────

export interface Trainer {
  id: string;
  gymId: string;
  experienceYears: number;
  specializations: string[];
  certifications: string[];
  bio: string | null;
  rating: number;
  totalReviews: number;
  isAvailable: boolean;
  createdAt: string;
  profile: {
    fullName: string;
    email: string;
    mobileNumber: string | null;
    avatarUrl: string | null;
  };
  gym: {
    name: string;
  };
  _count: {
    assignedMembers: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────────────────────────────────────

export interface OwnerAttendanceRecord {
  id: string;
  checkInTime: string;
  checkOutTime: string | null;
  method: string;
  member: {
    profile: {
      fullName: string;
      avatarUrl: string | null;
    };
  };
  gym: {
    name: string;
  };
}

export interface MemberAttendanceIndividual {
  id: string;
  gymId: string;
  memberId: string;
  checkInTime: string;
  checkOutTime: string | null;
  method: string;
  gym: { name: string };
}

export interface MemberAttendanceRecord {
  checkedInToday: boolean;
  milestones: any[];
  pages: number;
  streak: {
    current: number;
    longest: number;
    total: number;
  };
  records: MemberAttendanceIndividual[];
  thisMonth: number;
  total: number;
}
// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────

export interface OwnerPayment {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  status: string;
  paymentDate: string | null;
  planNameSnapshot: string | null;
  notes: string | null;
  createdAt: string;
  member: {
    profile: {
      fullName: string;
      avatarUrl: string | null;
    };
  };
  gym: {
    name: string;
  };
}

export interface PaymentsListResponse {
  payments: OwnerPayment[];
  total: number;
  pages: number;
  monthTotal: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPPLEMENTS
// ─────────────────────────────────────────────────────────────────────────────

export interface Supplement {
  id: string;
  gymId: string;
  name: string;
  brand: string | null;
  category: string | null;
  unitSize: string | null;
  price: number;
  costPrice: number | null;
  stockQty: number;
  lowStockAt: number;
  isActive: boolean;
  imageUrl: string | null;
  gym: {
    name: string;
  };
  _count: {
    sales: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKOUT & DIET PLANS
// ─────────────────────────────────────────────────────────────────────────────

export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface WorkoutPlan {
  id: string;
  gymId: string;
  title: string | null;
  description: string | null;
  goal: string | null;
  difficulty: Difficulty;
  isGlobal: boolean;
  isTemplate: boolean;
  durationWeeks: number;
  isActive: boolean;
  createdAt: string;
  gym: {
    name: string;
  };
  creator: {
    fullName: string;
  };
  assignedMember: {
    id: string;
    profile: { fullName: string; avatarUrl: string | null };
  } | null;
}

export interface DietPlan {
  id: string;
  gymId: string;
  title: string | null;
  description: string | null;
  goal: string | null;
  caloriesTarget: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  isGlobal: boolean;
  isTemplate: boolean;
  durationWeeks: number;
  isActive: boolean;
  createdAt: string;
  gym: {
    name: string;
  };
  creator: {
    fullName: string;
  };
  assignedMember: {
    id: string;
    profile: { fullName: string; avatarUrl: string | null };
  } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS / ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────────────────────────

export interface Announcement {
  id: string;
  gymId: string;
  title: string;
  body: string;
  targetRole: string | null;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  recipientCount?: number;
  author: {
    fullName: string;
  };
  gym: {
    name: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────────────────────────────────────

export interface RevenueDataPoint {
  month: string;
  revenue: number;
  membershipRev: number;
  supplementRev: number;
}

export interface MemberGrowthDataPoint {
  month: string;
  members: number;
}

export interface GymReport {
  name: string;
  members: number;
  newMembers: number;
  revenue: number;
  membershipRev: number;
  supplementRev: number;
  attendance: number;
}

export interface ReportSummary {
  totalMembers: number;
  newMembers: number;
  totalRevenue: number;
  membershipRevenue: number;
  supplementRevenue: number;
  totalAttendance: number;
}

export interface ReportsResponse {
  revenue: RevenueDataPoint[];
  memberGrowth: MemberGrowthDataPoint[];
  topGyms: GymReport[];
  summary: ReportSummary;
  range: string;
  dateRange?: { start: string; end: string };
  error?: string;
  upgradeRequired?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// REFERRAL
// ─────────────────────────────────────────────────────────────────────────────

export interface ReferralItem {
  id: string;
  status: "PENDING" | "CONVERTED" | "EXPIRED";
  rewardAmount: number | null;
  createdAt: string;
  referred: {
    fullName: string;
    email: string;
  };
}

export interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export interface ReferralResponse {
  referralCode: string | null;
  referrals: ReferralItem[];
  walletTransactions: WalletTransaction[];
  stats: {
    total: number;
    converted: number;
    pending: number;
    totalEarned: number;
  };
  usableBalance: number;
  alreadyUsingNotices: { name: string; email: string }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// BILLING / SUBSCRIPTION
// ─────────────────────────────────────────────────────────────────────────────

export interface SaasPlan {
  id: string;
  name: string;
  description: string | null;
  interval: string;
  price: number;
  sortOrder: number;
  maxGyms: number | null;
  maxMembers: number | null;
  maxTrainers: number | null;
  maxMembershipPlans: number | null;
  maxNotificationsPerMonth: number | null;
  attendanceTracking: boolean;
  workoutPlans: boolean;
  dietPlans: boolean;
  supplementManagement: boolean;
  reportsAnalytics: boolean;
  onlinePayments: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardCheckin {
  id: string;
  checkInTime: string;
  checkOutTime: string | null;
  member: {
    profile: {
      fullName: string;
      avatarUrl: string | null;
    };
  };
}

export interface DashboardRecentMember {
  id: string;
  createdAt: string;
  status: MemberStatus;
  profile: {
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  gym: {
    name: string;
  };
}

export interface DashboardResponse {
  gyms: Gym[];
  totalMembers: number;
  activeGyms: number;
  range: string;
  rangeStart: string;
  rangeEnd: string;
  rangeRevenue: number;
  rangeSupplementRevenue: number;
  totalRevenue: number;
  rangeAttendance: number;
  rangeNewMembers: number;
  todayRevenue: number;
  todayAttendance: number;
  todayNewMembers: number;
  expiringMembers: number;
  expiringMembers3: number;
  expiringToday: string[];
  recentMembers: DashboardRecentMember[];
  todayCheckins: DashboardCheckin[];
  recentSupplementSales: any[];
  dailyRevenue: { date: string; revenue: number }[];
  filteredGymId: string | null;
}

export interface GymReview {
  id: string;
  gymId: string;
  profileId: string;
  role: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  profile: {
    fullName: string;
    avatarUrl: string | null;
  };
}

export interface GymReviewsResponse {
  reviews: GymReview[];
  total: number;
  pages: number;
  myReview: GymReview | null;
}

export interface DiscoverGym {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  state: string | null;
  services: string[];
  facilities: string[];
  gymImages: string[];
  isEnrolled: boolean;
  isActive: boolean;
  contactNumber: string | null;
  averageRating: number;
  totalReviews: number;
  recentReviews: GymReview[];
  myReview: GymReview | null;
  owner: {
    fullName: string;
    avatarUrl: string | null;
    mobileNumber: string | null;
  };
  membershipPlans: {
    id: string;
    name: string;
    price: number;
    durationMonths: number;
  }[];
  _count: { members: number };
}
