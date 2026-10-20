import { z } from "zod";
import { db } from "@/db";
import { plantings } from "@/db/schema";
import { evaluatePlanting } from "@/lib/rotation";
import { findCropById, getPlotDetail, plotExists } from "@/lib/queries";
import { fail, ok, parseId, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  plotId: z.coerce.number().int().positive(),
  cropId: z.coerce.number().int().positive(),
  plantedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tanam tidak valid"),
  notes: z.string().trim().max(400).optional().nullable(),
  force: z.boolean().optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const plotId = parseId(url.searchParams.get("plotId") ?? undefined);
  const detail = plotId ? await getPlotDetail(plotId) : null;
  if (plotId && !detail) return fail("Petak tidak ditemukan", 404);
  const plantings = detail ? detail.plantings : [];
  return ok({ plantings });
}

export async function POST(request: Request) {
  const body = await readJson<unknown>(request);
  const parsed = createSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data tanam tidak valid", 422);
  }
  const { plotId, cropId, plantedOn, notes, force } = parsed.data;

  if (!(await plotExists(plotId))) return fail("Petak tidak ditemukan", 404);
  const crop = await findCropById(cropId);
  if (!crop) return fail("Tanaman tidak ditemukan", 404);

  const detail = (await getPlotDetail(plotId))!;
  const active = detail.plot.activePlanting;
  if (active) {
    return fail(
      `Petak ${detail.plot.name} masih ditanami ${active.cropName} (sejak ${active.plantedOn}). Catat panen terlebih dahulu sebelum menanam lagi.`,
      409,
      { code: "ACTIVE_PLANTING" },
    );
  }

  const evaluation = evaluatePlanting(crop, detail.plantings, plantedOn);
  if (evaluation.level === "berbahaya" && !force) {
    return fail(evaluation.message, 409, { code: "ROTATION_RISK", evaluation });
  }

  const [row] = await db
    .insert(plantings)
    .values({ plotId, cropId, plantedOn, notes: notes ?? null })
    .returning({ id: plantings.id });

  const updated = await getPlotDetail(plotId);
  const planting = updated?.plantings.find((p) => p.id === row.id) ?? null;
  return ok({ planting, evaluation }, 201);
}
