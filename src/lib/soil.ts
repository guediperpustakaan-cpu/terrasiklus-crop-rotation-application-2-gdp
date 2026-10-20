import type { SoilAnalysis, SoilMetricStatus, SoilTestDto } from "@/lib/types";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function levelForIndex(value: number): { level: "rendah" | "sedang" | "tinggi"; tone: SoilMetricStatus["tone"]; hint: string } {
  if (value < 30) {
    return {
      level: "rendah",
      tone: "bad",
      hint: "Tambahkan kompos matang / pupuk organik kaya hara ini.",
    };
  }
  if (value <= 60) {
    return {
      level: "sedang",
      tone: "warn",
      hint: "Cukup, tapi jaga dengan pemupukan susulan ringan.",
    };
  }
  return {
    level: "tinggi",
    tone: "good",
    hint: "Cukup melimpah — manfaatkan untuk tanaman pemakai hara berat.",
  };
}

export function analyzeSoilTest(test: SoilTestDto | null | undefined): SoilAnalysis | null {
  if (!test) return null;

  const metrics: SoilMetricStatus[] = [];

  // pH
  let phTone: SoilMetricStatus["tone"] = "good";
  let phLevel: SoilMetricStatus["level"] = "ideal";
  let phHint = "pH berada pada kisaran ideal untuk sebagian besar sayuran.";
  if (test.ph < 5.5) {
    phTone = "bad";
    phLevel = "asam";
    phHint = "Terlalu asam. Aplikasikan kapur dolomit/kaptan secara bertahap.";
  } else if (test.ph < 6.0) {
    phTone = "warn";
    phLevel = "asam";
    phHint = "Sedikit asam. Naikkan pH perlahan dengan kapur pertanian.";
  } else if (test.ph <= 7.0) {
    phTone = "good";
    phLevel = "ideal";
  } else if (test.ph <= 7.5) {
    phTone = "warn";
    phLevel = "basa";
    phHint = "Sedikit basa. Tambahkan bahan organik/kompos untuk menurunkan pH.";
  } else {
    phTone = "bad";
    phLevel = "basa";
    phHint = "Terlalu basa, hara mikro mudah terkunci. Gunakan belerang atau kompos daun.";
  }
  metrics.push({
    key: "ph",
    label: "pH Tanah",
    value: test.ph,
    unit: "",
    level: phLevel,
    tone: phTone,
    hint: phHint,
    progress: clamp(((test.ph - 4) / 4) * 100, 0, 100),
  });

  // Nitrogen
  const n = levelForIndex(test.n);
  metrics.push({
    key: "n",
    label: "Nitrogen (N)",
    value: test.n,
    unit: "idx",
    level: n.level,
    tone: n.tone,
    hint:
      n.level === "rendah"
        ? "Nitrogen rendah — tanam legum (Fabaceae) untuk memulihkannya."
        : n.hint,
    progress: clamp(test.n, 0, 100),
  });

  // Fosfor
  const p = levelForIndex(test.p);
  metrics.push({
    key: "p",
    label: "Fosfor (P)",
    value: test.p,
    unit: "idx",
    level: p.level,
    tone: p.tone,
    hint:
      p.level === "rendah"
        ? "Fosfor rendah — tambahkan pupuk fosfat alami / tepung tulang."
        : p.hint,
    progress: clamp(test.p, 0, 100),
  });

  // Kalium
  const k = levelForIndex(test.k);
  metrics.push({
    key: "k",
    label: "Kalium (K)",
    value: test.k,
    unit: "idx",
    level: k.level,
    tone: k.tone,
    hint: k.level === "rendah" ? "Kalium rendah — abu kayu/humus kaya kalium membantu." : k.hint,
    progress: clamp(test.k, 0, 100),
  });

  // Bahan organik
  let omLevel: SoilMetricStatus["level"] = "sedang";
  let omTone: SoilMetricStatus["tone"] = "warn";
  let omHint = "Bahan organik cukup, tambahkan mulsa tiap musim.";
  if (test.organicMatter < 2) {
    omLevel = "rendah";
    omTone = "bad";
    omHint = "Bahan organik sangat rendah. Siapkan kompos 2–3 kg/m² sebelum tanam.";
  } else if (test.organicMatter >= 5) {
    omLevel = "tinggi";
    omTone = "good";
    omHint = "Bahan organik melimpah — struktur tanah dan biologi tanah baik.";
  }
  metrics.push({
    key: "organicMatter",
    label: "Bahan Organik",
    value: test.organicMatter,
    unit: "%",
    level: omLevel,
    tone: omTone,
    hint: omHint,
    progress: clamp((test.organicMatter / 8) * 100, 0, 100),
  });

  const phScore =
    test.ph >= 6.0 && test.ph <= 7.0
      ? 100
      : clamp(100 - Math.min(Math.abs(test.ph - 6.5) * 45, 90), 10, 100);
  const score = Math.round(
    phScore * 0.25 +
      clamp(test.n, 0, 100) * 0.2 +
      clamp(test.p, 0, 100) * 0.15 +
      clamp(test.k, 0, 100) * 0.15 +
      clamp((test.organicMatter / 6) * 100, 0, 100) * 0.25,
  );

  const grade: SoilAnalysis["grade"] =
    score >= 80 ? "Sangat Baik" : score >= 60 ? "Baik" : score >= 40 ? "Cukup" : "Perlu Perbaikan";

  const suggestions: string[] = [];
  if (metrics.find((m) => m.key === "ph" && m.tone === "bad")) {
    suggestions.push("Perbaiki pH lebih dulu — hara lain sulit diserap tanaman saat pH ekstrem.");
  }
  if (test.n < 30) suggestions.push("Tanam legum (kacang panjang, buncis, kedelai) sebagai tanaman pemulih nitrogen.");
  if (test.p < 30) suggestions.push("Aplikasikan kompos matang atau pupuk fosfat alami sebelum tanam berikutnya.");
  if (test.k < 30) suggestions.push("Tambahkan abu kayu atau kalium sulfat untuk buah & umbi berkualitas.");
  if (test.organicMatter < 3) suggestions.push("Gunakan mulsa jerami/daun dan kompos rutin untuk menaikkan bahan organik.");
  if (suggestions.length === 0) {
    suggestions.push("Kondisi tanah sudah baik — pertahankan rotasi 4 keluarga dan mulsa organik.");
  }

  const summary = `Skor kesehatan tanah ${score}/100 (${grade}). ${
    test.n < 30 || test.organicMatter < 2 ? "Tanah butuh pemulihan hara." : "Tanah dalam kondisi produktif."
  }`;

  return { score, grade, summary, metrics, suggestions };
}

export function soilScore(test: SoilTestDto | null | undefined): number | null {
  return analyzeSoilTest(test)?.score ?? null;
}
