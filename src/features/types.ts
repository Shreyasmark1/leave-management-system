export type Role = "employee" | "admin";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface SessionUser {
  userId: string;
  name: string;
  email: string;
  role: Role;
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string | null;
  joinedAt: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface LeaveTypeRow {
  id: string;
  name: string;
  code: string;
  annualQuotaDays: number;
  isPaid: boolean;
  description: string | null;
  createdAt: string;
}

export interface LeaveRequestRow {
  id: string;
  userId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  userName: string;
  userEmail: string;
  userDepartment: string | null;
  userDeletedAt: string | null;
  leaveTypeName: string;
  leaveTypeCode: string;
}

export interface LeaveBalanceRow {
  leaveTypeId: string;
  leaveTypeName: string;
  code: string;
  isPaid: boolean;
  entitled: number;
  used: number;
  pending: number;
  remaining: number;
}

export interface AdminStats {
  totalEmployees: number;
  totalLeaveTypes: number;
  pendingApprovals: number;
  requestsThisMonth: number;
  statusBreakdown: { status: LeaveStatus; total: number }[];
  recentRequests: LeaveRequestRow[];
}