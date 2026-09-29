import "server-only";

import { destroySession } from "@/lib/auth/session";
import { ok } from "@/lib/errors";

export const logout = async () => {
  await destroySession();
  return ok({ loggedOut: true });
};
