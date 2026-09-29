import { ApiResponse, handleRoute } from "@/lib/http";
import { requireApiAdmin } from "@/lib/auth/guards";
import { getAdminStats } from "./handlers";

export async function GET() {
  return handleRoute(async () => {
    await requireApiAdmin();
    const stats = await getAdminStats();

    return ApiResponse.send({ stats });
  });
}
