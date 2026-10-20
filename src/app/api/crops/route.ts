import { getCrops } from "@/lib/queries";
import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const crops = await getCrops();
  return ok({ crops });
}
