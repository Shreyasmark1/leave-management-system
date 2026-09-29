import { ApiResponse, handleRoute } from "@/lib/http";
import { requireApiUser } from "@/lib/auth/guards";
import { logout } from "./handlers";

export async function POST() {
  return handleRoute(async () => {
    await requireApiUser();

    const [data] = await logout();

    return ApiResponse.send(data);
  });
}
