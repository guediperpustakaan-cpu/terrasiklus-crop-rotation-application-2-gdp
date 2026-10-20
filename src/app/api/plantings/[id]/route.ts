import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { plantings } from "@/db/schema";
import { getPlotDetail } from "@/lib/queries";
import { fail, ok, parseId, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  harvestedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal panen tidak valid")
    .nullable()
    .optional(),
  notes: z.string().trim().max(400).nullable().optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const plantingId = parseId(id);
  if (!plantingId) return fail("ID catatan tanam tidak valid", 400);
  const body = await readJson<unknown>(request);
  const parsed = patchSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data tidak valid", 422);
  }

  const existing = await db
    .select({ id: plantings.id, plotId: plantings.plotId, plantedOn: plantings.plantedOn })
    .from(plantings)
    .where(eq(plantings.id, plantingId))
    .limit(1);
  if (existing.length === 0) return fail("Catatan tanam tidak ditemukan", 404);

  const harvestedOn = parsed.data.harvestedOn;
  if (harvestedOn && harvestedOn < existing[0].plantedOn) {
    return fail("Tanggal panen tidak boleh sebelum tanggal tanam", 422);
  }

  await db
    .update(plantings)
    .set({
      ...(harvestedOn !== undefined ? { harvestedOn } : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
    })
    .where(eq(plantings.id, plantingId));

  const updated = await getPlotDetail(existing[0].plotId);
  const planting = updated?.plantings.find((p) => p.id === plantingId) ?? null;
  return ok({ planting, plot: updated?.plot ?? null });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const plantingId = parseId(id);
  if (!plantingId) return fail("ID catatan tanam tidak valid", 400);
  await db.delete(plantings).where(eq(plantings.id, plantingId));
  return ok({ deleted: true, id: plantingId });
}
