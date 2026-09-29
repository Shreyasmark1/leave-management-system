"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { BalanceList } from "@/components/balance-list";
import { LeaveRequestsTable } from "@/components/leave-requests-table";
import { useLeaveBalances } from "@/features/balances/queries";
import { useLeaveRequests } from "@/features/leave-requests/queries";
import { CalendarClock, CalendarDays, CalendarPlus, Hourglass } from "lucide-react";

export default function DashboardPage() {
  const { data: balances = [], isLoading: balancesLoading } = useLeaveBalances();
  const { data: requests = [], isLoading: requestsLoading } = useLeaveRequests(undefined, "mine");

  const totalRemaining = balances
    .filter((balance) => balance.entitled > 0)
    .reduce((sum, balance) => sum + balance.remaining, 0);
  const pendingCount = requests.filter((request) => request.status === "pending").length;
  const approvedDays = requests
    .filter((request) => request.status === "approved")
    .reduce((sum, request) => sum + request.totalDays, 0);
  const recentRequests = requests.slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your leave balances and recent activity."
        action={
          <Button asChild>
            <Link href="/leave/apply">
              <CalendarPlus />
              Apply for leave
            </Link>
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Days remaining" value={totalRemaining} icon={CalendarDays} />
        <StatCard label="Pending requests" value={pendingCount} icon={Hourglass} />
        <StatCard label="Approved days (all time)" value={approvedDays} icon={CalendarClock} />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 font-heading text-lg font-semibold">Your balances</h2>
        {balancesLoading ? (
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
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Recent requests</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/leave/history">View all</Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="sr-only">Recent leave requests</CardTitle>
            <CardDescription className="sr-only">Your five most recent leave requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="grid gap-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : (
              <LeaveRequestsTable requests={recentRequests} emptyMessage="You have no leave requests yet." />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}