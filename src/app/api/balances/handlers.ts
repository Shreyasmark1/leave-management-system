import "server-only";

import { and, eq, gte, isNull, lt } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { getDb } from "@/db";
import { leaveRequests, leaveTypes } from "@/db/schema";
import type { SessionPayload } from "@/lib/auth/session";
import { fail, ok } from "@/lib/errors";
import { getUser } from "../users/handlers";

const active = isNull(leaveRequests.deletedAt);

const getLeaveBalances = async (
  userId: string,
  year = new Date().getFullYear()
) => {
  const [typeRows, requestRows] = await Promise.all([
    getDb()
      .select()
      .from(leaveTypes)
      .where(isNull(leaveTypes.deletedAt))
      .orderBy(leaveTypes.name),
    getDb()
      .select({
        leaveTypeId: leaveRequests.leaveTypeId,
        status: leaveRequests.status,
        totalDays: leaveRequests.totalDays,
      })
      .from(leaveRequests)
      .where(
        and(
          eq(leaveRequests.userId, userId),
          active,
          gte(leaveRequests.startDate, `${year}-01-01`),
          lt(leaveRequests.startDate, `${year + 1}-01-01`)
        )
      ),
  ]);

  const rowsByType = new Map(
    typeRows.map((type) => [
      type.id,
      {
        leaveTypeId: type.id,
        leaveTypeName: type.name,
        code: type.code,
        isPaid: type.isPaid,
        entitled: type.annualQuotaDays,
        used: 0,
        pending: 0,
        remaining: type.annualQuotaDays,
      },
    ])
  );

  for (const request of requestRows) {
    const balance = rowsByType.get(request.leaveTypeId);
    if (!balance) continue;
    if (request.status === "approved") {
      balance.used += request.totalDays;
    } else if (request.status === "pending") {
      balance.pending += request.totalDays;
    }
    balance.remaining = balance.entitled - balance.used;
  }

  return [...rowsByType.values()];
};

export const listBalancesFor = async (request: NextRequest, session: SessionPayload) => {
  const rawYear = request.nextUrl.searchParams.get("year");
  const parsedYear = rawYear ? Number(rawYear) : new Date().getFullYear();
  const year = Number.isInteger(parsedYear) ? parsedYear : new Date().getFullYear();

  const rawUserId = request.nextUrl.searchParams.get("userId");
  if (rawUserId && rawUserId !== session.userId && session.role !== "admin") {
    return fail(403, "Admin access required.");
  }

  const userId = rawUserId ?? session.userId;

  const [user] = await getUser(userId);
  if (!user) return fail(404, "User not found.");

  const balances = await getLeaveBalances(userId, year);
  return ok({ balances, year });
};
