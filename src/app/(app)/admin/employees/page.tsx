"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { LayoutDashboard, Pencil, Trash2, UserPlus } from "lucide-react";
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
import { EmployeeForm } from "@/components/employee-form";
import type { EmployeeFormValues } from "@/lib/schemas";
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from "@/features/users/queries";
import type { UserRow } from "@/features/types";

export default function EmployeesPage() {
  const { data: users = [], isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(user: UserRow) {
    setEditing(user);
    setDialogOpen(true);
  }

  async function handleSubmit(values: EmployeeFormValues) {
    try {
      if (editing) {
        await updateUser.mutateAsync({ id: editing.id, ...values });
        toast.success("Employee updated.");
      } else {
        await createUser.mutateAsync({ ...values, password: values.password });
        toast.success("Employee created.");
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save employee.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteUser.mutateAsync(id);
      toast.success("Employee deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete employee.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Create and manage user accounts."
        action={
          <Button onClick={openCreate}>
            <UserPlus />
            Add employee
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
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableEmpty colSpan={5} message="No users yet. Add your first account." />
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.department ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"} className="capitalize">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`View ${user.name}'s leave details`}
                          >
                            <Link href={`/admin/users/${user.id}`}>
                              <LayoutDashboard />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Edit employee"
                            onClick={() => openEdit(user)}
                          >
                            <Pencil />
                          </Button>
                          <ConfirmDialog
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Delete employee"
                              >
                                <Trash2 />
                              </Button>
                            }
                            title="Delete this employee?"
                            description={`${user.name} will no longer be able to sign in. Their leave history is preserved.`}
                            onConfirm={() => handleDelete(user.id)}
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
              {editing ? "Edit employee" : "Add employee"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update this employee's details. Leave the password blank to keep it unchanged."
                : "Create a new employee account with a temporary password."}
            </DialogDescription>
          </DialogHeader>
          <EmployeeForm
            key={editing?.id ?? "new"}
            initial={editing}
            submitLabel={editing ? "Save changes" : "Create employee"}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}