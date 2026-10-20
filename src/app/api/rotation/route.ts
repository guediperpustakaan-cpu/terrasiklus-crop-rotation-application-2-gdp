import { getRotationAnalysisForPlot } from "@/lib/queries";
import { fail, ok, parseId } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const plotId = parseId(url.searchParams.get("plotId") ?? undefined);
  if (!plotId) return fail("Parameter plotId wajib diisi", 400);
  const analysis = await getRotationAnalysisForPlot(plotId);
  if (!analysis) return fail("Petak tidak ditemukan", 404);
  return ok({ analysis });
}
