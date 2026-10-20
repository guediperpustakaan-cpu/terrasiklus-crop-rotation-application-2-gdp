import { z } from "zod";
import { db } from "@/db";
import { soilTests } from "@/db/schema";
import { getPlotDetail, plotExists } from "@/lib/queries";
import { analyzeSoilTest } from "@/lib/soil";
import { fail, ok, parseId, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  plotId: z.coerce.number().int().positive(),
  testedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal uji tidak valid"),
  ph: z.coerce.number().min(3).max(10),
  n: z.coerce.number().min(0).max(300),
  p: z.coerce.number().min(0).max(300),
  k: z.coerce.number().min(0).max(300),
  organicMatter: z.coerce.number().min(0).max(30),
  notes: z.string().trim().max(400).optional().nullable(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const plotId = parseId(url.searchParams.get("plotId") ?? undefined);
  const detail = plotId ? await getPlotDetail(plotId) : null;
  if (plotId && !detail) return fail("Petak tidak ditemukan", 404);
  const tests = detail ? detail.soilTests : [];
  return ok({ soilTests: tests, analysis: analyzeSoilTest(detail?.plot.latestSoilTest ?? null) });
}

export async function POST(request: Request) {
  const body = await readJson<unknown>(request);
  const parsed = createSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data uji tanah tidak valid", 422);
  }
  const data = parsed.data;
  if (!(await plotExists(data.plotId))) return fail("Petak tidak ditemukan", 404);

  const [row] = await db
    .insert(soilTests)
    .values({
      plotId: data.plotId,
      testedOn: data.testedOn,
      ph: data.ph,
      n: data.n,
      p: data.p,
      k: data.k,
      organicMatter: data.organicMatter,
      notes: data.notes ?? null,
    })
    .returning({ id: soilTests.id });

  const detail = await getPlotDetail(data.plotId);
  const soilTest = detail?.soilTests.find((t) => t.id === row.id) ?? null;
  return ok({ soilTest, analysis: analyzeSoilTest(soilTest) }, 201);
}
