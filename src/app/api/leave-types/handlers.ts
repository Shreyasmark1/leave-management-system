import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { leaveTypes } from "@/db/schema";
import { fail, ok } from "@/lib/errors";
import type { SaveLeaveTypeBody } from "@/lib/schemas";

const active = isNull(leaveTypes.deletedAt);

export const listLeaveTypes = async () => {
  return getDb()
    .select()
    .from(leaveTypes)
    .where(active)
    .orderBy(leaveTypes.name);
};

export const getLeaveTypeById = async (id: string) => {
  const rows = await getDb()
    .select()
    .from(leaveTypes)
    .where(and(eq(leaveTypes.id, id), active))
    .limit(1);
  return rows[0] ?? null;
};

/**
 * Looks up every row by code, including soft-deleted ones, because
 * `leave_types_code_idx` is a full unique index and covers them too. Checking
 * only active rows would let a deactivated code pass validation and then fail
 * on the index as an unhandled database error.
 */
const findLeaveTypeByCode = async (code: string) => {
  const rows = await getDb()
    .select({ id: leaveTypes.id, deletedAt: leaveTypes.deletedAt })
    .from(leaveTypes)
    .where(eq(leaveTypes.code, code))
    .limit(1);
  return rows[0] ?? null;
};

export const saveLeaveType = async (input: SaveLeaveTypeBody) => {
  if (input.code) {
    const excludeId = "id" in input ? input.id : undefined;
    const clash = await findLeaveTypeByCode(input.code);
    if (clash && clash.id !== excludeId) {
      if (clash.deletedAt) {
        return fail(409, `Leave type code "${input.code}" belongs to a deactivated leave type.`);
      }
      return fail(409, `Leave type code "${input.code}" is already in use.`);
    }
  }

  if ("id" in input) {
    const existing = await getLeaveTypeById(input.id);
    if (!existing) {
      return fail(404, "Leave type not found.");
    }

    const rows = await getDb()
      .update(leaveTypes)
      .set({
        name: input.name ?? existing.name,
        code: input.code ?? existing.code,
        annualQuotaDays: input.annualQuotaDays ?? existing.annualQuotaDays,
        isPaid: input.isPaid ?? existing.isPaid,
        description:
          input.description === undefined ? existing.description : input.description,
      })
      .where(and(eq(leaveTypes.id, input.id), active))
      .returning();

    return ok(rows[0]);
  }

  const rows = await getDb()
    .insert(leaveTypes)
    .values({
      name: input.name,
      code: input.code,
      annualQuotaDays: input.annualQuotaDays,
      isPaid: input.isPaid ?? true,
      description: input.description ?? null,
    })
    .returning();
  return ok(rows[0]);
};

export const deleteLeaveType = async (id: string) => {
  await getDb()
    .update(leaveTypes)
    .set({ deletedAt: new Date() })
    .where(eq(leaveTypes.id, id));
  return ok({ id });
};
