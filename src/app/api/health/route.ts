import { sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureSeeded } from "@/db/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    let seeded = false;
    try {
      await ensureSeeded();
      seeded = true;
    } catch {
      seeded = false;
    }
    return Response.json({ ok: true, app: "TerraSiklus", seeded });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
