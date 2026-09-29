import "server-only";

import { fail, ok } from "@/lib/errors";
import type { loginRequestSchema } from "@/lib/schemas";
import { createSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { getUserWithPasswordByEmail } from "../../users/handlers";

const INVALID_CREDENTIALS = "Invalid email or password.";

export const login = async (
  input: ReturnType<typeof loginRequestSchema.parse>
) => {
  const user = await getUserWithPasswordByEmail(input.email);
  if (!user) {
    return fail(401, INVALID_CREDENTIALS);
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);
  if (!passwordMatches) {
    return fail(401, INVALID_CREDENTIALS);
  }

  await createSession({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  return ok({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
  });
};
