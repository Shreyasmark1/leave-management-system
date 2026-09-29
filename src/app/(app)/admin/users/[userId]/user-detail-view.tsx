"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  Hourglass,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { StatCard } from "@/components/stat-card";
import { BalanceList } from "@/components/balance-list";
import { LeaveRequestsTable } from "@/components/leave-requests-table";
import { useLeaveBalances } from "@/features/balances/queries";
import { useLeaveRequests } from "@/features/leave-requests/queries";
import { useUser } from "@/features/users/queries";
import { formatDateTime } from "@/lib/leave-days";
import type { LeaveStatus } from "@/features/types";

const filters: { value: LeaveStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

interface UserDetailViewProps {
  userId: string;
}

function BackButton() {
  return (
    <Button asChild variant="outline">
      <Link href="/admin/employees">
        <ArrowLeft />
        Back to users
      </Link>
    </Button>
  );
}

export function UserDetailView({ userId }: UserDetailViewProps) {
  const [status, setStatus] = useState<LeaveStatus | "all">("all");

  const { data: user, isLoading: userLoading, isError } = useUser(userId);
  const { data: balances = [], isLoading: balancesLoading } = useLeaveBalances(
    undefined,
    userId
  );
  const { data: requests = [], isLoading: requestsLoading } = useLeaveRequests(
    undefined,
    undefined,
    userId
  );

  // Filtered client-side so the stat cards below always describe the user's
  // full history rather than the currently selected status.
  const visibleRequests =
    status === "all" ? requests : requests.filter((request) => request.status === status);

  const totalRemaining = balances
    .filter((balance) => balance.entitled > 0)
    .reduce((sum, balance) => sum + balance.remaining, 0);
  const pendingCount = requests.filter((request) => request.status === "pending").length;
  const approvedDays = requests
    .filter((request) => request.status === "approved")
    .reduce((sum, request) => sum + request.totalDays, 0);

  if (isError) {
    return (
      <div>
        <PageHeader
          title="User not found"
          description="This account does not exist or is no longer accessible."
          action={<BackButton />}
        />
      </div>
    );
  }

  const details = user
    ? [
        user.email,
        user.department,
        user.role === "admin" ? "Admin" : "Employee",
        `Joined ${formatDateTime(user.joinedAt)}`,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <div>
      <PageHeader
        title={user?.name ?? "User"}
        description={details}
        action={<BackButton />}
      />

      {user?.deletedAt && (
        <div className="mb-6">
          <Badge variant="destructive">Deleted</Badge>
          <span className="ml-2 text-sm text-muted-foreground">
            This account is deactivated. Its leave history is preserved and read-only.
          </span>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Days remaining" value={totalRemaining} icon={CalendarDays} />
        <StatCard label="Pending requests" value={pendingCount} icon={Hourglass} />
        <StatCard label="Approved days (all time)" value={approvedDays} icon={CalendarClock} />
        <StatCard label="Requests in view" value={visibleRequests.length} icon={Inbox} />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 font-heading text-lg font-semibold">Balances</h2>
        {balancesLoading || userLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-36" />
            ))}
          </div>
        ) : (
          <BalanceList balances={balances} />
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold">Leave requests</h2>
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
        </div>
        <Card>
          <CardContent>
            {requestsLoading ? (
              <div className="grid gap-2 py-4">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : (
              <LeaveRequestsTable
                requests={visibleRequests}
                emptyMessage="This user has no leave requests in this view."
              />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
