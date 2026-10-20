"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  FlaskConical,
  History,
  Lightbulb,
  Recycle,
  Search,
  Sprout,
  Star,
} from "lucide-react";
import { Badge, Button, Card, EmptyState, ErrorNote, Progress, SectionTitle, Skeleton } from "@/components/ui/primitives";
import { PlantingForm } from "@/components/PlantingForm";
import { useCrops, useRotation } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { ROTATION_RULES } from "@/lib/rotation";
import { formatDate, monthsLabel } from "@/lib/format";
import { demandLabel, demandTone } from "@/lib/format";
import type { CropDto, PlantingDto, PlotDto, RotationCandidate, RotationStatus } from "@/lib/types";

const statusMeta: Record<RotationStatus, { label: string; tone: string; Icon: typeof CheckCircle2 }> = {
  direkomendasikan: { label: "Direkomendasikan", tone: "leaf", Icon: CheckCircle2 },
  "hati-hati": { label: "Hati-hati", tone: "amber", Icon: AlertTriangle },
  hindari: { label: "Hindari", tone: "red", Icon: CircleSlash },
};

function ScoreRing({ score }: { score: number }) {
  const tone = score >= 68 ? "text-leaf-600" : score >= 45 ? "text-amber-600" : "text-red-600";
  const bar = score >= 68 ? "leaf" : score >= 45 ? "amber" : "red";
  return (
    <div className="w-24 shrink-0 text-center">
      <p className={`text-xl font-extrabold ${tone}`}>{score}</p>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-leaf-800/50">Skor</p>
      <Progress value={score} tone={bar} />
    </div>
  );
}

function CandidateCard({
  candidate,
  highlight = false,
  onPlant,
}: {
  candidate: RotationCandidate;
  highlight?: boolean;
  onPlant: (crop: CropDto) => void;
}) {
  const meta = statusMeta[candidate.status];
  const Icon = meta.Icon;
  return (
    <div
      className={`ts-card p-4 ${
        highlight ? "border-leaf-300 ring-1 ring-leaf-200" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h4 className="text-sm font-bold text-leaf-900 sm:text-base">{candidate.crop.commonName}</h4>
            {highlight ? <Star className="size-4 fill-amber-400 text-amber-500" /> : null}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={meta.tone}>
              <Icon className="size-3" /> {meta.label}
            </Badge>
            <Badge tone="clay">{candidate.crop.familyName}</Badge>
            <Badge tone={demandTone(candidate.crop.nutrientDemand)}>{demandLabel(candidate.crop.nutrientDemand)}</Badge>
            <Badge tone="slate">{candidate.crop.growthDays} hari</Badge>
            {candidate.crop.isNitrogenFixer ? <Badge tone="sky">Legum pengikat N</Badge> : null}
          </div>
        </div>
        <ScoreRing score={candidate.score} />
      </div>

      {candidate.reasons.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {candidate.reasons.slice(0, 3).map((reason) => (
            <li key={reason} className="flex gap-2 text-xs leading-relaxed text-leaf-900/80">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-leaf-600" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {candidate.warnings.length > 0 ? (
        <ul className="mt-2 space-y-1.5 rounded-xl bg-amber-50/70 p-2.5">
          {candidate.warnings.slice(0, 3).map((warning) => (
            <li key={warning} className="flex gap-2 text-xs leading-relaxed text-amber-900">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span>{warning}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[11px] text-leaf-800/60">
          pH ideal {candidate.crop.idealPhMin}–{candidate.crop.idealPhMax}
          {candidate.crop.notes ? ` · ${candidate.crop.notes}` : ""}
        </p>
        <Button size="sm" onClick={() => onPlant(candidate.crop)}>
          <Sprout className="size-3.5" /> Tanam ini
        </Button>
      </div>
    </div>
  );
}

export function RotationEngine({
  plot,
  plantings,
}: {
  plot: PlotDto;
  plantings: PlantingDto[];
}) {
  const toast = useToast();
  const cropsQuery = useCrops();
  const rotationQuery = useRotation(plot.id);
  const [filterStatus, setFilterStatus] = useState<"semua" | RotationStatus>("semua");
  const [search, setSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState("semua");
  const [plantCrop, setPlantCrop] = useState<CropDto | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const analysis = rotationQuery.data?.analysis ?? null;
  const crops = cropsQuery.data?.crops ?? [];

  const families = useMemo(() => {
    const set = new Set<string>();
    crops.forEach((crop) => set.add(crop.familyName));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [crops]);

  const filtered = useMemo(() => {
    if (!analysis) return [];
    const keyword = search.trim().toLowerCase();
    return analysis.candidates.filter((candidate) => {
      if (filterStatus !== "semua" && candidate.status !== filterStatus) return false;
      if (familyFilter !== "semua" && candidate.crop.familyName !== familyFilter) return false;
      if (
        keyword &&
        !candidate.crop.commonName.toLowerCase().includes(keyword) &&
        !candidate.crop.familyName.toLowerCase().includes(keyword)
      ) {
        return false;
      }
      return true;
    });
  }, [analysis, filterStatus, familyFilter, search]);

  const openPlanting = (crop: CropDto) => {
    if (plot.activePlanting) {
      toast.push({
        tone: "warning",
        title: "Petak masih ditanami",
        description: `Panen ${plot.activePlanting.cropName} terlebih dahulu sebelum menanam ${crop.commonName}.`,
      });
      return;
    }
    setPlantCrop(crop);
    setFormOpen(true);
  };

  if (rotationQuery.isLoading || cropsQuery.isLoading) {
    return (
      <Card>
        <SectionTitle icon={<Recycle className="size-5" />} title="Rekomendasi Rotasi" description="Menganalisis riwayat tanam…" />
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </Card>
    );
  }

  if (rotationQuery.isError || !analysis) {
    return (
      <Card>
        <SectionTitle icon={<Recycle className="size-5" />} title="Rekomendasi Rotasi" />
        <ErrorNote message="Gagal memuat analisis rotasi. Coba muat ulang halaman." />
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle
        icon={<Recycle className="size-5" />}
        title="Mesin Rekomendasi Rotasi"
        description={`Aturan: keluarga botani yang sama minimal diberi jeda ${ROTATION_RULES.sameFamilyCooldownMonths} bulan.`}
      />

      {/* Ringkasan analisis */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-leaf-100 bg-leaf-50/60 p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-leaf-700">
            <History className="size-3.5" /> Musim sebelumnya
          </p>
          {analysis.previousCrop ? (
            <>
              <p className="mt-1 text-sm font-bold text-leaf-900">
                {analysis.previousCrop.cropName}
                <span className="ml-1 text-xs font-medium text-leaf-800/60">
                  ({analysis.previousFamilyName})
                </span>
              </p>
              <p className="mt-1 text-xs text-leaf-800/70">
                Tanam {formatDate(analysis.previousCrop.plantedOn)} · Panen{" "}
                {formatDate(analysis.previousCrop.harvestedOn)}
              </p>
              <p className="mt-1 text-xs font-semibold text-clay-700">
                Jeda {analysis.monthsSincePrevious !== null ? Math.round(analysis.monthsSincePrevious) : 0} bulan
              </p>
            </>
          ) : (
            <p className="mt-1 text-xs text-leaf-800/70">
              Belum ada riwayat tanam. Semua keluarga tanaman aman dipilih.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-leaf-100 bg-white p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-leaf-700">
            <FlaskConical className="size-3.5" /> Kondisi tanah terakhir
          </p>
          {analysis.soilSummary ? (
            <p className="mt-1.5 font-mono text-xs leading-relaxed text-leaf-900/80">{analysis.soilSummary}</p>
          ) : (
            <p className="mt-1.5 text-xs text-leaf-800/70">Belum ada data uji tanah untuk petak ini.</p>
          )}
          <p className="mt-2 text-[11px] text-leaf-800/60">
            Hara tanah dipakai untuk menilai tanaman pemakai hara berat vs legum pemulih nitrogen.
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-3 rounded-2xl border border-clay-200 bg-clay-50 p-4">
        <Lightbulb className="mt-0.5 size-5 shrink-0 text-clay-700" />
        <p className="text-sm font-semibold leading-relaxed text-clay-900">{analysis.headline}</p>
      </div>

      {/* Riwayat keluarga */}
      {analysis.familyHistory.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-leaf-800/60">
            Riwayat keluarga botani di petak ini
          </p>
          <div className="flex flex-wrap gap-2">
            {analysis.familyHistory.map((item) => {
              const blocked = analysis.blockedFamilyIds.includes(item.familyId);
              return (
                <span
                  key={item.familyId}
                  className={`ts-chip ${
                    blocked ? "bg-red-100 text-red-800" : "bg-leaf-100 text-leaf-800"
                  }`}
                  title={blocked ? "Masih dalam masa jeda rotasi" : "Jeda sudah cukup aman"}
                >
                  {blocked ? <CircleSlash className="size-3" /> : <CheckCircle2 className="size-3" />}
                  {item.familyName} · {item.plantCount}× · {monthsLabel(item.monthsAgo)}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Pilihan teratas */}
      {analysis.topPicks.length > 0 ? (
        <div className="mt-5">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-leaf-800/60">
            <Star className="size-3.5" /> Pilihan teratas untuk musim ini
          </p>
          <div className="grid gap-3 lg:grid-cols-3">
            {analysis.topPicks.map((candidate) => (
              <CandidateCard
                key={candidate.crop.id}
                candidate={candidate}
                highlight
                onPlant={openPlanting}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Filter + daftar lengkap */}
      <div className="mt-6 border-t border-leaf-100 pt-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {(["semua", "direkomendasikan", "hati-hati", "hindari"] as const).map((option) => {
              const active = filterStatus === option;
              const label =
                option === "semua"
                  ? "Semua"
                  : option === "direkomendasikan"
                    ? "Direkomendasikan"
                    : option === "hati-hati"
                      ? "Hati-hati"
                      : "Hindari";
              const count =
                option === "semua"
                  ? analysis.candidates.length
                  : analysis.candidates.filter((c) => c.status === option).length;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilterStatus(option)}
                  className={`ts-chip transition ${
                    active ? "bg-leaf-600 text-white" : "bg-leaf-50 text-leaf-800 hover:bg-leaf-100"
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-leaf-800/40" />
              <input
                className="ts-input pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari tanaman atau keluarga botani…"
              />
            </div>
            <select
              className="ts-input sm:w-56"
              value={familyFilter}
              onChange={(e) => setFamilyFilter(e.target.value)}
            >
              <option value="semua">Semua keluarga botani</option>
              {families.map((family) => (
                <option key={family} value={family}>
                  {family}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {filtered.map((candidate) => (
            <CandidateCard key={candidate.crop.id} candidate={candidate} onPlant={openPlanting} />
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Search className="size-5" />}
            title="Tidak ada tanaman yang cocok"
            description="Coba ubah filter status atau keluarga botani untuk melihat kandidat lain."
          />
        ) : null}
      </div>

      <PlantingForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        plot={plot}
        crops={crops}
        plantings={plantings}
        preselectedCropId={plantCrop?.id ?? null}
      />
    </Card>
  );
}
