import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { crops, farms, plantFamilies, plantings, plots, profiles, soilTests } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { buildRotationAnalysis } from "@/lib/rotation";
import { analyzeSoilTest } from "@/lib/soil";
import { monthsBetween, todayIso } from "@/lib/rotation";
import type {
  CropDto,
  DashboardDto,
  FarmDto,
  FamilyDto,
  NextAction,
  NutrientDemand,
  PlotDetailDto,
  PlotDto,
  PlantingDto,
  SoilTestDto,
} from "@/lib/types";

const DEMO_USERNAME = "petani-terrasiklus";

export async function getDefaultFarm(): Promise<FarmDto | null> {
  await ensureSeeded();
  const list = await getFarms();
  return list[0] ?? null;
}

export async function getFarms(): Promise<FarmDto[]> {
  await ensureSeeded();
  const rows = await db
    .select({
      id: farms.id,
      name: farms.name,
      location: farms.location,
      createdAt: farms.createdAt,
      plotId: plots.id,
      area: plots.area,
      areaUnit: plots.areaUnit,
    })
    .from(farms)
    .leftJoin(plots, eq(plots.farmId, farms.id))
    .orderBy(asc(farms.id));

  const map = new Map<number, FarmDto>();
  for (const row of rows) {
    const existing = map.get(row.id);
    if (!existing) {
      map.set(row.id, {
        id: row.id,
        name: row.name,
        location: row.location,
        createdAt: row.createdAt.toISOString(),
        plotCount: 0,
        totalArea: 0,
        areaUnit: row.areaUnit ?? "m2",
      });
    }
    if (row.plotId != null) {
      const farm = map.get(row.id)!;
      farm.plotCount += 1;
      farm.totalArea += row.area ?? 0;
    }
  }
  return [...map.values()];
}

export async function ensureFarmForOwner(name: string, location: string | null): Promise<FarmDto> {
  await ensureSeeded();
  const owner = await getOrCreateProfile();
  const [row] = await db
    .insert(farms)
    .values({ ownerId: owner.id, name, location })
    .returning();
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    createdAt: row.createdAt.toISOString(),
    plotCount: 0,
    totalArea: 0,
    areaUnit: "m2",
  };
}

async function getOrCreateProfile(): Promise<{ id: number; username: string }> {
  const found = await db
    .select({ id: profiles.id, username: profiles.username })
    .from(profiles)
    .where(eq(profiles.username, DEMO_USERNAME))
    .limit(1);
  if (found[0]) return found[0];
  const [created] = await db
    .insert(profiles)
    .values({ username: DEMO_USERNAME })
    .onConflictDoNothing()
    .returning({ id: profiles.id, username: profiles.username });
  if (created) return created;
  const again = await db
    .select({ id: profiles.id, username: profiles.username })
    .from(profiles)
    .where(eq(profiles.username, DEMO_USERNAME))
    .limit(1);
  return again[0]!;
}

export async function getCrops(): Promise<CropDto[]> {
  await ensureSeeded();
  const rows = await db
    .select({
      id: crops.id,
      commonName: crops.commonName,
      familyId: crops.familyId,
      nutrientDemand: crops.nutrientDemand,
      growthDays: crops.growthDays,
      idealPhMin: crops.idealPhMin,
      idealPhMax: crops.idealPhMax,
      notes: crops.notes,
      familyName: plantFamilies.name,
      familyLocalName: plantFamilies.localName,
      isNitrogenFixer: plantFamilies.isNitrogenFixer,
    })
    .from(crops)
    .innerJoin(plantFamilies, eq(crops.familyId, plantFamilies.id))
    .orderBy(asc(plantFamilies.name), asc(crops.commonName));

  return rows.map((row) => ({
    ...row,
    nutrientDemand: row.nutrientDemand as NutrientDemand,
  }));
}

export async function getFamilies(): Promise<FamilyDto[]> {
  await ensureSeeded();
  const rows = await db
    .select({
      id: plantFamilies.id,
      name: plantFamilies.name,
      localName: plantFamilies.localName,
      isNitrogenFixer: plantFamilies.isNitrogenFixer,
      notes: plantFamilies.notes,
      cropCount: crops.id,
    })
    .from(plantFamilies)
    .leftJoin(crops, eq(crops.familyId, plantFamilies.id))
    .orderBy(asc(plantFamilies.name));

  const map = new Map<number, FamilyDto>();
  for (const row of rows) {
    const existing = map.get(row.id);
    if (!existing) {
      map.set(row.id, {
        id: row.id,
        name: row.name,
        localName: row.localName,
        isNitrogenFixer: row.isNitrogenFixer,
        notes: row.notes,
        cropCount: 0,
      });
    } else if (row.cropCount != null) {
      existing.cropCount = (existing.cropCount ?? 0) + 1;
    }
  }
  return [...map.values()];
}

interface CoreData {
  plotRows: Array<{
    id: number;
    farmId: number;
    farmName: string;
    name: string;
    area: number;
    areaUnit: string;
    soilType: string;
    notes: string | null;
    createdAt: Date;
  }>;
  plantingRows: PlantingDto[];
  soilRows: SoilTestDto[];
}

async function loadCore(farmId?: number): Promise<CoreData> {
  await ensureSeeded();
  const plotSelect = db
    .select({
      id: plots.id,
      farmId: plots.farmId,
      farmName: farms.name,
      name: plots.name,
      area: plots.area,
      areaUnit: plots.areaUnit,
      soilType: plots.soilType,
      notes: plots.notes,
      createdAt: plots.createdAt,
    })
    .from(plots)
    .innerJoin(farms, eq(plots.farmId, farms.id))
    .$dynamic();

  const plotRows = await (farmId ? plotSelect.where(eq(plots.farmId, farmId)) : plotSelect);
  const plotIds = plotRows.map((p) => p.id);

  const rawPlantingRows =
    plotIds.length === 0
      ? []
      : await db
          .select({
            id: plantings.id,
            plotId: plantings.plotId,
            plotName: plots.name,
            cropId: crops.id,
            cropName: crops.commonName,
            familyId: plantFamilies.id,
            familyName: plantFamilies.name,
            isNitrogenFixer: plantFamilies.isNitrogenFixer,
            nutrientDemand: crops.nutrientDemand,
            growthDays: crops.growthDays,
            plantedOn: plantings.plantedOn,
            harvestedOn: plantings.harvestedOn,
            notes: plantings.notes,
          })
          .from(plantings)
          .innerJoin(crops, eq(plantings.cropId, crops.id))
          .innerJoin(plantFamilies, eq(crops.familyId, plantFamilies.id))
          .innerJoin(plots, eq(plantings.plotId, plots.id))
          .where(inArray(plantings.plotId, plotIds))
          .orderBy(desc(plantings.plantedOn));

  const soilRows: SoilTestDto[] =
    plotIds.length === 0
      ? []
      : await db
          .select({
            id: soilTests.id,
            plotId: soilTests.plotId,
            testedOn: soilTests.testedOn,
            ph: soilTests.ph,
            n: soilTests.n,
            p: soilTests.p,
            k: soilTests.k,
            organicMatter: soilTests.organicMatter,
            notes: soilTests.notes,
          })
          .from(soilTests)
          .where(inArray(soilTests.plotId, plotIds))
          .orderBy(desc(soilTests.testedOn));

  const plantingRows: PlantingDto[] = rawPlantingRows.map((row) => ({
    ...row,
    nutrientDemand: row.nutrientDemand as NutrientDemand,
  }));

  return { plotRows, plantingRows, soilRows };
}

function assemblePlots(core: CoreData): PlotDto[] {
  const today = todayIso();
  return core.plotRows.map((plot) => {
    const plotPlantings = core.plantingRows.filter((p) => p.plotId === plot.id);
    const sortedByRecency = [...plotPlantings].sort((a, b) => {
      const aEnd = a.harvestedOn ?? a.plantedOn;
      const bEnd = b.harvestedOn ?? b.plantedOn;
      return aEnd < bEnd ? 1 : aEnd > bEnd ? -1 : 0;
    });
    const soil = core.soilRows.find((s) => s.plotId === plot.id) ?? null;
    return {
      id: plot.id,
      farmId: plot.farmId,
      farmName: plot.farmName,
      name: plot.name,
      area: plot.area,
      areaUnit: plot.areaUnit,
      soilType: plot.soilType,
      notes: plot.notes,
      createdAt: plot.createdAt.toISOString(),
      activePlanting: plotPlantings.find((p) => !p.harvestedOn && p.plantedOn <= today) ?? null,
      lastCompleted: sortedByRecency.find((p) => p.harvestedOn) ?? null,
      soilTestCount: core.soilRows.filter((s) => s.plotId === plot.id).length,
      plantingCount: plotPlantings.length,
      latestSoilTest: soil,
    };
  });
}

export async function getPlots(farmId?: number): Promise<PlotDto[]> {
  const core = await loadCore(farmId);
  return assemblePlots(core);
}

export async function getPlotDetail(plotId: number): Promise<PlotDetailDto | null> {
  const core = await loadCore();
  const plot = assemblePlots(core).find((p) => p.id === plotId);
  if (!plot) return null;
  return {
    plot,
    plantings: core.plantingRows.filter((p) => p.plotId === plotId),
    soilTests: core.soilRows.filter((s) => s.plotId === plotId),
  };
}

export async function getRotationAnalysisForPlot(plotId: number) {
  const [detail, cropList] = await Promise.all([getPlotDetail(plotId), getCrops()]);
  if (!detail) return null;
  return buildRotationAnalysis({
    plotId,
    plotName: detail.plot.name,
    crops: cropList,
    plantings: detail.plantings,
    soilTest: detail.plot.latestSoilTest,
  });
}

export async function getDashboard(): Promise<DashboardDto> {
  const core = await loadCore();
  const plotList = assemblePlots(core);
  const farmList = await getFarms();
  const today = todayIso();

  const activePlantings = plotList
    .map((plot) => ({ plot, planting: plot.activePlanting }))
    .filter((entry): entry is { plot: PlotDto; planting: PlantingDto } => Boolean(entry.planting))
    .map(({ plot, planting }) => {
      const daysPlanted = Math.round(monthsBetween(planting.plantedOn, today) * 30.44);
      const expected = new Date(`${planting.plantedOn}T00:00:00Z`);
      expected.setUTCDate(expected.getUTCDate() + planting.growthDays);
      return {
        ...planting,
        area: plot.area,
        areaUnit: plot.areaUnit,
        daysPlanted,
        expectedHarvest: expected.toISOString().slice(0, 10),
      };
    })
    .sort((a, b) => a.expectedHarvest.localeCompare(b.expectedHarvest));

  const soilScores = plotList
    .map((plot) => ({ plot, analysis: analyzeSoilTest(plot.latestSoilTest) }))
    .filter((entry) => entry.analysis !== null);
  const avgSoilScore =
    soilScores.length > 0
      ? Math.round(soilScores.reduce((sum, entry) => sum + (entry.analysis?.score ?? 0), 0) / soilScores.length)
      : null;

  const nextActions: NextAction[] = [];

  for (const item of activePlantings) {
    const expectedDate = new Date(`${item.expectedHarvest}T00:00:00Z`).getTime();
    const now = new Date(`${today}T00:00:00Z`).getTime();
    const diffDays = Math.round((now - expectedDate) / 86_400_000);
    if (diffDays >= 0) {
      nextActions.push({
        id: `panen-${item.id}`,
        kind: "panen",
        title: `Waktunya panen ${item.cropName} di ${item.plotName}`,
        detail:
          diffDays === 0
            ? "Perkiraan panen hari ini. Catat hasil panen agar riwayat rotasi lengkap."
            : `Perkiraan panen sudah lewat ${diffDays} hari. Segera panen dan catat hasilnya.`,
        priority: diffDays > 7 ? 1 : 2,
        plotId: item.plotId,
        plotName: item.plotName,
      });
    } else if (diffDays >= -14) {
      nextActions.push({
        id: `panen-mendatang-${item.id}`,
        kind: "panen",
        title: `Panen ${item.cropName} di ${item.plotName} dalam ${Math.abs(diffDays)} hari`,
        detail: "Siapkan alat panen dan mulsa untuk musim berikutnya.",
        priority: 4,
        plotId: item.plotId,
        plotName: item.plotName,
      });
    }
  }

  for (const plot of plotList) {
    if (!plot.activePlanting) {
      nextActions.push({
        id: `tanam-${plot.id}`,
        kind: "tanam",
        title: `${plot.name} sedang kosong`,
        detail: plot.lastCompleted
          ? `Terakhir ${plot.lastCompleted.cropName} (${plot.lastCompleted.familyName}). Rencanakan rotasi keluarga berbeda.`
          : "Belum ada riwayat tanam. Mulai dengan legum atau sayuran daun.",
        priority: 3,
        plotId: plot.id,
        plotName: plot.name,
      });
    }

    const analysis = analyzeSoilTest(plot.latestSoilTest);
    if (!plot.latestSoilTest) {
      nextActions.push({
        id: `uji-${plot.id}`,
        kind: "uji-tanah",
        title: `Belum ada uji tanah untuk ${plot.name}`,
        detail: "Catat pH, N, P, K, dan bahan organik agar rekomendasi rotasi akurat.",
        priority: 2,
        plotId: plot.id,
        plotName: plot.name,
      });
    } else {
      const months = monthsBetween(plot.latestSoilTest.testedOn, today);
      if (months >= 6) {
        nextActions.push({
          id: `uji-lama-${plot.id}`,
          kind: "uji-tanah",
          title: `Uji tanah ${plot.name} sudah ${Math.round(months)} bulan`,
          detail: "Perbarui hasil uji tanah agar rekomendasi hara tetap relevan.",
          priority: 3,
          plotId: plot.id,
          plotName: plot.name,
        });
      }
    }

    if (analysis && analysis.score < 50) {
      nextActions.push({
        id: `hara-${plot.id}`,
        kind: "hara",
        title: `Tanah ${plot.name} perlu dipulihkan`,
        detail: analysis.suggestions[0] ?? "Tambahkan kompos dan pertimbangkan legum.",
        priority: 2,
        plotId: plot.id,
        plotName: plot.name,
      });
    }

    if (plot.activePlanting && plot.plantingCount >= 2) {
      const last = core.plantingRows
        .filter((p) => p.plotId === plot.id && p.harvestedOn)
        .sort((a, b) => ((a.harvestedOn ?? "") < (b.harvestedOn ?? "") ? 1 : -1))[0];
      const sameFamily = last && last.familyId === plot.activePlanting?.familyId;
      if (sameFamily) {
        nextActions.push({
          id: `rotasi-${plot.id}`,
          kind: "rotasi",
          title: `Rotasi berisiko di ${plot.name}`,
          detail: `${plot.activePlanting.cropName} sekeluarga dengan tanaman sebelumnya (${last.cropName}). Pantau hama lebih ketat.`,
          priority: 1,
          plotId: plot.id,
          plotName: plot.name,
        });
      }
    }
  }

  nextActions.sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title));

  const familyMap = new Map<string, { familyName: string; plantCount: number; plotNames: string[] }>();
  for (const planting of activePlantings) {
    const entry = familyMap.get(planting.familyName) ?? {
      familyName: planting.familyName,
      plantCount: 0,
      plotNames: [],
    };
    entry.plantCount += 1;
    if (!entry.plotNames.includes(planting.plotName)) entry.plotNames.push(planting.plotName);
    familyMap.set(planting.familyName, entry);
  }

  return {
    farm: farmList[0] ?? null,
    totals: {
      plots: plotList.length,
      activePlantings: activePlantings.length,
      harvestedPlantings: core.plantingRows.filter((p) => p.harvestedOn).length,
      totalArea: plotList.reduce((sum, p) => sum + p.area, 0),
      avgSoilScore,
      soilTests: core.soilRows.length,
    },
    activePlantings,
    plotsNeedingAttention: plotList
      .map((plot) => ({
        plotId: plot.id,
        plotName: plot.name,
        soilScore: analyzeSoilTest(plot.latestSoilTest)?.score ?? null,
        reason: !plot.latestSoilTest
          ? "Belum ada uji tanah"
          : analyzeSoilTest(plot.latestSoilTest)!.score < 50
            ? "Kesehatan tanah rendah"
            : plot.activePlanting
              ? "Sedang ditanami"
              : "Petak kosong",
      }))
      .sort((a, b) => (a.soilScore ?? 999) - (b.soilScore ?? 999)),
    nextActions: nextActions.slice(0, 8),
    familyRotationSnapshot: [...familyMap.values()].sort((a, b) => b.plantCount - a.plantCount),
  };
}

export async function findCropById(cropId: number): Promise<CropDto | null> {
  const list = await getCrops();
  return list.find((c) => c.id === cropId) ?? null;
}

export async function deletePlotCascade(plotId: number): Promise<void> {
  await db.delete(plots).where(eq(plots.id, plotId));
}

export async function plotExists(plotId: number): Promise<boolean> {
  const rows = await db.select({ id: plots.id }).from(plots).where(eq(plots.id, plotId)).limit(1);
  return rows.length > 0;
}

export async function farmExists(farmId: number): Promise<boolean> {
  const rows = await db.select({ id: farms.id }).from(farms).where(eq(farms.id, farmId)).limit(1);
  return rows.length > 0;
}

export async function plotPlantingsForEvaluation(plotId: number): Promise<PlantingDto[]> {
  const detail = await getPlotDetail(plotId);
  return detail?.plantings ?? [];
}

export { eq };
