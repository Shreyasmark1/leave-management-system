"use client";

import { LeaveRequestForm } from "@/components/leave-request-form";
import { PageHeader } from "@/components/page-header";

export default function ApplyLeavePage() {
  return (
    <div>
      <PageHeader
        title="Apply for leave"
        description="Submit a new leave request for manager approval."
      />
      <LeaveRequestForm />
    </div>
  );
}