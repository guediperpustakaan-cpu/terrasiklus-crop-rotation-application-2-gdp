import { sql } from "drizzle-orm";
import { db } from "@/db";
import { crops, farms, plantFamilies, plantings, plots, profiles, soilTests } from "@/db/schema";

/** Data referensi keluarga botani & katalog tanaman (bahasa Indonesia). */
const FAMILY_SEED = [
  { name: "Solanaceae", localName: "Terung-terungan", isNitrogenFixer: false, notes: "Pemakai hara berat, rentan penyakit tanah jika ditanam berulang." },
  { name: "Fabaceae", localName: "Polong-polongan", isNitrogenFixer: true, notes: "Legumen: mengikat nitrogen dari udara dan memperbaiki struktur tanah." },
  { name: "Brassicaceae", localName: "Kubis-kubisan", isNitrogenFixer: false, notes: "Sangat rakus nitrogen, rentan clubroot bila berulang." },
  { name: "Cucurbitaceae", localName: "Labu-labuan", isNitrogenFixer: false, notes: "Butuh ruang luas dan bahan organik banyak." },
  { name: "Amaryllidaceae", localName: "Bawang-bawangan", isNitrogenFixer: false, notes: "Bagus sebagai pemutus siklus hama tanah." },
  { name: "Apiaceae", localName: "Umbi-umbian berdaun", isNitrogenFixer: false, notes: "Akar tunggang dalam, membantu melonggarkan tanah." },
  { name: "Asteraceae", localName: "Kenikir-kenikiran", isNitrogenFixer: false, notes: "Umumnya berumur pendek dan ringan hara." },
  { name: "Amaranthaceae", localName: "Bayam-bayaman", isNitrogenFixer: false, notes: "Cepat tumbuh, cocok untuk masa pemulihan tanah." },
  { name: "Poaceae", localName: "Rumput-rumputan", isNitrogenFixer: false, notes: "Jagung termasuk pemakai nitrogen berat." },
  { name: "Lamiaceae", localName: "Nilam & kemangi", isNitrogenFixer: false, notes: "Menghasilkan senyawa aromatik yang menolak beberapa hama." },
  { name: "Malvaceae", localName: "Kapasan", isNitrogenFixer: false, notes: "Tahan panas, cocok musim kemarau." },
  { name: "Zingiberaceae", localName: "Empon-empon", isNitrogenFixer: false, notes: "Rimpang, butuh tanah gembur dan drainase baik." },
] as const;

const CROP_SEED: Array<{
  commonName: string;
  family: string;
  nutrientDemand: "rendah" | "sedang" | "tinggi";
  growthDays: number;
  idealPhMin: number;
  idealPhMax: number;
  notes: string;
}> = [
  { commonName: "Tomat", family: "Solanaceae", nutrientDemand: "tinggi", growthDays: 90, idealPhMin: 5.5, idealPhMax: 6.8, notes: "Pemakai kalium tinggi, awasi busuk buah ujung." },
  { commonName: "Cabai Merah", family: "Solanaceae", nutrientDemand: "tinggi", growthDays: 120, idealPhMin: 5.5, idealPhMax: 6.8, notes: "Sensitif kekurangan kalsium dan layu bakteri." },
  { commonName: "Terong", family: "Solanaceae", nutrientDemand: "sedang", growthDays: 100, idealPhMin: 5.5, idealPhMax: 6.8, notes: "Cocok diikuti legum untuk memulihkan nitrogen." },
  { commonName: "Kentang", family: "Solanaceae", nutrientDemand: "tinggi", growthDays: 110, idealPhMin: 5.0, idealPhMax: 6.2, notes: "Hindari berturut-turut, risiko hama penggerek sangat tinggi." },
  { commonName: "Kacang Panjang", family: "Fabaceae", nutrientDemand: "rendah", growthDays: 55, idealPhMin: 6.0, idealPhMax: 7.0, notes: "Legumen penambah nitrogen, panen cepat." },
  { commonName: "Buncis Tegak", family: "Fabaceae", nutrientDemand: "rendah", growthDays: 65, idealPhMin: 6.0, idealPhMax: 7.0, notes: "Menyisakan nitrogen untuk tanaman berikutnya." },
  { commonName: "Kacang Tanah", family: "Fabaceae", nutrientDemand: "rendah", growthDays: 100, idealPhMin: 5.5, idealPhMax: 6.5, notes: "Bagus sebagai pemulih lahan setelah sayuran daun." },
  { commonName: "Kedelai", family: "Fabaceae", nutrientDemand: "rendah", growthDays: 95, idealPhMin: 6.0, idealPhMax: 7.0, notes: "Legumen penutup tanah, menekan erosi." },
  { commonName: "Kacang Hijau", family: "Fabaceae", nutrientDemand: "rendah", growthDays: 60, idealPhMin: 6.0, idealPhMax: 7.2, notes: "Siklus pendek, ideal untuk selingan rotasi." },
  { commonName: "Kubis", family: "Brassicaceae", nutrientDemand: "tinggi", growthDays: 90, idealPhMin: 6.0, idealPhMax: 7.0, notes: "Rakus nitrogen, awasi akar gada." },
  { commonName: "Brokoli", family: "Brassicaceae", nutrientDemand: "tinggi", growthDays: 85, idealPhMin: 6.0, idealPhMax: 7.2, notes: "Butuh boron cukup." },
  { commonName: "Kembang Kol", family: "Brassicaceae", nutrientDemand: "tinggi", growthDays: 90, idealPhMin: 6.0, idealPhMax: 7.2, notes: "Peka terhadap keasaman tinggi." },
  { commonName: "Sawi Hijau", family: "Brassicaceae", nutrientDemand: "sedang", growthDays: 45, idealPhMin: 6.0, idealPhMax: 7.5, notes: "Panen cepat, cocok musim peralihan." },
  { commonName: "Pakcoy", family: "Brassicaceae", nutrientDemand: "sedang", growthDays: 40, idealPhMin: 6.0, idealPhMax: 7.5, notes: "Ideal untuk pot dan petak kecil." },
  { commonName: "Timun", family: "Cucurbitaceae", nutrientDemand: "sedang", growthDays: 60, idealPhMin: 5.5, idealPhMax: 6.8, notes: "Cepat panen, butuh bahan organik banyak." },
  { commonName: "Labu Siam", family: "Cucurbitaceae", nutrientDemand: "sedang", growthDays: 150, idealPhMin: 5.5, idealPhMax: 6.8, notes: "Perlu ajir kuat, produksi daun untuk kompos." },
  { commonName: "Semangka", family: "Cucurbitaceae", nutrientDemand: "tinggi", growthDays: 85, idealPhMin: 5.8, idealPhMax: 6.8, notes: "Butuh kalium tinggi untuk rasa manis." },
  { commonName: "Melon", family: "Cucurbitaceae", nutrientDemand: "tinggi", growthDays: 90, idealPhMin: 6.0, idealPhMax: 6.8, notes: "Peka terhadap kelembapan berlebih." },
  { commonName: "Pare", family: "Cucurbitaceae", nutrientDemand: "sedang", growthDays: 80, idealPhMin: 5.5, idealPhMax: 6.8, notes: "Tahan hama relatif, cocok musim hujan." },
  { commonName: "Bawang Merah", family: "Amaryllidaceae", nutrientDemand: "sedang", growthDays: 70, idealPhMin: 5.5, idealPhMax: 6.5, notes: "Pemutus siklus hama tanah yang baik." },
  { commonName: "Bawang Putih", family: "Amaryllidaceae", nutrientDemand: "sedang", growthDays: 100, idealPhMin: 5.5, idealPhMax: 6.5, notes: "Butuh musim kering untuk pembentukan umbi." },
  { commonName: "Bawang Daun", family: "Amaryllidaceae", nutrientDemand: "rendah", growthDays: 60, idealPhMin: 6.0, idealPhMax: 7.0, notes: "Dapat dipanen bertahap." },
  { commonName: "Wortel", family: "Apiaceae", nutrientDemand: "sedang", growthDays: 90, idealPhMin: 5.5, idealPhMax: 6.8, notes: "Tanah gembung wajib agar akar lurus." },
  { commonName: "Seledri", family: "Apiaceae", nutrientDemand: "sedang", growthDays: 80, idealPhMin: 6.0, idealPhMax: 7.0, notes: "Butuh air konsisten." },
  { commonName: "Adas", family: "Apiaceae", nutrientDemand: "rendah", growthDays: 85, idealPhMin: 6.0, idealPhMax: 7.0, notes: "Menarik serangga penyerbuk." },
  { commonName: "Selada", family: "Asteraceae", nutrientDemand: "rendah", growthDays: 45, idealPhMin: 6.0, idealPhMax: 7.0, notes: "Baik setelah tanaman rakus hara." },
  { commonName: "Kenikir", family: "Asteraceae", nutrientDemand: "rendah", growthDays: 50, idealPhMin: 5.5, idealPhMax: 7.0, notes: "Mengusir beberapa nematoda tanah." },
  { commonName: "Bayam", family: "Amaranthaceae", nutrientDemand: "sedang", growthDays: 35, idealPhMin: 6.0, idealPhMax: 7.0, notes: "Sangat cepat, bagus untuk selingan." },
  { commonName: "Bit Merah", family: "Amaranthaceae", nutrientDemand: "sedang", growthDays: 70, idealPhMin: 6.0, idealPhMax: 7.5, notes: "Butuh boron, peka asam." },
  { commonName: "Jagung Manis", family: "Poaceae", nutrientDemand: "tinggi", growthDays: 85, idealPhMin: 5.8, idealPhMax: 7.0, notes: "Pemakai nitrogen besar, pasangan legum." },
  { commonName: "Sorghum", family: "Poaceae", nutrientDemand: "sedang", growthDays: 100, idealPhMin: 5.5, idealPhMax: 7.0, notes: "Tahan kering, bagus penutup tanah." },
  { commonName: "Kemangi", family: "Lamiaceae", nutrientDemand: "rendah", growthDays: 40, idealPhMin: 6.0, idealPhMax: 7.0, notes: "Aromatik, menolak beberapa hama." },
  { commonName: "Mint", family: "Lamiaceae", nutrientDemand: "rendah", growthDays: 60, idealPhMin: 6.0, idealPhMax: 7.0, notes: "Perlu wadah terbatas agar tidak invasif." },
  { commonName: "Okra", family: "Malvaceae", nutrientDemand: "sedang", growthDays: 60, idealPhMin: 6.0, idealPhMax: 7.5, notes: "Tahan panas, panen berulang." },
  { commonName: "Rosella", family: "Malvaceae", nutrientDemand: "sedang", growthDays: 120, idealPhMin: 5.5, idealPhMax: 6.8, notes: "Kelopak untuk teh, cocok musim kemarau." },
  { commonName: "Jahe", family: "Zingiberaceae", nutrientDemand: "sedang", growthDays: 240, idealPhMin: 5.5, idealPhMax: 6.5, notes: "Butuh naungan sebagian dan drainase baik." },
  { commonName: "Kunyit", family: "Zingiberaceae", nutrientDemand: "sedang", growthDays: 240, idealPhMin: 5.5, idealPhMax: 6.5, notes: "Rimpang kuat, perlu tanah gembur." },
  { commonName: "Lengkuas", family: "Zingiberaceae", nutrientDemand: "rendah", growthDays: 210, idealPhMin: 5.5, idealPhMax: 6.8, notes: "Tahan genangan ringan." },
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

async function seedReferenceData(): Promise<void> {
  const existing = await db.select({ id: plantFamilies.id }).from(plantFamilies).limit(1);
  if (existing.length > 0) return;

  const insertedFamilies = await db
    .insert(plantFamilies)
    .values(
      FAMILY_SEED.map((f) => ({
        name: f.name,
        localName: f.localName,
        isNitrogenFixer: f.isNitrogenFixer,
        notes: f.notes,
      })),
    )
    .onConflictDoNothing()
    .returning({ id: plantFamilies.id, name: plantFamilies.name });

  const familyMap = new Map(insertedFamilies.map((f) => [f.name, f.id]));
  if (familyMap.size === 0) return;

  const rows = CROP_SEED.map((c) => ({
    commonName: c.commonName,
    familyId: familyMap.get(c.family)!,
    nutrientDemand: c.nutrientDemand,
    growthDays: c.growthDays,
    idealPhMin: c.idealPhMin,
    idealPhMax: c.idealPhMax,
    notes: c.notes,
  })).filter((row) => Number.isFinite(row.familyId));

  await db.insert(crops).values(rows).onConflictDoNothing();
}

async function seedDemoGarden(): Promise<void> {
  const existingFarm = await db.select({ id: farms.id }).from(farms).limit(1);
  if (existingFarm.length > 0) return;

  const [profile] = await db
    .insert(profiles)
    .values({ username: "petani-terrasiklus" })
    .onConflictDoNothing()
    .returning({ id: profiles.id });

  let ownerId = profile?.id;
  if (!ownerId) {
    const found = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(sql`${profiles.username} = 'petani-terrasiklus'`)
      .limit(1);
    ownerId = found[0]?.id;
  }
  if (!ownerId) return;

  const [farm] = await db
    .insert(farms)
    .values({ ownerId, name: "Kebun Rumah Pak Budi", location: "Bandung, Jawa Barat" })
    .returning({ id: farms.id });
  if (!farm) return;

  const [petakA, petakB, petakC] = await db
    .insert(plots)
    .values([
      { farmId: farm.id, name: "Petak A — Sayuran Buah", area: 24, soilType: "lempung berpasir", notes: "Dekat sumur, penyiraman mudah." },
      { farmId: farm.id, name: "Petak B — Sayuran Daun", area: 18, soilType: "humus", notes: "Naikan bahan organik tiap musim." },
      { farmId: farm.id, name: "Petak C — Umbi & Rimpang", area: 30, soilType: "andosol", notes: "Tanah gembur, drainase baik." },
    ])
    .returning({ id: plots.id });
  if (!petakA || !petakB || !petakC) return;

  const cropRows = await db
    .select({ id: crops.id, commonName: crops.commonName })
    .from(crops);
  const cropId = (name: string) => cropRows.find((c) => c.commonName === name)?.id;

  const plantingValues = [
    // Petak A: tomat (Solanaceae) sudah panen, lalu cabai aktif
    {
      plotId: petakA.id,
      cropId: cropId("Tomat"),
      plantedOn: isoDaysAgo(230),
      harvestedOn: isoDaysAgo(140),
      notes: "Sebagian buah berujung hitam, diduga kekurangan kalsium.",
    },
    {
      plotId: petakA.id,
      cropId: cropId("Cabai Merah"),
      plantedOn: isoDaysAgo(120),
      harvestedOn: null,
      notes: "Disemprot ramuan nabati tiap 5 hari.",
    },
    // Petak B: kubis panen, sawi panen, buncis aktif
    {
      plotId: petakB.id,
      cropId: cropId("Kubis"),
      plantedOn: isoDaysAgo(200),
      harvestedOn: isoDaysAgo(115),
      notes: "Ada gejala akar gada pada 2 tanaman.",
    },
    {
      plotId: petakB.id,
      cropId: cropId("Sawi Hijau"),
      plantedOn: isoDaysAgo(110),
      harvestedOn: isoDaysAgo(70),
      notes: "Panen normal, daun bersih.",
    },
    {
      plotId: petakB.id,
      cropId: cropId("Buncis Tegak"),
      plantedOn: isoDaysAgo(52),
      harvestedOn: null,
      notes: "Panen perdana sudah dimulai.",
    },
    // Petak C: wortel panen, petak sedang kosong
    {
      plotId: petakC.id,
      cropId: cropId("Wortel"),
      plantedOn: isoDaysAgo(190),
      harvestedOn: isoDaysAgo(95),
      notes: "Akar sedikit bercabang, tanah perlu digemburkan lagi.",
    },
  ].filter((row): row is { plotId: number; cropId: number; plantedOn: string; harvestedOn: string | null; notes: string } =>
    Boolean(row.cropId),
  );

  if (plantingValues.length > 0) {
    await db.insert(plantings).values(plantingValues);
  }

  await db.insert(soilTests).values([
    {
      plotId: petakA.id,
      testedOn: isoDaysAgo(35),
      ph: 6.2,
      n: 42,
      p: 28,
      k: 55,
      organicMatter: 3.1,
      notes: "Fosfor mulai turun, rencana tambahkan pupuk kandang matang.",
    },
    {
      plotId: petakB.id,
      testedOn: isoDaysAgo(150),
      ph: 6.6,
      n: 61,
      p: 47,
      k: 52,
      organicMatter: 4.4,
      notes: "Setelah legum ditanam, nitrogen naik.",
    },
    {
      plotId: petakC.id,
      testedOn: isoDaysAgo(20),
      ph: 5.4,
      n: 22,
      p: 18,
      k: 30,
      organicMatter: 2.2,
      notes: "Tanah asam dan miskin hara, perlu kapur dolomit + kompos.",
    },
  ]);
}

let seedPromise: Promise<void> | null = null;

/** Menjamin data referensi & kebun contoh tersedia (idempotent). */
export function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      await seedReferenceData();
      await seedDemoGarden();
    })().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}
