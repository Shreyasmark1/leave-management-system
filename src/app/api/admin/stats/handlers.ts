import "server-only";

import { and, count, eq, gte, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { leaveRequests, leaveStatusEnum, leaveTypes, users } from "@/db/schema";
import { listLeaveRequests } from "../../leave-requests/handlers";

export const getAdminStats = async () => {
  const db = getDb();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [employeeCount, leaveTypeCount, pendingCount, monthCount, breakdownRows, recent] =
    await Promise.all([
      db
        .select({ total: count() })
        .from(users)
        .where(and(eq(users.role, "employee"), isNull(users.deletedAt)))
        .then((rows) => rows[0]?.total ?? 0),
      db
        .select({ total: count() })
        .from(leaveTypes)
        .where(isNull(leaveTypes.deletedAt))
        .then((rows) => rows[0]?.total ?? 0),
      db
        .select({ total: count() })
        .from(leaveRequests)
        .where(and(eq(leaveRequests.status, "pending"), isNull(leaveRequests.deletedAt)))
        .then((rows) => rows[0]?.total ?? 0),
      db
        .select({ total: count() })
        .from(leaveRequests)
        .where(and(gte(leaveRequests.createdAt, monthStart), isNull(leaveRequests.deletedAt)))
        .then((rows) => rows[0]?.total ?? 0),
      db
        .select({ status: leaveRequests.status, total: count() })
        .from(leaveRequests)
        .where(isNull(leaveRequests.deletedAt))
        .groupBy(leaveRequests.status),
      listLeaveRequests(),
    ]);

  const statusBreakdown = leaveStatusEnum.enumValues.map((status) => ({
    status,
    total: breakdownRows.find((row) => row.status === status)?.total ?? 0,
  }));

  return {
    totalEmployees: employeeCount,
    totalLeaveTypes: leaveTypeCount,
    pendingApprovals: pendingCount,
    requestsThisMonth: monthCount,
    statusBreakdown,
    recentRequests: recent.slice(0, 10),
  };
};
