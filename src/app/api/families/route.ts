import { getFamilies } from "@/lib/queries";
import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const families = await getFamilies();
  return ok({ families });
}
