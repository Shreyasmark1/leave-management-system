import { ApiResponse, handleRoute, parseJson } from "@/lib/http";
import { requireApiAdmin, requireApiUser } from "@/lib/auth/guards";
import { idSchema, saveLeaveRequestSchema } from "@/lib/schemas";
import type { NextRequest } from "next/server";
import {
  deleteLeaveRequest,
  listLeaveRequestsFor,
  saveLeaveRequest,
} from "./handlers";

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const session = await requireApiUser();
    const [requests, error] = await listLeaveRequestsFor(request, session);
    if (error) return ApiResponse.failed(error.status, error.message);

    return ApiResponse.send({ requests });
  });
}

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const session = await requireApiUser();
    const input = saveLeaveRequestSchema.parse(await parseJson(request));

    const [data, error] = await saveLeaveRequest(input, session);
    if (error) return ApiResponse.failed(error.status, error.message);

    return ApiResponse.send({ request: data }, 201);
  });
}

export async function DELETE(request: NextRequest) {
  return handleRoute(async () => {
    await requireApiAdmin();
    const id = idSchema.parse(request.nextUrl.searchParams.get("id"));

    const [data] = await deleteLeaveRequest(id);

    return ApiResponse.send(data);
  });
}
