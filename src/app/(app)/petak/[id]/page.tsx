"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  CalendarCheck,
  FlaskConical,
  Layers,
  MapPin,
  Pencil,
  Recycle,
  Ruler,
  Sprout,
} from "lucide-react";
import { PlantingForm } from "@/components/PlantingForm";
import { PlantingHistory } from "@/components/PlantingHistory";
import { PlotForm } from "@/components/PlotForm";
import { RotationEngine } from "@/components/RotationEngine";
import { SoilForm } from "@/components/SoilForm";
import { SoilStatusPanel } from "@/components/SoilStatusPanel";
import { Badge, Button, Card, EmptyState, SectionTitle, Skeleton } from "@/components/ui/primitives";
import { useCrops, useFarms, usePlot } from "@/lib/api-client";
import { formatDate } from "@/lib/format";

export default function PlotDetailPage() {
  const params = useParams<{ id: string }>();
  const plotId = Number(params?.id);
  const validId = Number.isFinite(plotId) && plotId > 0;

  const plotQuery = usePlot(validId ? plotId : null);
  const cropsQuery = useCrops();
  const farmsQuery = useFarms();

  const [plantOpen, setPlantOpen] = useState(false);
  const [soilOpen, setSoilOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  if (!validId) {
    return (
      <EmptyState
        icon={<Sprout className="size-5" />}
        title="Petak tidak ditemukan"
        description="Alamat halaman tidak valid."
        action={
          <Link href="/petak" className="ts-btn ts-btn-primary">
            Kembali ke daftar petak
          </Link>
        }
      />
    );
  }

  if (plotQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (plotQuery.isError || !plotQuery.data) {
    return (
      <EmptyState
        icon={<Sprout className="size-5" />}
        title="Petak tidak ditemukan"
        description="Petak mungkin sudah dihapus. Kembali ke daftar petak untuk memilih yang lain."
        action={
          <Link href="/petak" className="ts-btn ts-btn-primary">
            Kembali ke daftar petak
          </Link>
        }
      />
    );
  }

  const { plot, plantings, soilTests } = plotQuery.data;
  const farms = farmsQuery.data?.farms ?? [];
  const crops = cropsQuery.data?.crops ?? [];

  return (
    <div className="space-y-5">
      <Link
        href="/petak"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-leaf-700 transition hover:text-leaf-900"
      >
        <ArrowLeft className="size-3.5" /> Kembali ke daftar petak
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-clay-600">
              <MapPin className="size-3" /> {plot.farmName}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-leaf-900">{plot.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge tone="leaf">
                <Ruler className="size-3" /> {plot.area} {plot.areaUnit}
              </Badge>
              <Badge tone="clay">
                <Layers className="size-3" /> Tanah {plot.soilType}
              </Badge>
              <Badge tone="slate">{plantings.length} riwayat tanam</Badge>
              <Badge tone="slate">{soilTests.length} uji tanah</Badge>
            </div>
            {plot.notes ? (
              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-leaf-800/70">{plot.notes}</p>
            ) : null}
            {plot.activePlanting ? (
              <div className="mt-3 rounded-2xl border border-leaf-200 bg-leaf-50 p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-leaf-700">
                  <Sprout className="size-3.5" /> Sedang ditanami
                </p>
                <p className="mt-1 text-sm font-bold text-leaf-900">
                  {plot.activePlanting.cropName}{" "}
                  <span className="text-xs font-medium text-leaf-800/60">
                    ({plot.activePlanting.familyName})
                  </span>
                </p>
                <p className="text-[11px] text-leaf-800/70">
                  Ditanam {formatDate(plot.activePlanting.plantedOn)} ·{" "}
                  {plot.activePlanting.growthDays} hari perkiraan musim
                </p>
              </div>
            ) : (
              <p className="mt-3 rounded-2xl border border-dashed border-clay-300 bg-clay-50 p-3 text-xs font-semibold text-clay-800">
                Petak ini kosong dan siap untuk musim berikutnya — lihat rekomendasi rotasi di bawah.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={() => setPlantOpen(true)} disabled={Boolean(plot.activePlanting)}>
              <Sprout className="size-4" /> Catat Tanam
            </Button>
            <Button variant="ghost" onClick={() => setSoilOpen(true)}>
              <FlaskConical className="size-4" /> Uji Tanah
            </Button>
            <Button variant="ghost" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" /> Ubah Petak
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RotationEngine plot={plot} plantings={plantings} />
        </div>
        <div className="space-y-5">
          <SoilStatusPanel soilTests={soilTests} onAdd={() => setSoilOpen(true)} />
          <Card>
            <SectionTitle
              icon={<CalendarCheck className="size-5" />}
              title="Tips cepat"
              description="Ringkasan praktis untuk petak ini."
            />
            <ul className="space-y-2 text-xs leading-relaxed text-leaf-900/80">
              <li className="flex gap-2">
                <Recycle className="mt-0.5 size-3.5 shrink-0 text-leaf-600" />
                <span>Ganti keluarga botani setiap musim untuk memutus siklus hama tanah.</span>
              </li>
              <li className="flex gap-2">
                <Sprout className="mt-0.5 size-3.5 shrink-0 text-leaf-600" />
                <span>Tanam legum (Fabaceae) setelah tanaman rakus hara untuk memulihkan nitrogen.</span>
              </li>
              <li className="flex gap-2">
                <FlaskConical className="mt-0.5 size-3.5 shrink-0 text-leaf-600" />
                <span>Uji tanah setiap 6 bulan agar rekomendasi hara tetap relevan.</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      <PlantingHistory
        plot={plot}
        plantings={plantings}
        onPlant={plot.activePlanting ? undefined : () => setPlantOpen(true)}
      />

      <PlantingForm
        open={plantOpen}
        onClose={() => setPlantOpen(false)}
        plot={plot}
        crops={crops}
        plantings={plantings}
      />
      <SoilForm open={soilOpen} onClose={() => setSoilOpen(false)} plot={plot} />
      <PlotForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        farms={farms}
        defaultFarmId={plot.farmId}
        plot={plot}
      />
    </div>
  );
}
