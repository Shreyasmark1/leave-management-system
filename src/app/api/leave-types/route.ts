import { ApiResponse, handleRoute, parseJson } from "@/lib/http";
import { requireApiAdmin, requireApiUser } from "@/lib/auth/guards";
import { idSchema, saveLeaveTypeSchema } from "@/lib/schemas";
import type { NextRequest } from "next/server";
import { deleteLeaveType, listLeaveTypes, saveLeaveType } from "./handlers";

export async function GET() {
  return handleRoute(async () => {
    await requireApiUser();
    const leaveTypes = await listLeaveTypes();

    return ApiResponse.send({ leaveTypes });
  });
}

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    await requireApiAdmin();
    const input = saveLeaveTypeSchema.parse(await parseJson(request));

    const [data, error] = await saveLeaveType(input);
    if (error) return ApiResponse.failed(error.status, error.message);

    return ApiResponse.send({ leaveType: data }, 201);
  });
}

export async function DELETE(request: NextRequest) {
  return handleRoute(async () => {
    await requireApiAdmin();
    const id = idSchema.parse(request.nextUrl.searchParams.get("id"));

    const [data] = await deleteLeaveType(id);

    return ApiResponse.send(data);
  });
}
