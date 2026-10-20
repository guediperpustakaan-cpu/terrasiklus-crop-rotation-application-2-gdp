import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { plots } from "@/db/schema";
import { deletePlotCascade, getPlotDetail } from "@/lib/queries";
import { fail, ok, parseId, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  area: z.coerce.number().min(0).max(100000).optional(),
  areaUnit: z.enum(["m2", "hektar", "pot"]).optional(),
  soilType: z.string().trim().min(2).max(40).optional(),
  notes: z.string().trim().max(400).nullable().optional(),
});

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const plotId = parseId(id);
  if (!plotId) return fail("ID petak tidak valid", 400);
  const detail = await getPlotDetail(plotId);
  if (!detail) return fail("Petak tidak ditemukan", 404);
  return ok(detail);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const plotId = parseId(id);
  if (!plotId) return fail("ID petak tidak valid", 400);
  const body = await readJson<unknown>(request);
  const parsed = patchSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data petak tidak valid", 422);
  }
  if (Object.keys(parsed.data).length === 0) return fail("Tidak ada perubahan", 422);

  await db.update(plots).set(parsed.data).where(eq(plots.id, plotId));
  const detail = await getPlotDetail(plotId);
  if (!detail) return fail("Petak tidak ditemukan", 404);
  return ok(detail);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const plotId = parseId(id);
  if (!plotId) return fail("ID petak tidak valid", 400);
  const detail = await getPlotDetail(plotId);
  if (!detail) return fail("Petak tidak ditemukan", 404);
  await deletePlotCascade(plotId);
  return ok({ deleted: true, id: plotId });
}
