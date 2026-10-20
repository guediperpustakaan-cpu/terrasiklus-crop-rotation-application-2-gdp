/** Tipe data bersama (shared DTO) antara API, mesin rotasi, dan UI. */

export type NutrientDemand = "rendah" | "sedang" | "tinggi";

export const NUTRIENT_DEMANDS: NutrientDemand[] = ["rendah", "sedang", "tinggi"];

export const SOIL_TYPES = [
  "lempung",
  "lempung berpasir",
  "pasir",
  "liat",
  "humus",
  "andosol",
  "gambut",
] as const;

export type SoilType = (typeof SOIL_TYPES)[number];

export interface FamilyDto {
  id: number;
  name: string;
  localName: string | null;
  isNitrogenFixer: boolean;
  notes: string | null;
  cropCount?: number;
}

export interface CropDto {
  id: number;
  commonName: string;
  familyId: number;
  familyName: string;
  familyLocalName: string | null;
  isNitrogenFixer: boolean;
  nutrientDemand: NutrientDemand;
  growthDays: number;
  idealPhMin: number;
  idealPhMax: number;
  notes: string | null;
}

export interface FarmDto {
  id: number;
  name: string;
  location: string | null;
  createdAt: string;
  plotCount: number;
  totalArea: number;
  areaUnit: string;
}

export interface SoilTestDto {
  id: number;
  plotId: number;
  testedOn: string;
  ph: number;
  n: number;
  p: number;
  k: number;
  organicMatter: number;
  notes: string | null;
}

export interface PlotDto {
  id: number;
  farmId: number;
  farmName: string;
  name: string;
  area: number;
  areaUnit: string;
  soilType: string;
  notes: string | null;
  createdAt: string;
  activePlanting: PlantingDto | null;
  lastCompleted: PlantingDto | null;
  soilTestCount: number;
  plantingCount: number;
  latestSoilTest: SoilTestDto | null;
}

export interface PlantingDto {
  id: number;
  plotId: number;
  plotName: string;
  cropId: number;
  cropName: string;
  familyId: number;
  familyName: string;
  isNitrogenFixer: boolean;
  nutrientDemand: NutrientDemand;
  growthDays: number;
  plantedOn: string;
  harvestedOn: string | null;
  notes: string | null;
}

export interface PlotDetailDto {
  plot: PlotDto;
  plantings: PlantingDto[];
  soilTests: SoilTestDto[];
}

export type RotationStatus = "direkomendasikan" | "hati-hati" | "hindari";

export interface RotationCandidate {
  crop: CropDto;
  status: RotationStatus;
  score: number;
  reasons: string[];
  warnings: string[];
}

export interface RotationFamilyHistory {
  familyId: number;
  familyName: string;
  isNitrogenFixer: boolean;
  lastPlantedOn: string;
  monthsAgo: number;
  plantCount: number;
}

export interface RotationAnalysis {
  plotId: number;
  plotName: string;
  previousCrop: PlantingDto | null;
  previousFamilyName: string | null;
  monthsSincePrevious: number | null;
  familyHistory: RotationFamilyHistory[];
  blockedFamilyIds: number[];
  soilSummary: string | null;
  headline: string;
  candidates: RotationCandidate[];
  topPicks: RotationCandidate[];
}

export type PlantingAlertLevel = "aman" | "peringatan" | "berbahaya";

export interface PlantingEvaluation {
  level: PlantingAlertLevel;
  title: string;
  message: string;
  advice: string | null;
}

export interface SoilMetricStatus {
  key: "ph" | "n" | "p" | "k" | "organicMatter";
  label: string;
  value: number;
  unit: string;
  level: "rendah" | "sedang" | "tinggi" | "ideal" | "asam" | "basa";
  tone: "good" | "warn" | "bad" | "neutral";
  hint: string;
  progress: number;
}

export interface SoilAnalysis {
  score: number;
  grade: "Sangat Baik" | "Baik" | "Cukup" | "Perlu Perbaikan";
  summary: string;
  metrics: SoilMetricStatus[];
  suggestions: string[];
}

export type NextActionKind = "panen" | "tanam" | "uji-tanah" | "hara" | "rotasi";

export interface NextAction {
  id: string;
  kind: NextActionKind;
  title: string;
  detail: string;
  priority: number;
  plotId: number | null;
  plotName: string | null;
}

export interface DashboardDto {
  farm: FarmDto | null;
  totals: {
    plots: number;
    activePlantings: number;
    harvestedPlantings: number;
    totalArea: number;
    avgSoilScore: number | null;
    soilTests: number;
  };
  activePlantings: Array<
    PlantingDto & { area: number; areaUnit: string; daysPlanted: number; expectedHarvest: string }
  >;
  plotsNeedingAttention: Array<{
    plotId: number;
    plotName: string;
    soilScore: number | null;
    reason: string;
  }>;
  nextActions: NextAction[];
  familyRotationSnapshot: Array<{
    familyName: string;
    plantCount: number;
    plotNames: string[];
  }>;
}
