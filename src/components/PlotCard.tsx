"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Droplets,
  FlaskConical,
  Layers,
  MapPin,
  Ruler,
  Sprout,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { analyzeSoilTest } from "@/lib/soil";
import { daysBetween, formatDate, relativeDays, todayIso } from "@/lib/format";
import { demandLabel, demandTone } from "@/lib/format";
import type { PlotDto } from "@/lib/types";

export function SoilScoreBadge({ plot }: { plot: PlotDto }) {
  const analysis = analyzeSoilTest(plot.latestSoilTest);
  if (!analysis) {
    return (
      <Badge tone="slate">
        <FlaskConical className="size-3" /> Belum diuji
      </Badge>
    );
  }
  const tone = analysis.score >= 70 ? "leaf" : analysis.score >= 45 ? "amber" : "red";
  return (
    <Badge tone={tone}>
      <FlaskConical className="size-3" /> Tanah {analysis.score}/100
    </Badge>
  );
}

export function PlotCard({
  plot,
  onDelete,
  showFarm = true,
}: {
  plot: PlotDto;
  onDelete?: (plot: PlotDto) => void;
  showFarm?: boolean;
}) {
  const today = todayIso();
  const active = plot.activePlanting;
  const expectedHarvest = active
    ? (() => {
        const date = new Date(`${active.plantedOn}T00:00:00Z`);
        date.setUTCDate(date.getUTCDate() + active.growthDays);
        return date.toISOString().slice(0, 10);
      })()
    : null;
  const daysToHarvest = expectedHarvest ? daysBetween(today, expectedHarvest) : null;

  return (
    <div className="ts-card flex flex-col p-4 transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {showFarm ? (
            <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-clay-600">
              <MapPin className="size-3" /> {plot.farmName}
            </p>
          ) : null}
          <h3 className="truncate text-base font-bold text-leaf-900">{plot.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-leaf-800/70">
            <span className="inline-flex items-center gap-1">
              <Ruler className="size-3" /> {plot.area} {plot.areaUnit}
            </span>
            <span className="inline-flex items-center gap-1">
              <Layers className="size-3" /> Tanah {plot.soilType}
            </span>
          </div>
        </div>
        <SoilScoreBadge plot={plot} />
      </div>

      <div className="mt-4 rounded-2xl bg-leaf-50/70 p-3">
        {active ? (
          <>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-leaf-700">
              <Sprout className="size-3.5" /> Sedang ditanami
            </p>
            <p className="mt-1 text-sm font-bold text-leaf-900">
              {active.cropName}
              <span className="ml-1 text-xs font-medium text-leaf-800/60">({active.familyName})</span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-leaf-800/75">
              <span className="inline-flex items-center gap-1">
                <CalendarCheck className="size-3" /> Tanam {formatDate(active.plantedOn)}
              </span>
              {expectedHarvest ? (
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    (daysToHarvest ?? 0) <= 0 ? "text-amber-700" : ""
                  }`}
                >
                  <Droplets className="size-3" />
                  {(daysToHarvest ?? 0) <= 0
                    ? "Perkiraan panen sudah tiba"
                    : `Panen ${relativeDays(expectedHarvest)}`}
                </span>
              ) : null}
            </div>
          </>
        ) : plot.lastCompleted ? (
          <>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-clay-600">
              <Sprout className="size-3.5" /> Petak kosong
            </p>
            <p className="mt-1 text-sm font-semibold text-leaf-900">
              Sebelumnya {plot.lastCompleted.cropName}
              <span className="ml-1 text-xs font-medium text-leaf-800/60">
                ({plot.lastCompleted.familyName})
              </span>
            </p>
            <p className="mt-1 text-[11px] text-leaf-800/70">
              Panen {formatDate(plot.lastCompleted.harvestedOn)} · siap untuk rotasi keluarga berbeda
            </p>
          </>
        ) : (
          <>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-clay-600">
              <Sprout className="size-3.5" /> Petak kosong
            </p>
            <p className="mt-1 text-sm text-leaf-800/80">Belum ada riwayat tanam pada petak ini.</p>
          </>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {active ? <Badge tone={demandTone(active.nutrientDemand)}>{demandLabel(active.nutrientDemand)}</Badge> : null}
        {active?.isNitrogenFixer ? <Badge tone="sky">Legum pengikat N</Badge> : null}
        <Badge tone="slate">{plot.plantingCount} riwayat tanam</Badge>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Link href={`/petak/${plot.id}`} className="ts-btn ts-btn-primary flex-1">
          Detail & Rotasi <ArrowRight className="size-4" />
        </Link>
        {onDelete ? (
          <button
            type="button"
            onClick={() => onDelete(plot)}
            className="ts-btn ts-btn-ghost px-3 text-red-700"
            aria-label={`Hapus ${plot.name}`}
          >
            <Trash2 className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
