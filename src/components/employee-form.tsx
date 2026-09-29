"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormItem } from "@/components/form-item";
import { SubmitButton } from "@/components/submit-button";
import type { UserRow } from "@/features/types";
import { employeeFormSchema, type EmployeeFormValues } from "@/lib/schemas";

interface EmployeeFormProps {
  initial?: UserRow | null;
  submitLabel?: string;
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
}

export function EmployeeForm({ initial, submitLabel = "Save", onSubmit }: EmployeeFormProps) {
  const isEdit = Boolean(initial);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: initial?.name ?? "",
      email: initial?.email ?? "",
      password: "",
      role: initial?.role ?? "employee",
      department: initial?.department ?? "",
    },
    mode: "onBlur",
  });

  const { register, handleSubmit, setValue, formState } = form;
  const errors = formState.errors;
  const role = useWatch({ control: form.control, name: "role" });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <FormItem label="Full name" htmlFor="employee-name" error={errors.name?.message}>
        <Input
          id="employee-name"
          placeholder="Jane Doe"
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
      </FormItem>

      <FormItem label="Email" htmlFor="employee-email" error={errors.email?.message}>
        <Input
          id="employee-email"
          type="email"
          placeholder="jane@company.com"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
      </FormItem>

      <FormItem
        label={isEdit ? "New password" : "Temporary password"}
        htmlFor="employee-password"
        error={errors.password?.message}
        description={
          isEdit
            ? "Leave blank to keep the current password."
            : "At least 6 characters."
        }
      >
        <Input
          id="employee-password"
          type="password"
          autoComplete="new-password"
          placeholder={isEdit ? "Leave blank to keep current" : "••••••••"}
          aria-invalid={Boolean(errors.password)}
          {...register("password", {
            validate: (value) => {
              if (!isEdit && value.length === 0) return "Password is required.";
              if (value.length > 0 && value.length < 6) {
                return "Password must be at least 6 characters.";
              }
              return true;
            },
          })}
        />
      </FormItem>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormItem label="Role" htmlFor="employee-role" error={errors.role?.message}>
          <Select
            value={role}
            onValueChange={(value) =>
              setValue("role", value as EmployeeFormValues["role"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger
              id="employee-role"
              className="w-full"
              aria-invalid={Boolean(errors.role)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>

        <FormItem
          label="Department"
          htmlFor="employee-department"
          error={errors.department?.message}
        >
          <Input
            id="employee-department"
            placeholder="Engineering"
            aria-invalid={Boolean(errors.department)}
            {...register("department")}
          />
        </FormItem>
      </div>

      <div className="flex justify-end">
        <SubmitButton loading={formState.isSubmitting}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
