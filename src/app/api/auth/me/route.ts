import { ApiResponse, handleRoute } from "@/lib/http";
import { me } from "./handlers";

export async function GET() {
  return handleRoute(async () => {
    const [data, error] = await me();
    if (error) return ApiResponse.failed(error.status, error.message);

    return ApiResponse.send({ user: data });
  });
}
