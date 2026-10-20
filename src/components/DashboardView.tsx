"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CircleCheck,
  FlaskConical,
  Layers,
  MapPin,
  Ruler,
  Sparkles,
  Sprout,
  TriangleAlert,
} from "lucide-react";
import { Badge, Card, EmptyState, Progress, SectionTitle, Skeleton, StatCard } from "@/components/ui/primitives";
import { useDashboard } from "@/lib/api-client";
import { formatDate, relativeDays, todayIso } from "@/lib/format";
import { demandLabel, demandTone } from "@/lib/format";
import type { NextAction } from "@/lib/types";

const actionMeta: Record<NextAction["kind"], { icon: typeof Sprout; tone: string; label: string }> = {
  panen: { icon: CalendarClock, tone: "bg-amber-100 text-amber-800", label: "Panen" },
  tanam: { icon: Sprout, tone: "bg-leaf-100 text-leaf-800", label: "Tanam" },
  "uji-tanah": { icon: FlaskConical, tone: "bg-sky-100 text-sky-800", label: "Uji Tanah" },
  hara: { icon: Activity, tone: "bg-red-100 text-red-800", label: "Hara" },
  rotasi: { icon: TriangleAlert, tone: "bg-clay-100 text-clay-800", label: "Rotasi" },
};

export function DashboardView() {
  const { data, isLoading, isError } = useDashboard();
  const today = todayIso();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={<AlertTriangle className="size-5" />}
        title="Gagal memuat dashboard"
        description="Terjadi kendala saat mengambil data kebun. Muat ulang halaman untuk mencoba lagi."
      />
    );
  }

  const { farm, totals, activePlantings, plotsNeedingAttention, nextActions, familyRotationSnapshot } = data;

  return (
    <div className="space-y-5">
      {/* Hero ringkasan */}
      <div className="relative overflow-hidden rounded-3xl bg-leaf-800 p-5 text-white sm:p-7">
        <div className="absolute inset-0 opacity-25 [background:radial-gradient(600px_300px_at_10%_0%,#8ed6aa,transparent_60%),radial-gradient(500px_260px_at_90%_100%,#c49a6f,transparent_60%)]" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-leaf-100/80">
              <Sparkles className="size-3.5" /> Dashboard Kebun
            </p>
            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {farm ? farm.name : "Kebun Anda"}
            </h1>
            {farm?.location ? (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-leaf-100/85">
                <MapPin className="size-3.5" /> {farm.location}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="ts-chip bg-white/15 text-white">{totals.plots} petak</span>
              <span className="ts-chip bg-white/15 text-white">
                {totals.activePlantings} tanaman aktif
              </span>
              <span className="ts-chip bg-white/15 text-white">
                {totals.harvestedPlantings} musim selesai
              </span>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-leaf-100/80">
              Rata-rata skor tanah
            </p>
            <p className="mt-1 text-3xl font-extrabold">
              {totals.avgSoilScore ?? "—"}
              <span className="text-base font-semibold text-leaf-100/70">/100</span>
            </p>
            <p className="text-[11px] text-leaf-100/70">{totals.soilTests} hasil uji tanah tercatat</p>
          </div>
        </div>
      </div>

      {/* Statistik */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Layers className="size-5" />} label="Jumlah petak" value={String(totals.plots)} sub={`Total luas ${totals.totalArea} m²`} />
        <StatCard icon={<Sprout className="size-5" />} label="Tanaman aktif" value={String(totals.activePlantings)} sub="Sedang tumbuh di kebun" tone="clay" />
        <StatCard icon={<Ruler className="size-5" />} label="Luas dikelola" value={`${totals.totalArea} m²`} sub={farm ? `${farm.plotCount} petak dalam kebun` : undefined} tone="sky" />
        <StatCard
          icon={<FlaskConical className="size-5" />}
          label="Skor tanah rata-rata"
          value={totals.avgSoilScore !== null ? `${totals.avgSoilScore}/100` : "Belum ada"}
          sub="Berdasarkan uji tanah terbaru"
          tone="amber"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Aksi berikutnya */}
        <Card className="lg:col-span-2">
          <SectionTitle
            icon={<CalendarClock className="size-5" />}
            title="Aksi Berikutnya"
            description="Daftar prioritas yang perlu Anda kerjakan minggu ini."
          />
          {nextActions.length === 0 ? (
            <EmptyState
              icon={<CircleCheck className="size-5" />}
              title="Semua beres!"
              description="Tidak ada tugas mendesak. Nikmati kebun Anda dan rencanakan musim berikutnya."
            />
          ) : (
            <ol className="space-y-2.5">
              {nextActions.map((action) => {
                const meta = actionMeta[action.kind];
                const Icon = meta.icon;
                const urgent = action.priority <= 2;
                return (
                  <li
                    key={action.id}
                    className={`flex items-start gap-3 rounded-2xl border p-3 ${
                      urgent ? "border-amber-200 bg-amber-50/60" : "border-leaf-100 bg-white"
                    }`}
                  >
                    <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${meta.tone}`}>
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-leaf-900">{action.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-leaf-800/70">{action.detail}</p>
                    </div>
                    {action.plotId ? (
                      <Link
                        href={`/petak/${action.plotId}`}
                        className="ts-btn ts-btn-ghost shrink-0 px-2.5 py-1.5 text-xs"
                      >
                        Buka <ArrowRight className="size-3" />
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          )}
        </Card>

        {/* Tanaman aktif */}
        <Card>
          <SectionTitle icon={<Sprout className="size-5" />} title="Tanaman Aktif" description="Perkiraan panen terdekat." />
          {activePlantings.length === 0 ? (
            <EmptyState
              icon={<Sprout className="size-5" />}
              title="Belum ada tanaman aktif"
              description="Tambahkan catatan tanam pada petak Anda untuk mulai memantau musim tanam."
            />
          ) : (
            <div className="space-y-3">
              {activePlantings.map((item) => {
                const progress = Math.min(100, Math.round((item.daysPlanted / item.growthDays) * 100));
                const ready = relativeDays(item.expectedHarvest) === "hari ini" || progress >= 100;
                return (
                  <Link
                    key={item.id}
                    href={`/petak/${item.plotId}`}
                    className="block rounded-2xl border border-leaf-100 p-3 transition hover:border-leaf-300 hover:bg-leaf-50/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-leaf-900">{item.cropName}</p>
                        <p className="truncate text-[11px] text-leaf-800/70">{item.plotName}</p>
                      </div>
                      <Badge tone={ready ? "amber" : "leaf"}>
                        {ready ? "Siap panen" : relativeDays(item.expectedHarvest)}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <Progress value={progress} tone={ready ? "amber" : "leaf"} />
                      <div className="mt-1 flex justify-between text-[11px] text-leaf-800/65">
                        <span>Hari ke-{item.daysPlanted} dari {item.growthDays}</span>
                        <span>{formatDate(item.expectedHarvest)}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone="clay">{item.familyName}</Badge>
                      <Badge tone={demandTone(item.nutrientDemand)}>{demandLabel(item.nutrientDemand)}</Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Kesehatan tanah per petak */}
        <Card>
          <SectionTitle
            icon={<FlaskConical className="size-5" />}
            title="Kesehatan Tanah per Petak"
            description="Diurutkan dari yang paling membutuhkan perhatian."
          />
          {plotsNeedingAttention.length === 0 ? (
            <EmptyState
              icon={<Layers className="size-5" />}
              title="Belum ada petak"
              description="Buat petak pertama Anda untuk mulai memantau kesehatan tanah."
            />
          ) : (
            <div className="space-y-2.5">
              {plotsNeedingAttention.map((row) => (
                <Link
                  key={row.plotId}
                  href={`/petak/${row.plotId}`}
                  className="flex items-center gap-3 rounded-2xl border border-leaf-100 p-3 transition hover:bg-leaf-50/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-leaf-900">{row.plotName}</p>
                    <p className="text-[11px] text-leaf-800/65">{row.reason}</p>
                  </div>
                  <div className="w-24">
                    {row.soilScore === null ? (
                      <Badge tone="slate">Belum diuji</Badge>
                    ) : (
                      <>
                        <p className="text-right text-sm font-extrabold text-leaf-900">{row.soilScore}</p>
                        <Progress
                          value={row.soilScore}
                          tone={row.soilScore >= 70 ? "leaf" : row.soilScore >= 45 ? "amber" : "red"}
                        />
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Sebaran keluarga botani */}
        <Card>
          <SectionTitle
            icon={<Sparkles className="size-5" />}
            title="Sebaran Keluarga Botani Aktif"
            description="Rotasi sehat = banyak keluarga botani berbeda."
          />
          {familyRotationSnapshot.length === 0 ? (
            <EmptyState
              icon={<Sprout className="size-5" />}
              title="Belum ada data"
              description="Sebaran keluarga botani akan muncul setelah Anda mencatat penanaman aktif."
            />
          ) : (
            <div className="space-y-2.5">
              {familyRotationSnapshot.map((row) => (
                <div key={row.familyName} className="rounded-2xl border border-leaf-100 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-leaf-900">{row.familyName}</p>
                    <Badge tone="clay">{row.plantCount} petak</Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-leaf-800/65">{row.plotNames.join(", ")}</p>
                </div>
              ))}
              <p className="mt-1 text-[11px] leading-relaxed text-leaf-800/60">
                Hari ini: {formatDate(today)}. Idealnya satu petak tidak menanam keluarga botani yang
                sama secara berturut-turut.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
