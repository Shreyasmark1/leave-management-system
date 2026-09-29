CREATE TYPE "public"."leave_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('employee', 'admin');--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"leave_type_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"total_days" integer NOT NULL,
	"reason" text NOT NULL,
	"status" "leave_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "leave_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"annual_quota_days" integer DEFAULT 0 NOT NULL,
	"is_paid" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'employee' NOT NULL,
	"department" varchar(255),
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leave_requests_user_idx" ON "leave_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "leave_requests_status_idx" ON "leave_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leave_requests_leave_type_idx" ON "leave_requests" USING btree ("leave_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "leave_types_code_idx" ON "leave_types" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");