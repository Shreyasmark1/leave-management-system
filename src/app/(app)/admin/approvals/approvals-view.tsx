"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { LeaveRequestsTable } from "@/components/leave-requests-table";
import { SubmitButton } from "@/components/submit-button";
import {
  useDeleteLeaveRequest,
  useLeaveRequests,
  useReviewLeaveRequest,
} from "@/features/leave-requests/queries";
import type { LeaveRequestRow, LeaveStatus } from "@/features/types";

const filters: { value: LeaveStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "all", label: "All" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

interface ApprovalsViewProps {
  initialStatus: LeaveStatus | "all";
}

export function ApprovalsView({ initialStatus }: ApprovalsViewProps) {
  const [status, setStatus] = useState<LeaveStatus | "all">(initialStatus);
  const { data: requests = [], isLoading } = useLeaveRequests(
    status === "all" ? undefined : status
  );
  const reviewRequest = useReviewLeaveRequest();
  const deleteRequest = useDeleteLeaveRequest();

  const [rejecting, setRejecting] = useState<LeaveRequestRow | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  async function handleApprove(id: string) {
    try {
      await reviewRequest.mutateAsync({ id, status: "approved" });
      toast.success("Leave request approved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to approve request.");
    }
  }

  async function handleReject() {
    if (!rejecting) return;
    try {
      await reviewRequest.mutateAsync({
        id: rejecting.id,
        status: "rejected",
        reviewNote: reviewNote.trim() || undefined,
      });
      toast.success("Leave request rejected.");
      setRejecting(null);
      setReviewNote("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reject request.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteRequest.mutateAsync(id);
      toast.success("Leave request deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete request.");
    }
  }

  function renderActions(request: LeaveRequestRow) {
    if (request.status !== "pending") return null;
    return (
      <div className="flex justify-end gap-1">
        <Button
          size="icon-sm"
          aria-label="Approve request"
          disabled={reviewRequest.isPending}
          onClick={() => handleApprove(request.id)}
        >
          <Check />
        </Button>
        <Button
          size="icon-sm"
          variant="destructive"
          aria-label="Reject request"
          disabled={reviewRequest.isPending}
          onClick={() => {
            setRejecting(request);
            setReviewNote("");
          }}
        >
          <X />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Approvals"
        description="Review, approve or reject pending leave requests."
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
            </div>
          ) : (
            <LeaveRequestsTable
              requests={requests.map((request) => ({
                ...request,
              }))}
              showEmployee
              userHref={(request) => `/admin/users/${request.userId}`}
              onDelete={handleDelete}
              emptyMessage="There are no requests in this view."
              actionSlot={renderActions}
            />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={rejecting !== null}
        onOpenChange={(open) => !open && setRejecting(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject leave request</DialogTitle>
            <DialogDescription>
              Optionally add a note for {rejecting?.userName}. The employee sees this note.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="reviewNote">Note</Label>
            <Textarea
              id="reviewNote"
              rows={3}
              maxLength={2000}
              value={reviewNote}
              onChange={(event) => setReviewNote(event.target.value)}
              placeholder="Reason for rejection"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <SubmitButton
              type="button"
              variant="destructive"
              loading={reviewRequest.isPending}
              onClick={handleReject}
            >
              Reject
            </SubmitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
