import { z } from "zod";
import { db } from "@/db";
import { plots } from "@/db/schema";
import { farmExists, getPlots } from "@/lib/queries";
import { fail, ok, parseId, readJson } from "@/lib/http";
import { SOIL_TYPES } from "@/lib/types";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  farmId: z.coerce.number().int().positive(),
  name: z.string().trim().min(2, "Nama petak minimal 2 karakter").max(80),
  area: z.coerce.number().min(0).max(100000),
  areaUnit: z.enum(["m2", "hektar", "pot"]).default("m2"),
  soilType: z.string().trim().min(2).max(40),
  notes: z.string().trim().max(400).optional().nullable(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const farmId = parseId(url.searchParams.get("farmId") ?? undefined);
  const plots = await getPlots(farmId ?? undefined);
  return ok({ plots, soilTypes: SOIL_TYPES });
}

export async function POST(request: Request) {
  const body = await readJson<unknown>(request);
  const parsed = createSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data petak tidak valid", 422);
  }
  const data = parsed.data;
  if (!(await farmExists(data.farmId))) {
    return fail("Kebun tidak ditemukan", 404);
  }
  const [row] = await db
    .insert(plots)
    .values({
      farmId: data.farmId,
      name: data.name,
      area: data.area,
      areaUnit: data.areaUnit,
      soilType: data.soilType,
      notes: data.notes ?? null,
    })
    .returning({ id: plots.id });

  const all = await getPlots();
  const plot = all.find((p) => p.id === row.id);
  return ok({ plot }, 201);
}
