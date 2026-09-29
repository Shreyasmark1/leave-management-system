"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { LeaveRequestsTable } from "@/components/leave-requests-table";
import { useCancelLeaveRequest, useLeaveRequests } from "@/features/leave-requests/queries";
import type { LeaveStatus } from "@/features/types";

const filters: { value: LeaveStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

export default function LeaveHistoryPage() {
  const [status, setStatus] = useState<LeaveStatus | "all">("all");
  const { data: requests = [], isLoading } = useLeaveRequests(
    status === "all" ? undefined : status,
    "mine"
  );
  const cancelRequest = useCancelLeaveRequest();

  async function handleCancel(id: string) {
    try {
      await cancelRequest.mutateAsync(id);
      toast.success("Leave request cancelled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to cancel request.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Leave history"
        description="All the leave requests you have submitted."
        action={
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as LeaveStatus | "all")}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filters.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <Card>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-2 py-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : (
            <LeaveRequestsTable
              requests={requests}
              onCancel={handleCancel}
              emptyMessage="No leave requests match this filter."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}