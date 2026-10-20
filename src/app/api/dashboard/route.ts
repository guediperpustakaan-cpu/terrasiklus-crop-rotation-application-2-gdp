import { getDashboard } from "@/lib/queries";
import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const dashboard = await getDashboard();
  return ok(dashboard);
}
