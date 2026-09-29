import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LeaveBalanceRow } from "@/features/types";

function BalanceCard({ balance }: { balance: LeaveBalanceRow }) {
  const usedPercent =
    balance.entitled > 0
      ? Math.min(100, Math.round((balance.used / balance.entitled) * 100))
      : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{balance.leaveTypeName}</CardTitle>
          <Badge variant="outline">{balance.code}</Badge>
        </div>
        {!balance.isPaid && <CardDescription>Unpaid leave</CardDescription>}
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex items-baseline gap-1.5">
          <span className="font-heading text-2xl font-semibold">{balance.remaining}</span>
          <span className="text-sm text-muted-foreground">
            of {balance.entitled} day(s) left
          </span>
        </div>
        {balance.entitled > 0 && (
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${usedPercent}%` }}
            />
          </div>
        )}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>Used: {balance.used}</span>
          <span>Pending: {balance.pending}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function BalanceList({ balances }: { balances: LeaveBalanceRow[] }) {
  if (balances.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No leave types configured yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {balances.map((balance) => (
        <BalanceCard key={balance.leaveTypeId} balance={balance} />
      ))}
    </div>
  );
}