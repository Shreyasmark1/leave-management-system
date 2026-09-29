import { ApiResponse, handleRoute, parseJson } from "@/lib/http";
import { loginRequestSchema } from "@/lib/schemas";
import type { NextRequest } from "next/server";
import { login } from "./handlers";

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const input = loginRequestSchema.parse(await parseJson(request));

    const [data, error] = await login(input);
    if (error) return ApiResponse.failed(error.status, error.message);

    return ApiResponse.send({ user: data });
  });
}
