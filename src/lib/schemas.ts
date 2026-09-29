import { z } from "zod";

const nameField = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters.")
  .max(255, "Name is too long.");

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("A valid email is required."));

const passwordField = z
  .string()
  .trim()
  .min(6, "Password must be at least 6 characters.")
  .max(200, "Password is too long.");

const departmentField = z
  .string()
  .trim()
  .max(255, "Department is too long.")
  .nullable()
  .optional();

const roleField = z.enum(["employee", "admin"]);

const isoDateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD format.");

/* -------------------------------------------------------------------------- */
/*                              Form-facing schemas                            */
/* -------------------------------------------------------------------------- */

export const loginFormSchema = z.object({
  email: emailField,
  password: z.string().trim().min(1, "Password is required."),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const leaveRequestFormSchema = z
  .object({
    leaveTypeId: z.string().min(1, "Leave type must be selected."),
    startDate: isoDateField,
    endDate: isoDateField,
    reason: z
      .string()
      .trim()
      .min(3, "Reason must be at least 3 characters.")
      .max(2000, "Reason is too long."),
  })
  .refine((values) => values.endDate >= values.startDate, {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
  });
export type LeaveRequestFormValues = z.infer<typeof leaveRequestFormSchema>;

export const employeeFormSchema = z.object({
  name: nameField,
  email: emailField,
  password: z.string().trim().max(200, "Password is too long."),
  role: roleField,
  department: z.string().trim().max(255, "Department is too long."),
});
export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export const leaveTypeFormSchema = z.object({
  name: nameField,
  code: z
    .string()
    .trim()
    .min(2, "Code must be at least 2 characters.")
    .max(50, "Code is too long."),
  annualQuotaDays: z
    .number("Quota must be a number.")
    .int("Quota must be a whole number.")
    .min(0, "Quota cannot be negative."),
  isPaid: z.boolean(),
  description: z.string().trim().max(2000, "Description is too long."),
});
export type LeaveTypeFormValues = z.infer<typeof leaveTypeFormSchema>;

export const reviewNoteSchema = z.object({
  reviewNote: z
    .string()
    .trim()
    .max(2000, "Note is too long.")
    .optional(),
});
export type ReviewNoteValues = z.infer<typeof reviewNoteSchema>;

/* -------------------------------------------------------------------------- */
/*                              API request schemas                            */
/* -------------------------------------------------------------------------- */

export const loginRequestSchema = loginFormSchema;

export const idSchema = z.string().uuid("Id is missing.");

/* POST upserts: a body with no `id` creates, with an `id` updates. Create and
   update are genuinely different shapes, so each save schema is a union of the
   two rather than one object with every field optional. */
const leaveTypeCodeField = z
  .string()
  .trim()
  .min(2, "Code must be at least 2 characters.")
  .max(50, "Code is too long.")
  .toUpperCase();

const quotaField = z
  .number("Quota must be a number.")
  .int("Quota must be a whole number.")
  .min(0, "Quota cannot be negative.");

const leaveTypeDescriptionField = z
  .string()
  .trim()
  .max(2000, "Description is too long.")
  .nullable()
  .optional();

const createLeaveTypeBodySchema = z.object({
  name: nameField,
  code: leaveTypeCodeField,
  annualQuotaDays: quotaField,
  isPaid: z.boolean().optional(),
  description: leaveTypeDescriptionField,
});

export const saveLeaveTypeSchema = z.union([
  createLeaveTypeBodySchema,
  createLeaveTypeBodySchema.partial().extend({ id: idSchema }),
]);
export type SaveLeaveTypeBody = z.infer<typeof saveLeaveTypeSchema>;

const createUserBodySchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
  role: roleField.optional(),
  department: departmentField,
});

export const saveUserSchema = z.union([
  createUserBodySchema,
  createUserBodySchema.partial().extend({ id: idSchema }),
]);
export type SaveUserBody = z.infer<typeof saveUserSchema>;

const reviewLeaveRequestBodySchema = z.object({
  id: idSchema,
  status: z.enum(["approved", "rejected", "cancelled"]),
  reviewNote: z
    .string()
    .trim()
    .max(2000, "Review note is too long.")
    .optional(),
});

export const saveLeaveRequestSchema = z.union([
  leaveRequestFormSchema,
  reviewLeaveRequestBodySchema,
]);
export type SaveLeaveRequestBody = z.infer<typeof saveLeaveRequestSchema>;

export const leaveStatusValues = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
] as const;
