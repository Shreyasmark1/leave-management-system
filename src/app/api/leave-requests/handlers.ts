import "server-only";

import { and, desc, eq, gte, isNull, lt } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { getDb } from "@/db";
import { leaveRequests, leaveTypes, users } from "@/db/schema";
import type { LeaveStatus } from "@/db/schema";
import { countLeaveDays, isValidDateRange } from "@/lib/leave-days";
import type { SessionPayload } from "@/lib/auth/session";
import { fail, ok } from "@/lib/errors";
import { leaveStatusValues, type SaveLeaveRequestBody } from "@/lib/schemas";
import { getLeaveTypeById } from "../leave-types/handlers";
import { getUser } from "../users/handlers";

const active = isNull(leaveRequests.deletedAt);

type Db = ReturnType<typeof getDb>;

const withRelations = (db: Db) => {
  return db
    .select({
      id: leaveRequests.id,
      userId: leaveRequests.userId,
      leaveTypeId: leaveRequests.leaveTypeId,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      totalDays: leaveRequests.totalDays,
      reason: leaveRequests.reason,
      status: leaveRequests.status,
      reviewedBy: leaveRequests.reviewedBy,
      reviewedAt: leaveRequests.reviewedAt,
      reviewNote: leaveRequests.reviewNote,
      createdAt: leaveRequests.createdAt,
      userName: users.name,
      userEmail: users.email,
      userDepartment: users.department,
      userDeletedAt: users.deletedAt,
      leaveTypeName: leaveTypes.name,
      leaveTypeCode: leaveTypes.code,
    })
    .from(leaveRequests)
    .leftJoin(users, eq(leaveRequests.userId, users.id))
    .leftJoin(leaveTypes, eq(leaveRequests.leaveTypeId, leaveTypes.id));
}

const VALID_STATUSES: readonly string[] = leaveStatusValues;

const getLeaveRequestById = async (id: string) => {
  const rows = await withRelations(getDb())
    .where(and(eq(leaveRequests.id, id), active))
    .limit(1);
  return rows[0] ?? null;
};

export const listLeaveRequests = async (filter?: {
  status?: LeaveStatus;
  userId?: string;
  }) => {
  const conditions = [active];
  if (filter?.status) conditions.push(eq(leaveRequests.status, filter.status));
  if (filter?.userId) conditions.push(eq(leaveRequests.userId, filter.userId));

  return withRelations(getDb())
    .where(and(...conditions))
    .orderBy(desc(leaveRequests.createdAt));
};

/**
 * Resolves which user's requests to list. An explicit `userId` is an admin-only
 * capability used by the admin detail view; `scope=mine` keeps its existing
 * meaning and is only honoured when no `userId` is supplied.
 */
export const listLeaveRequestsFor = async (request: NextRequest, session: SessionPayload) => {
  const rawStatus = request.nextUrl.searchParams.get("status");
  const status =
    rawStatus && VALID_STATUSES.includes(rawStatus)
      ? (rawStatus as LeaveStatus)
      : undefined;

  const rawUserId = request.nextUrl.searchParams.get("userId");
  if (rawUserId && rawUserId !== session.userId && session.role !== "admin") {
    return fail(403, "Admin access required.");
  }

  if (rawUserId) {
    const [user] = await getUser(rawUserId);
    if (!user) return fail(404, "User not found.");

    return ok(await listLeaveRequests({ status, userId: rawUserId }));
  }

  const mineOnly = request.nextUrl.searchParams.get("scope") === "mine";

  const requests = await listLeaveRequests({
    status,
    userId: session.role === "admin" && !mineOnly ? undefined : session.userId,
  });

  return ok(requests);
};

const sumDaysByStatus = async (
  userId: string,
  leaveTypeId: string,
  year: number,
  status: "approved" | "pending"
) => {
  const rows = await getDb()
    .select({ totalDays: leaveRequests.totalDays })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.userId, userId),
        eq(leaveRequests.leaveTypeId, leaveTypeId),
        eq(leaveRequests.status, status),
        active,
        gte(leaveRequests.startDate, `${year}-01-01`),
        lt(leaveRequests.startDate, `${year + 1}-01-01`)
      )
    );

  return rows.reduce((sum, row) => sum + row.totalDays, 0);
};

export const saveLeaveRequest = async (
  input: SaveLeaveRequestBody,
  session: SessionPayload
) => {
  if ("id" in input) {
    return reviewLeaveRequest(input, session);
  }

  if (!isValidDateRange(input.startDate, input.endDate)) {
    return fail(400, "Invalid date range. Start date must be before or equal to end date.");
  }

  const leaveType = await getLeaveTypeById(input.leaveTypeId);
  if (!leaveType) {
    return fail(404, "Leave type not found.");
  }

  const totalDays = countLeaveDays(new Date(input.startDate), new Date(input.endDate));
  if (totalDays < 1) {
    return fail(400, "The selected period contains no working days.");
  }

  if (leaveType.annualQuotaDays > 0) {
    const startYear = new Date(`${input.startDate}T00:00:00`).getFullYear();
    const [used, pending] = await Promise.all([
      sumDaysByStatus(session.userId, input.leaveTypeId, startYear, "approved"),
      sumDaysByStatus(session.userId, input.leaveTypeId, startYear, "pending"),
    ]);

    if (used + pending + totalDays > leaveType.annualQuotaDays) {
      return fail(
        400,
        `Insufficient balance for ${leaveType.name}. ${leaveType.annualQuotaDays - used - pending} day(s) left.`
      );
    }
  }

  const rows = await getDb()
    .insert(leaveRequests)
    .values({
      userId: session.userId,
      leaveTypeId: input.leaveTypeId,
      startDate: input.startDate,
      endDate: input.endDate,
      totalDays,
      reason: input.reason,
      status: "pending",
    })
    .returning();

  return ok(rows[0]);
};

/**
 * Cancelling is owner-only; approving and rejecting are admin-only. The role check
 * is a resource rule rather than a transport rule, so it is resolved here from the
 * actor passed in by the route.
 */
const reviewLeaveRequest = async (
  input: Extract<SaveLeaveRequestBody, { id: string }>,
  session: SessionPayload
) => {
  const existing = await getLeaveRequestById(input.id);
  if (!existing) {
    return fail(404, "Leave request not found.");
  }

  if (input.status === "cancelled") {
    if (existing.userId !== session.userId) {
      return fail(403, "You can only cancel your own leave requests.");
    }
    if (existing.status !== "pending") {
      return fail(409, `Only pending requests can be cancelled (current status: ${existing.status}).`);
    }

    const rows = await getDb()
      .update(leaveRequests)
      .set({ status: "cancelled" })
      .where(eq(leaveRequests.id, input.id))
      .returning();
    return ok(rows[0]);
  }

  if (session.role !== "admin") {
    return fail(403, "Admin access required.");
  }

  if (existing.status !== "pending") {
    return fail(409, `This request was already ${existing.status}.`);
  }

  const rows = await getDb()
    .update(leaveRequests)
    .set({
      status: input.status,
      reviewedBy: session.userId,
      reviewedAt: new Date(),
      reviewNote: input.reviewNote ?? null,
    })
    .where(eq(leaveRequests.id, input.id))
    .returning();

  return ok(rows[0]);
};

export const deleteLeaveRequest = async (
  id: string
) => {
  await getDb()
    .update(leaveRequests)
    .set({ deletedAt: new Date() })
    .where(eq(leaveRequests.id, id));

  return ok({ id });
};
