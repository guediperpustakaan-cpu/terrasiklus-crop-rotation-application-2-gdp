import { z } from "zod";
import { ensureFarmForOwner, getFarms } from "@/lib/queries";
import { fail, ok, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(2, "Nama kebun minimal 2 karakter").max(80),
  location: z.string().trim().max(120).optional().nullable(),
});

export async function GET() {
  const farms = await getFarms();
  return ok({ farms });
}

export async function POST(request: Request) {
  const body = await readJson<unknown>(request);
  const parsed = createSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data kebun tidak valid", 422);
  }
  const farm = await ensureFarmForOwner(parsed.data.name, parsed.data.location ?? null);
  return ok({ farm }, 201);
}
