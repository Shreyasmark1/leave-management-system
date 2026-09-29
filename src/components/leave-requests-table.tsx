"use client";

import Link from "next/link";
import { Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { TableEmpty } from "@/components/table-empty";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatDate } from "@/lib/leave-days";
import type { LeaveRequestRow } from "@/features/types";

interface LeaveRequestsTableProps {
  requests: LeaveRequestRow[];
  showEmployee?: boolean;
  userHref?: (request: LeaveRequestRow) => string;
  onCancel?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  actionSlot?: (request: LeaveRequestRow) => React.ReactNode;
  emptyMessage?: string;
}

export function LeaveRequestsTable({
  requests,
  showEmployee = false,
  userHref,
  onCancel,
  onDelete,
  actionSlot,
  emptyMessage = "No leave requests found.",
}: LeaveRequestsTableProps) {
  const hasActions = Boolean(onCancel || onDelete || actionSlot);
  const colSpan = (showEmployee ? 7 : 6) + (hasActions ? 1 : 0);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showEmployee && <TableHead>Employee</TableHead>}
          <TableHead>Type</TableHead>
          <TableHead>From</TableHead>
          <TableHead>To</TableHead>
          <TableHead>Days</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Status</TableHead>
          {hasActions && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.length === 0 ? (
          <TableEmpty colSpan={colSpan} message={emptyMessage} />
        ) : (
          requests.map((request) => (
            <TableRow key={request.id}>
              {showEmployee && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    {userHref ? (
                      <Link
                        href={userHref(request)}
                        className="font-medium hover:underline"
                      >
                        {request.userName}
                      </Link>
                    ) : (
                      <span className="font-medium">{request.userName}</span>
                    )}
                    {request.userDeletedAt && <Badge variant="destructive">Deleted</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">{request.userEmail}</div>
                </TableCell>
              )}
              <TableCell>
                <div className="font-medium">{request.leaveTypeName}</div>
                <div className="text-xs text-muted-foreground">{request.leaveTypeCode}</div>
              </TableCell>
              <TableCell>{formatDate(request.startDate)}</TableCell>
              <TableCell>{formatDate(request.endDate)}</TableCell>
              <TableCell>{request.totalDays}</TableCell>
              <TableCell className="max-w-48">
                <span className="line-clamp-1" title={request.reason}>
                  {request.reason}
                </span>
              </TableCell>
              <TableCell>
                <StatusBadge status={request.status} />
              </TableCell>
              {(hasActions) && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {actionSlot?.(request)}
                    {onCancel && request.status === "pending" && (
                      <ConfirmDialog
                        trigger={
                          <Button variant="ghost" size="icon-sm" aria-label="Cancel request">
                            <XCircle />
                          </Button>
                        }
                        title="Cancel this leave request?"
                        description="This will mark the request as cancelled. This action cannot be undone."
                        confirmLabel="Cancel request"
                        onConfirm={() => onCancel(request.id)}
                      />
                    )}
                    {onDelete && (
                      <ConfirmDialog
                        trigger={
                          <Button variant="ghost" size="icon-sm" aria-label="Delete request">
                            <Trash2 />
                          </Button>
                        }
                        title="Delete this leave request?"
                        description="The request will be removed from all lists. This action cannot be undone."
                        confirmLabel="Delete"
                        onConfirm={() => onDelete(request.id)}
                      />
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}