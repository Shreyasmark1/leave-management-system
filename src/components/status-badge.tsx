import { Badge } from "@/components/ui/badge";
import type { LeaveStatus } from "@/features/types";

const statusVariant: Record<LeaveStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  approved: "default",
  rejected: "destructive",
  cancelled: "secondary",
};

export function StatusBadge({ status }: { status: LeaveStatus }) {
  return (
    <Badge variant={statusVariant[status]} className="capitalize">
      {status}
    </Badge>
  );
}