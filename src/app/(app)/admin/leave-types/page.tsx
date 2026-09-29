"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
import { TableEmpty } from "@/components/table-empty";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LeaveTypeForm } from "@/components/leave-type-form";
import type { LeaveTypeFormValues } from "@/lib/schemas";
import { useLeaveTypes } from "@/features/leave-types/queries";
import {
  useCreateLeaveType,
  useDeleteLeaveType,
  useUpdateLeaveType,
} from "@/features/leave-types/admin-queries";
import type { LeaveTypeRow } from "@/features/types";

export default function LeaveTypesPage() {
  const { data: leaveTypes = [], isLoading } = useLeaveTypes();
  const createLeaveType = useCreateLeaveType();
  const updateLeaveType = useUpdateLeaveType();
  const deleteLeaveType = useDeleteLeaveType();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveTypeRow | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(leaveType: LeaveTypeRow) {
    setEditing(leaveType);
    setDialogOpen(true);
  }

  async function handleSubmit(values: LeaveTypeFormValues) {
    try {
      if (editing) {
        await updateLeaveType.mutateAsync({ id: editing.id, ...values });
        toast.success("Leave type updated.");
      } else {
        await createLeaveType.mutateAsync(values);
        toast.success("Leave type created.");
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save leave type.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteLeaveType.mutateAsync(id);
      toast.success("Leave type deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete leave type.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Leave types"
        description="Define the leave types employees can request and their annual quota."
        action={
          <Button onClick={openCreate}>
            <Plus />
            Add leave type
          </Button>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Annual quota</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveTypes.length === 0 ? (
                  <TableEmpty
                    colSpan={6}
                    message="No leave types configured. Add one to let employees apply."
                  />
                ) : (
                  leaveTypes.map((leaveType) => (
                    <TableRow key={leaveType.id}>
                      <TableCell className="font-medium">{leaveType.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{leaveType.code}</Badge>
                      </TableCell>
                      <TableCell>
                        {leaveType.annualQuotaDays === 0
                          ? "Unlimited"
                          : `${leaveType.annualQuotaDays} days`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={leaveType.isPaid ? "secondary" : "outline"}>
                          {leaveType.isPaid ? "Paid" : "Unpaid"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-56">
                        <span className="line-clamp-1" title={leaveType.description ?? ""}>
                          {leaveType.description ?? "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Edit leave type"
                            onClick={() => openEdit(leaveType)}
                          >
                            <Pencil />
                          </Button>
                          <ConfirmDialog
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Delete leave type"
                              >
                                <Trash2 />
                              </Button>
                            }
                            title="Delete this leave type?"
                            description={`${leaveType.name} will no longer be available to employees. Existing requests are preserved.`}
                            onConfirm={() => handleDelete(leaveType.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit leave type" : "Add leave type"}
            </DialogTitle>
            <DialogDescription>
              Annual quota is the number of days each employee may request per year.
            </DialogDescription>
          </DialogHeader>
          <LeaveTypeForm
            key={editing?.id ?? "new"}
            initial={editing}
            submitLabel={editing ? "Save changes" : "Create leave type"}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}