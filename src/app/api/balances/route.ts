import { ApiResponse, handleRoute } from "@/lib/http";
import { requireApiUser } from "@/lib/auth/guards";
import type { NextRequest } from "next/server";
import { listBalancesFor } from "./handlers";

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const session = await requireApiUser();
    const [data, error] = await listBalancesFor(request, session);
    if (error) return ApiResponse.failed(error.status, error.message);

    return ApiResponse.send(data);
  });
}
