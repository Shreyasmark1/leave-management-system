"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormItem } from "@/components/form-item";
import { SubmitButton } from "@/components/submit-button";
import type { LeaveTypeRow } from "@/features/types";
import { leaveTypeFormSchema, type LeaveTypeFormValues } from "@/lib/schemas";

interface LeaveTypeFormProps {
  initial?: LeaveTypeRow | null;
  submitLabel?: string;
  onSubmit: (values: LeaveTypeFormValues) => Promise<void>;
}

export function LeaveTypeForm({
  initial,
  submitLabel = "Save",
  onSubmit,
}: LeaveTypeFormProps) {
  const form = useForm<LeaveTypeFormValues>({
    resolver: zodResolver(leaveTypeFormSchema),
    defaultValues: {
      name: initial?.name ?? "",
      code: initial?.code ?? "",
      annualQuotaDays: initial?.annualQuotaDays ?? 0,
      isPaid: initial?.isPaid ?? true,
      description: initial?.description ?? "",
    },
    mode: "onBlur",
  });

  const { register, handleSubmit, setValue, formState } = form;
  const errors = formState.errors;
  const isPaid = useWatch({ control: form.control, name: "isPaid" });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <FormItem label="Name" htmlFor="leave-type-name" error={errors.name?.message}>
          <Input
            id="leave-type-name"
            placeholder="Annual leave"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
        </FormItem>
        <FormItem label="Code" htmlFor="leave-type-code" error={errors.code?.message}>
          <Input
            id="leave-type-code"
            placeholder="ANNUAL"
            aria-invalid={Boolean(errors.code)}
            {...register("code", {
              setValueAs: (value: string) => value.toUpperCase(),
            })}
          />
        </FormItem>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormItem
          label="Annual quota (days)"
          htmlFor="leave-type-quota"
          error={errors.annualQuotaDays?.message}
          description="Set 0 for unlimited leave (e.g. unpaid leave)."
        >
          <Input
            id="leave-type-quota"
            type="number"
            min={0}
            step={1}
            aria-invalid={Boolean(errors.annualQuotaDays)}
            {...register("annualQuotaDays", {
              valueAsNumber: true,
              setValueAs: (value: string) => (value === "" ? NaN : Number(value)),
            })}
          />
        </FormItem>

        <FormItem label="Paid" htmlFor="leave-type-paid" error={errors.isPaid?.message}>
          <Select
            value={isPaid ? "paid" : "unpaid"}
            onValueChange={(value) => setValue("isPaid", value === "paid")}
          >
            <SelectTrigger id="leave-type-paid" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>
      </div>

      <FormItem
        label="Description"
        htmlFor="leave-type-description"
        error={errors.description?.message}
      >
        <Textarea
          id="leave-type-description"
          rows={3}
          maxLength={2000}
          placeholder="Optional notes about this leave type."
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
      </FormItem>

      <div className="flex justify-end">
        <SubmitButton loading={formState.isSubmitting}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
