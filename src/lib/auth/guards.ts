import { redirect } from "next/navigation";
import { AppError } from "@/lib/errors";
import { getSession, type SessionPayload } from "./session";

export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireUser();
  if (session.role !== "admin") redirect("/dashboard");
  return session;
}

export async function requireApiUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new AppError(401, "Authentication required.");
  return session;
}

export async function requireApiAdmin(): Promise<SessionPayload> {
  const session = await requireApiUser();
  if (session.role !== "admin") throw new AppError(403, "Admin access required.");
  return session;
}
