import type {
  CropDto,
  PlantingDto,
  PlantingEvaluation,
  RotationAnalysis,
  RotationCandidate,
  RotationFamilyHistory,
  SoilTestDto,
} from "@/lib/types";

/** Aturan rotasi TerraSiklus. */
export const ROTATION_RULES = {
  /** Jeda minimum (bulan) sebelum keluarga botani yang sama boleh ditanam ulang. */
  sameFamilyCooldownMonths: 12,
  /** Batas "aman" yang dipakai mesin rekomendasi. */
  recommendationCooldownMonths: 18,
} as const;

export function monthsBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00Z`).getTime();
  const b = new Date(`${to}T00:00:00Z`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.max(0, (b - a) / (1000 * 60 * 60 * 24 * 30.44));
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const demandWeight: Record<CropDto["nutrientDemand"], number> = {
  rendah: 1,
  sedang: 2,
  tinggi: 3,
};

function sortHistory(history: PlantingDto[]): PlantingDto[] {
  return [...history].sort((a, b) => {
    const aEnd = a.harvestedOn ?? a.plantedOn;
    const bEnd = b.harvestedOn ?? b.plantedOn;
    if (aEnd === bEnd) return a.plantedOn < b.plantedOn ? 1 : -1;
    return aEnd < bEnd ? 1 : -1;
  });
}

/**
 * Mesin rekomendasi rotasi.
 * Menganalisis riwayat tanam + hasil uji tanah terakhir, lalu memberi skor
 * pada setiap tanaman dalam katalog.
 */
export function buildRotationAnalysis(input: {
  plotId: number;
  plotName: string;
  crops: CropDto[];
  plantings: PlantingDto[];
  soilTest: SoilTestDto | null;
}): RotationAnalysis {
  const { plotId, plotName, crops, soilTest } = input;
  const today = todayIso();
  const history = sortHistory(input.plantings);

  const previousCrop = history[0] ?? null;
  const previousFamilyId = previousCrop?.familyId ?? null;
  const previousFamilyName = previousCrop?.familyName ?? null;
  const monthsSincePrevious = previousCrop
    ? monthsBetween(previousCrop.harvestedOn ?? previousCrop.plantedOn, today)
    : null;

  // Riwayat keluarga botani (semua waktu)
  const byFamily = new Map<number, RotationFamilyHistory>();
  for (const item of history) {
    const anchor = item.harvestedOn ?? item.plantedOn;
    const monthsAgo = monthsBetween(anchor, today);
    const existing = byFamily.get(item.familyId);
    if (existing) {
      existing.plantCount += 1;
      if (anchor > existing.lastPlantedOn) {
        existing.lastPlantedOn = anchor;
        existing.monthsAgo = monthsAgo;
      }
    } else {
      byFamily.set(item.familyId, {
        familyId: item.familyId,
        familyName: item.familyName,
        isNitrogenFixer: item.isNitrogenFixer,
        lastPlantedOn: anchor,
        monthsAgo,
        plantCount: 1,
      });
    }
  }
  const familyHistory = [...byFamily.values()].sort((a, b) => a.monthsAgo - b.monthsAgo);

  // Keluarga yang masih dalam masa jeda
  const blockedFamilyIds = familyHistory
    .filter((f) => f.monthsAgo < ROTATION_RULES.sameFamilyCooldownMonths)
    .map((f) => f.familyId);

  const lowN = soilTest ? soilTest.n < 30 : false;
  const highN = soilTest ? soilTest.n > 60 : false;
  const lowPh = soilTest ? soilTest.ph < 5.8 : false;
  const highPh = soilTest ? soilTest.ph > 7.2 : false;
  const lowOrganic = soilTest ? soilTest.organicMatter < 3 : false;
  const lowK = soilTest ? soilTest.k < 30 : false;

  const candidates: RotationCandidate[] = crops.map((crop) => {
    let score = 45;
    const reasons: string[] = [];
    const warnings: string[] = [];

    // --- Aturan inti: keluarga botani ---
    const familyEntry = byFamily.get(crop.familyId);
    const sameAsPrevious = previousFamilyId !== null && crop.familyId === previousFamilyId;

    if (!previousCrop) {
      score += 12;
      reasons.push("Belum ada riwayat tanam di petak ini — semua keluarga tanaman aman dipilih.");
    } else if (sameAsPrevious) {
      const gap = monthsSincePrevious ?? 0;
      if (gap < ROTATION_RULES.sameFamilyCooldownMonths) {
        score -= 70;
        warnings.push(
          `Keluarga ${crop.familyName} baru ditanam ${Math.round(gap)} bulan lalu. Hama dan patogen tanah masih menumpuk.`,
        );
      } else if (gap < ROTATION_RULES.recommendationCooldownMonths) {
        score -= 40;
        warnings.push(
          `Jeda baru ${Math.round(gap)} bulan — idealnya tunggu hingga ${ROTATION_RULES.recommendationCooldownMonths} bulan untuk keluarga ${crop.familyName}.`,
        );
      } else {
        score -= 12;
        warnings.push(
          `Keluarga yang sama dengan musim sebelumnya, meski jeda sudah ${Math.round(gap)} bulan. Risiko tetap ada.`,
        );
      }
    } else {
      score += 20;
      reasons.push(
        `Keluarga tanaman berbeda dari musim sebelumnya (${previousFamilyName}) untuk mencegah hama menumpuk.`,
      );
      if (familyEntry) {
        const gap = familyEntry.monthsAgo;
        if (gap >= ROTATION_RULES.recommendationCooldownMonths) {
          score += 6;
          reasons.push(
            `Keluarga ${crop.familyName} terakhir ditanam ${Math.round(gap)} bulan lalu — jeda sudah cukup aman.`,
          );
        } else {
          score -= 18;
          warnings.push(
            `Keluarga ${crop.familyName} masih dalam siklus rotasi (terakhir ${Math.round(gap)} bulan lalu).`,
          );
        }
      } else {
        score += 8;
        reasons.push(`Keluarga ${crop.familyName} belum pernah ditanam di petak ini — pemecah siklus hama yang baik.`);
      }
    }

    // --- Kesehatan tanah & hara ---
    if (soilTest) {
      if (crop.isNitrogenFixer && lowN) {
        score += 14;
        reasons.push("Legumen pengikat nitrogen — memulihkan tanah yang kekurangan nitrogen.");
      } else if (crop.isNitrogenFixer && highN) {
        score -= 8;
        warnings.push("Nitrogen tanah sudah tinggi, manfaat legumen sebagai pemulih tidak terlalu besar.");
      } else if (crop.isNitrogenFixer) {
        score += 8;
        reasons.push("Menyisakan nitrogen di tanah untuk musim berikutnya.");
      }

      if (crop.nutrientDemand === "tinggi" && lowN) {
        score -= 22;
        warnings.push("Kebutuhan hara tinggi, sedangkan nitrogen tanah rendah — hasil bisa mengecewakan.");
      }
      if (crop.nutrientDemand === "rendah" && (lowN || lowOrganic)) {
        score += 6;
        reasons.push("Kebutuhan hara rendah, memberi waktu tanah memulihkan cadangan hara.");
      }
      if (crop.nutrientDemand === "tinggi" && previousCrop?.nutrientDemand === "tinggi") {
        score -= 10;
        warnings.push("Dua musim berturut-turut pemakai hara berat dapat menguras tanah.");
      }
      if (lowK && crop.nutrientDemand === "tinggi") {
        score -= 6;
        warnings.push("Kalium tanah rendah — buah/umbi berukuran besar butuh kalium cukup.");
      }

      if (soilTest.ph >= crop.idealPhMin && soilTest.ph <= crop.idealPhMax) {
        const center = (crop.idealPhMin + crop.idealPhMax) / 2;
        const half = Math.max(0.35, (crop.idealPhMax - crop.idealPhMin) / 2);
        const distance = Math.min(1, Math.abs(soilTest.ph - center) / half);
        score += Math.round(10 - distance * 6);
        reasons.push(
          `pH tanah ${soilTest.ph.toFixed(1)} berada dalam kisaran ideal ${crop.commonName} (${crop.idealPhMin}–${crop.idealPhMax}).`,
        );
      } else if (soilTest.ph < crop.idealPhMin) {
        const delta = crop.idealPhMin - soilTest.ph;
        score -= delta > 0.7 ? 20 : 10;
        warnings.push(
          `pH terlalu asam untuk ${crop.commonName} (ideal ${crop.idealPhMin}–${crop.idealPhMax}).`,
        );
      } else {
        const delta = soilTest.ph - crop.idealPhMax;
        score -= delta > 0.7 ? 18 : 9;
        warnings.push(
          `pH terlalu basa untuk ${crop.commonName} (ideal ${crop.idealPhMin}–${crop.idealPhMax}).`,
        );
      }

      if (lowOrganic) {
        score -= 2;
      }
    } else {
      reasons.push("Belum ada data uji tanah — tambahkan hasil uji untuk rekomendasi lebih akurat.");
    }

    // Keseimbangan hara antar musim: setelah pemakai berat, tanaman ringan diprioritaskan
    if (previousCrop) {
      if (previousCrop.nutrientDemand === "tinggi" && crop.nutrientDemand === "rendah") {
        score += 8;
        reasons.push(
          "Setelah tanaman rakus hara, tanaman berhara ringan memberi waktu tanah memulihkan cadangan.",
        );
      }
      if (previousCrop.nutrientDemand === "rendah" && crop.nutrientDemand === "tinggi") {
        score += 6;
        reasons.push(
          "Sisa nitrogen dari musim legum sebelumnya dapat dimanfaatkan tanaman pemakai hara berat.",
        );
      }
    }

    // Sedikit bonus untuk tanaman berumur pendek agar rotasi lebih rapat
    score += Math.round(7 - (crop.growthDays / 240) * 13);
    if (crop.growthDays >= 200) score -= 6;

    score = Math.round(clamp(score, 0, 100));

    let status: RotationCandidate["status"];
    if (score >= 65) status = "direkomendasikan";
    else if (score >= 42) status = "hati-hati";
    else status = "hindari";

    if (sameAsPrevious && (monthsSincePrevious ?? 0) < ROTATION_RULES.sameFamilyCooldownMonths) {
      status = "hindari";
    }

    return { crop, status, score, reasons, warnings };
  });

  candidates.sort((a, b) => b.score - a.score || a.crop.commonName.localeCompare(b.crop.commonName));

  const soilSummary = soilTest
    ? `pH ${soilTest.ph.toFixed(1)} · N ${Math.round(soilTest.n)} · P ${Math.round(soilTest.p)} · K ${Math.round(
        soilTest.k,
      )} · BO ${soilTest.organicMatter.toFixed(1)}%`
    : null;

  const topPicks = candidates.filter((c) => c.status === "direkomendasikan").slice(0, 3);
  const headline = previousCrop
    ? topPicks.length > 0
      ? `Setelah ${previousCrop.cropName} (${previousFamilyName}), pilihan terbaik adalah ${topPicks
          .slice(0, 3)
          .map((c) => c.crop.commonName)
          .join(", ")}.`
      : `Riwayat ${previousCrop.cropName} membatasi pilihan. Prioritaskan perbaikan tanah dan pilih keluarga tanaman lain.`
    : "Petak ini belum punya riwayat tanam — mulailah dengan legum atau sayuran daun untuk membangun kesuburan.";

  return {
    plotId,
    plotName,
    previousCrop,
    previousFamilyName,
    monthsSincePrevious,
    familyHistory,
    blockedFamilyIds,
    soilSummary,
    headline,
    candidates,
    topPicks,
  };
}

/** Evaluasi "alert" saat petani mencoba mencatat tanaman baru. */
export function evaluatePlanting(
  crop: CropDto,
  plotHistory: PlantingDto[],
  plantedOn: string,
): PlantingEvaluation {
  const history = sortHistory(plotHistory);
  const previous = history[0] ?? null;
  const sameFamilyRecord = history.find((h) => h.familyId === crop.familyId);
  const lastOfFamily = sameFamilyRecord
    ? sameFamilyRecord.harvestedOn ?? sameFamilyRecord.plantedOn
    : null;
  const gapMonths = lastOfFamily ? monthsBetween(lastOfFamily, plantedOn) : null;

  if (previous && crop.familyId === previous.familyId) {
    const gap = gapMonths ?? 0;
    if (gap < ROTATION_RULES.sameFamilyCooldownMonths) {
      return {
        level: "berbahaya",
        title: "Rotasi dilanggar: keluarga tanaman sama",
        message: `${crop.commonName} termasuk keluarga ${crop.familyName}, sama dengan tanaman sebelumnya di petak ini (${previous.cropName}). Jeda baru ${Math.round(
          gap,
        )} bulan dari batas minimal ${ROTATION_RULES.sameFamilyCooldownMonths} bulan.`,
        advice:
          "Hama dan patogen tanah (mis. layu fusarium, nematoda) berkembang cepat bila keluarga sama diulang. Sebaiknya pilih tanaman dari keluarga lain.",
      };
    }
    return {
      level: "peringatan",
      title: "Keluarga tanaman sama dengan musim sebelumnya",
      message: `Jeda sudah ${Math.round(gap)} bulan, namun ${crop.commonName} masih sekeluarga dengan ${previous.cropName} (${crop.familyName}).`,
      advice: "Pastikan sisa tanaman lama dibersihkan dan tambahkan kompos matang sebelum tanam.",
    };
  }

  if (sameFamilyRecord && gapMonths !== null && gapMonths < ROTATION_RULES.sameFamilyCooldownMonths) {
    return {
      level: "peringatan",
      title: "Keluarga tanaman masih dalam siklus rotasi",
      message: `${crop.familyName} terakhir ditanam ${Math.round(
        gapMonths,
      )} bulan lalu di petak ini (${sameFamilyRecord.cropName}).`,
      advice: "Tunggu hingga minimal " + ROTATION_RULES.sameFamilyCooldownMonths + " bulan untuk menurunkan risiko hama.",
    };
  }

  return {
    level: "aman",
    title: "Rotasi aman",
    message:
      previous == null
        ? `${crop.commonName} (${crop.familyName}) aman ditanam — belum ada riwayat keluarga ini di petak tersebut.`
        : `${crop.commonName} (${crop.familyName}) berbeda keluarga dari ${previous.cropName} (${previous.familyName}). Rotasi sehat!`,
    advice: crop.isNitrogenFixer
      ? "Legumen ini akan menambah nitrogen tanah untuk musim berikutnya."
      : "Catat hasil panen & catatan hama agar rekomendasi berikutnya makin akurat.",
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
