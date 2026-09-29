import { ApiResponse, handleRoute, parseJson } from "@/lib/http";
import { requireApiAdmin } from "@/lib/auth/guards";
import { idSchema, saveUserSchema } from "@/lib/schemas";
import type { NextRequest } from "next/server";
import { deleteUser, getUser, listUsers, saveUser } from "./handlers";

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    await requireApiAdmin();
    const rawId = request.nextUrl.searchParams.get("id");

    if (!rawId) {
      const [data] = await listUsers();

      return ApiResponse.send({ users: data });
    }

    const id = idSchema.parse(rawId);
    const [data, error] = await getUser(id);
    if (error) return ApiResponse.failed(error.status, error.message);

    return ApiResponse.send({ user: data });
  });
}

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const session = await requireApiAdmin();
    const input = saveUserSchema.parse(await parseJson(request));

    const [data, error] = await saveUser(input, session);
    if (error) return ApiResponse.failed(error.status, error.message);

    return ApiResponse.send({ user: data }, 201);
  });
}

export async function DELETE(request: NextRequest) {
  return handleRoute(async () => {
    const session = await requireApiAdmin();
    const id = idSchema.parse(request.nextUrl.searchParams.get("id"));

    const [data, error] = await deleteUser(id, session);
    if (error) return ApiResponse.failed(error.status, error.message);

    return ApiResponse.send(data);
  });
}
