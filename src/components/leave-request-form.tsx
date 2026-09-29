"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useCreateLeaveRequest } from "@/features/leave-requests/queries";
import { useLeaveTypes } from "@/features/leave-types/queries";
import { useLeaveBalances } from "@/features/balances/queries";
import { countLeaveDays } from "@/lib/leave-days";
import { leaveRequestFormSchema, type LeaveRequestFormValues } from "@/lib/schemas";

export function LeaveRequestForm() {
  const { data: leaveTypes = [] } = useLeaveTypes();
  const { data: balances = [] } = useLeaveBalances();
  const createRequest = useCreateLeaveRequest();

  const form = useForm<LeaveRequestFormValues>({
    resolver: zodResolver(leaveRequestFormSchema),
    defaultValues: { leaveTypeId: "", startDate: "", endDate: "", reason: "" },
    mode: "onBlur",
  });

  const [leaveTypeId, startDate, endDate] = useWatch({
    control: form.control,
    name: ["leaveTypeId", "startDate", "endDate"],
  });
  const errors = form.formState.errors;

  const requestedDays =
    startDate && endDate && endDate >= startDate
      ? countLeaveDays(new Date(startDate), new Date(endDate))
      : 0;

  const selectedBalance = balances.find((balance) => balance.leaveTypeId === leaveTypeId);

  async function onSubmit(values: LeaveRequestFormValues) {
    try {
      await createRequest.mutateAsync(values);
      toast.success("Leave request submitted.");
      form.reset();
      form.clearErrors();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit request.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply for leave</CardTitle>
        <CardDescription>
          Weekends are excluded automatically. Your request will be pending until an admin reviews it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid max-w-2xl gap-4"
          noValidate
        >
          <FormItem
            label="Leave type"
            htmlFor="leaveTypeId"
            error={errors.leaveTypeId?.message}
            description={
              selectedBalance
                ? `${selectedBalance.remaining} day(s) available${
                    selectedBalance.pending > 0 ? ` · ${selectedBalance.pending} pending` : ""
                  }`
                : undefined
            }
          >
            <Select
              value={leaveTypeId}
              onValueChange={(value) =>
                form.setValue("leaveTypeId", value, { shouldValidate: true })
              }
            >
              <SelectTrigger
                id="leaveTypeId"
                className="w-full"
                aria-invalid={Boolean(errors.leaveTypeId)}
              >
                <SelectValue placeholder="Select a leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormItem
              label="Start date"
              htmlFor="startDate"
              error={errors.startDate?.message}
            >
              <Input
                id="startDate"
                type="date"
                aria-invalid={Boolean(errors.startDate)}
                {...form.register("startDate")}
              />
            </FormItem>
            <FormItem
              label="End date"
              htmlFor="endDate"
              error={errors.endDate?.message}
            >
              <Input
                id="endDate"
                type="date"
                aria-invalid={Boolean(errors.endDate)}
                {...form.register("endDate")}
              />
            </FormItem>
          </div>

          <p className="text-sm text-muted-foreground">
            {errors.endDate
              ? errors.endDate.message
              : requestedDays > 0
                ? `Requested: ${requestedDays} working day(s).`
                : "Choose a date range to see the number of working days."}
          </p>

          <FormItem label="Reason" htmlFor="reason" error={errors.reason?.message}>
            <Textarea
              id="reason"
              rows={4}
              maxLength={2000}
              placeholder="Briefly describe why you need this leave."
              aria-invalid={Boolean(errors.reason)}
              {...form.register("reason")}
            />
          </FormItem>

          <div>
            <SubmitButton loading={form.formState.isSubmitting}>
              Submit request
            </SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
