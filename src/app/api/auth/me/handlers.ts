import "server-only";

import { getSession } from "@/lib/auth/session";
import { fail, ok } from "@/lib/errors";

export const me = async () => {
  const session = await getSession();
  if (!session) {
    return fail(401, "Authentication required.");
  }
  return ok(session);
};
