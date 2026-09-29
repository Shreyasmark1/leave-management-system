"use client";

import Link from "next/link";
import { AlertTriangle, CalendarDays, Inbox, ListFilter, Tags, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { LeaveRequestsTable } from "@/components/leave-requests-table";
import { useAdminStats } from "@/features/leave-types/admin-queries";

export default function AdminOverviewPage() {
  const { data: stats, isLoading } = useAdminStats();

  return (
    <div>
      <PageHeader
        title="Admin overview"
        description="Company-wide leave activity at a glance."
        action={
          <Button asChild variant="outline">
            <Link href="/admin/approvals">
              <Inbox />
              Review approvals
            </Link>
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Employees" value={stats?.totalEmployees ?? "-"} icon={Users} />
        <StatCard label="Leave types" value={stats?.totalLeaveTypes ?? "-"} icon={Tags} />
        <StatCard
          label="Pending approvals"
          value={stats?.pendingApprovals ?? "-"}
          icon={AlertTriangle}
        />
        <StatCard
          label="Requests this month"
          value={stats?.requestsThisMonth ?? "-"}
          icon={CalendarDays}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Requests by status</CardTitle>
            <CardDescription>All time</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {isLoading ? (
              [0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-8" />)
            ) : (
              stats?.statusBreakdown.map((entry) => (
                <div key={entry.status} className="flex items-center justify-between">
                  <StatusBadge status={entry.status} />
                  <span className="text-sm font-medium">{entry.total}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent requests</CardTitle>
            <CardDescription>Latest submissions across the company</CardDescription>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/approvals?status=all">
                  <ListFilter />
                  Show all
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid gap-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : (
              <LeaveRequestsTable
                requests={stats?.recentRequests ?? []}
                showEmployee
                userHref={(request) => `/admin/users/${request.userId}`}
                emptyMessage="No leave requests yet."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}