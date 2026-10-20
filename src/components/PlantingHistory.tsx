"use client";

import { useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  NotebookPen,
  Sprout,
  Trash2,
} from "lucide-react";
import { Badge, Button, Card, EmptyState, Field, Modal, SectionTitle } from "@/components/ui/primitives";
import { useDeletePlanting, useUpdatePlanting } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { daysBetween, formatDate, todayIso } from "@/lib/format";
import { demandLabel, demandTone } from "@/lib/format";
import type { PlantingDto, PlotDto } from "@/lib/types";

export function PlantingHistory({
  plot,
  plantings,
  onPlant,
}: {
  plot: PlotDto;
  plantings: PlantingDto[];
  onPlant?: () => void;
}) {
  const toast = useToast();
  const updatePlanting = useUpdatePlanting(plot.id);
  const deletePlanting = useDeletePlanting(plot.id);
  const [harvestTarget, setHarvestTarget] = useState<PlantingDto | null>(null);
  const [harvestDate, setHarvestDate] = useState(todayIso());

  const today = todayIso();

  const saveHarvest = async () => {
    if (!harvestTarget) return;
    if (harvestDate < harvestTarget.plantedOn) {
      toast.push({
        tone: "error",
        title: "Tanggal panen tidak valid",
        description: "Tanggal panen tidak boleh sebelum tanggal tanam.",
      });
      return;
    }
    try {
      await updatePlanting.mutateAsync({ id: harvestTarget.id, harvestedOn: harvestDate });
      toast.push({
        tone: "success",
        title: `Panen ${harvestTarget.cropName} tercatat`,
        description: "Petak kini siap untuk rencana rotasi musim berikutnya.",
      });
      setHarvestTarget(null);
    } catch (err) {
      toast.push({
        tone: "error",
        title: "Gagal menyimpan panen",
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const removePlanting = async (planting: PlantingDto) => {
    try {
      await deletePlanting.mutateAsync(planting.id);
      toast.push({ tone: "info", title: `Riwayat ${planting.cropName} dihapus` });
    } catch (err) {
      toast.push({
        tone: "error",
        title: "Gagal menghapus riwayat",
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  return (
    <Card>
      <SectionTitle
        icon={<NotebookPen className="size-5" />}
        title="Riwayat Penanaman"
        description={`${plantings.length} catatan musim tanam di ${plot.name}`}
        action={
          onPlant ? (
            <Button onClick={onPlant} size="sm">
              <Sprout className="size-3.5" /> Catat Tanam
            </Button>
          ) : null
        }
      />

      {plantings.length === 0 ? (
        <EmptyState
          icon={<Sprout className="size-5" />}
          title="Belum ada catatan tanam"
          description="Setiap catatan tanam membantu mesin rotasi memahami riwayat keluarga botani di petak ini."
          action={
            onPlant ? (
              <Button onClick={onPlant}>
                <Sprout className="size-4" /> Catat Tanam Pertama
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-2.5">
          {plantings.map((planting) => {
            const active = !planting.harvestedOn;
            const expected = (() => {
              const date = new Date(`${planting.plantedOn}T00:00:00Z`);
              date.setUTCDate(date.getUTCDate() + planting.growthDays);
              return date.toISOString().slice(0, 10);
            })();
            const overdue = active && daysBetween(expected, today) > 0;
            return (
              <div
                key={planting.id}
                className={`rounded-2xl border p-3 ${
                  active ? "border-leaf-300 bg-leaf-50/60" : "border-leaf-100 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-bold text-leaf-900">{planting.cropName}</p>
                      {active ? (
                        <Badge tone="leaf">
                          <Clock className="size-3" /> Aktif
                        </Badge>
                      ) : (
                        <Badge tone="slate">
                          <CheckCircle2 className="size-3" /> Selesai
                        </Badge>
                      )}
                      {overdue ? <Badge tone="amber">Perkiraan panen lewat</Badge> : null}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge tone="clay">{planting.familyName}</Badge>
                      <Badge tone={demandTone(planting.nutrientDemand)}>{demandLabel(planting.nutrientDemand)}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {active ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setHarvestTarget(planting);
                          setHarvestDate(todayIso());
                        }}
                      >
                        <CalendarCheck className="size-3.5" /> Catat Panen
                      </Button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => removePlanting(planting)}
                      className="ts-btn ts-btn-ghost px-2.5 py-1.5 text-xs text-red-700"
                      aria-label="Hapus riwayat"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 grid gap-x-4 gap-y-1 text-[11px] text-leaf-800/75 sm:grid-cols-3">
                  <span>
                    <strong className="text-leaf-900">Tanam:</strong> {formatDate(planting.plantedOn)}
                  </span>
                  <span>
                    <strong className="text-leaf-900">Panen:</strong>{" "}
                    {planting.harvestedOn ? formatDate(planting.harvestedOn) : `perkiraan ${formatDate(expected)}`}
                  </span>
                  <span>
                    <strong className="text-leaf-900">Durasi:</strong> {planting.growthDays} hari
                  </span>
                </div>

                {planting.notes ? (
                  <p className="mt-2 rounded-xl bg-clay-50 px-2.5 py-1.5 text-[11px] italic leading-relaxed text-clay-800">
                    Catatan: {planting.notes}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={harvestTarget !== null}
        onClose={() => setHarvestTarget(null)}
        title={`Catat Panen — ${harvestTarget?.cropName ?? ""}`}
        description="Tanggal panen menutup siklus tanaman ini dan membuka petak untuk rotasi berikutnya."
      >
        <div className="space-y-4">
          <Field label="Tanggal panen">
            <input
              type="date"
              className="ts-input"
              value={harvestDate}
              min={harvestTarget?.plantedOn}
              max={todayIso()}
              onChange={(e) => setHarvestDate(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setHarvestTarget(null)}>
              Batal
            </Button>
            <Button onClick={saveHarvest} loading={updatePlanting.isPending}>
              <CheckCircle2 className="size-4" /> Simpan Panen
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
