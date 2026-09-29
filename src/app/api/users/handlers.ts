import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import type { Role } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { fail, ok } from "@/lib/errors";
import type { SaveUserBody } from "@/lib/schemas";
import type { SessionPayload } from "@/lib/auth/session";

const active = isNull(users.deletedAt);

const userPublicColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  department: users.department,
  joinedAt: users.joinedAt,
  createdAt: users.createdAt,
  deletedAt: users.deletedAt,
};

export const listUsers = async () => {
  const rows = await getDb()
    .select(userPublicColumns)
    .from(users)
    .where(active)
    .orderBy(users.name);
  return ok(rows);
};

/**
 * Reads a single account for the admin detail view. Soft-deleted users are
 * deliberately included so their leave history stays inspectable.
 */
export const getUser = async (id: string) => {
  const rows = await getDb()
    .select(userPublicColumns)
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  const user = rows[0];
  if (!user) return fail(404, "User not found.");

  return ok(user);
};

export const getUserWithPasswordByEmail = async (email: string) => {
  const rows = await getDb()
    .select()
    .from(users)
    .where(and(eq(users.email, email), active))
    .limit(1);
  return rows[0] ?? null;
};

const getUserById = async (id: string) => {
  const rows = await getDb()
    .select(userPublicColumns)
    .from(users)
    .where(and(eq(users.id, id), active))
    .limit(1);
  return rows[0] ?? null;
};

/**
 * Looks up every row by email, including soft-deleted ones, because
 * `users_email_idx` is a full unique index and covers them too. Checking only
 * active rows would let a deactivated account's email pass validation and then
 * fail on the index as an unhandled database error.
 */
const findUserByEmail = async (email: string) => {
  const rows = await getDb()
    .select({ id: users.id, deletedAt: users.deletedAt })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return rows[0] ?? null;
};

export const saveUser = async (
  input: SaveUserBody,
  actor: SessionPayload
) => {
  if (input.email) {
    const excludeId = "id" in input ? input.id : undefined;
    const clash = await findUserByEmail(input.email);
    if (clash && clash.id !== excludeId) {
      if (clash.deletedAt) {
        return fail(409, `Email "${input.email}" belongs to a deactivated account.`);
      }
      return fail(409, `Email "${input.email}" is already in use.`);
    }
  }

  if ("id" in input) {
    if (input.id === actor.userId) {
      return fail(403, "You cannot modify your own account.");
    }

    const existing = await getUserById(input.id);
    if (!existing) {
      return fail(404, "Employee not found.");
    }

    const role: Role = input.role ?? existing.role;
    const rows = await getDb()
      .update(users)
      .set({
        name: input.name ?? existing.name,
        email: input.email ?? existing.email,
        department:
          input.department === undefined ? existing.department : input.department,
        role,
        ...(input.password ? { passwordHash: await hashPassword(input.password) } : {}),
      })
      .where(and(eq(users.id, input.id), active))
      .returning(userPublicColumns);

    return ok(rows[0]);
  }

  const rows = await getDb()
    .insert(users)
    .values({
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: input.role ?? "employee",
      department: input.department ?? null,
    })
    .returning(userPublicColumns);
  return ok(rows[0]);
};

export const deleteUser = async (
  id: string,
  actor: SessionPayload
) => {
  if (id === actor.userId) {
    return fail(403, "You cannot delete your own account.");
  }

  await getDb()
    .update(users)
    .set({ deletedAt: new Date() })
    .where(and(eq(users.id, id), active));

  return ok({ id });
};
