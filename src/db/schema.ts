import { pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar, integer, boolean, date, index } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["employee", "admin"]);
export const leaveStatusEnum = pgEnum("leave_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("employee"),
    department: varchar("department", { length: 255 }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)]
);

export const leaveTypes = pgTable(
  "leave_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    annualQuotaDays: integer("annual_quota_days").notNull().default(0),
    isPaid: boolean("is_paid").notNull().default(true),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("leave_types_code_idx").on(table.code)]
);

export const leaveRequests = pgTable(
  "leave_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    leaveTypeId: uuid("leave_type_id")
      .notNull()
      .references(() => leaveTypes.id),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    totalDays: integer("total_days").notNull(),
    reason: text("reason").notNull(),
    status: leaveStatusEnum("status").notNull().default("pending"),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewNote: text("review_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("leave_requests_user_idx").on(table.userId),
    index("leave_requests_status_idx").on(table.status),
    index("leave_requests_leave_type_idx").on(table.leaveTypeId),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type LeaveType = typeof leaveTypes.$inferSelect;
export type NewLeaveType = typeof leaveTypes.$inferInsert;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type NewLeaveRequest = typeof leaveRequests.$inferInsert;
export type Role = (typeof roleEnum.enumValues)[number];
export type LeaveStatus = (typeof leaveStatusEnum.enumValues)[number];