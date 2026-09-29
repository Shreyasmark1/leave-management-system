import { ApprovalsView } from "./approvals-view";
import type { LeaveStatus } from "@/features/types";

const allowedStatuses: readonly string[] = [
  "pending",
  "all",
  "approved",
  "rejected",
  "cancelled",
];

interface ApprovalsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function ApprovalsPage({ searchParams }: ApprovalsPageProps) {
  const { status } = await searchParams;
  const initialStatus =
    status && allowedStatuses.includes(status) ? (status as LeaveStatus | "all") : "pending";

  return <ApprovalsView initialStatus={initialStatus} />;
}
