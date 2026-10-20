"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert, Sprout } from "lucide-react";
import { Badge, Button, ErrorNote, Field, Modal } from "@/components/ui/primitives";
import { useCreatePlanting } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { evaluatePlanting } from "@/lib/rotation";
import { demandLabel, demandTone, todayIso } from "@/lib/format";
import type { CropDto, PlantingDto, PlotDto } from "@/lib/types";

const levelStyle = {
  aman: {
    wrapper: "border-leaf-200 bg-leaf-50",
    Icon: CheckCircle2,
    title: "text-leaf-800",
  },
  peringatan: {
    wrapper: "border-amber-200 bg-amber-50",
    Icon: AlertTriangle,
    title: "text-amber-800",
  },
  berbahaya: {
    wrapper: "border-red-200 bg-red-50",
    Icon: ShieldAlert,
    title: "text-red-800",
  },
} as const;

export function PlantingForm({
  open,
  onClose,
  plot,
  crops,
  plantings,
  preselectedCropId,
}: {
  open: boolean;
  onClose: () => void;
  plot: PlotDto;
  crops: CropDto[];
  plantings: PlantingDto[];
  preselectedCropId?: number | null;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Catat Penanaman Baru"
      description={`${plot.name} · ${plot.area} ${plot.areaUnit} · tanah ${plot.soilType}`}
    >
      {open ? (
        <PlantingFormBody
          key={preselectedCropId ?? "kosong"}
          plot={plot}
          crops={crops}
          plantings={plantings}
          preselectedCropId={preselectedCropId ?? null}
          onClose={onClose}
        />
      ) : null}
    </Modal>
  );
}

function PlantingFormBody({
  plot,
  crops,
  plantings,
  preselectedCropId,
  onClose,
}: {
  plot: PlotDto;
  crops: CropDto[];
  plantings: PlantingDto[];
  preselectedCropId: number | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const createPlanting = useCreatePlanting();

  const [cropId, setCropId] = useState<string>(preselectedCropId ? String(preselectedCropId) : "");
  const [plantedOn, setPlantedOn] = useState(() => todayIso());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedCrop = useMemo(
    () => crops.find((crop) => crop.id === Number(cropId)) ?? null,
    [crops, cropId],
  );

  const evaluation = useMemo(
    () => (selectedCrop ? evaluatePlanting(selectedCrop, plantings, plantedOn) : null),
    [selectedCrop, plantings, plantedOn],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, CropDto[]>();
    for (const crop of crops) {
      const list = map.get(crop.familyName) ?? [];
      list.push(crop);
      map.set(crop.familyName, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [crops]);

  const submit = async (force: boolean) => {
    setError(null);
    if (!selectedCrop) {
      setError("Pilih tanaman yang akan ditanam.");
      return;
    }
    try {
      const result = await createPlanting.mutateAsync({
        plotId: plot.id,
        cropId: selectedCrop.id,
        plantedOn,
        notes: notes.trim() || null,
        force,
      });
      toast.push({
        tone: result.evaluation.level === "aman" ? "success" : "warning",
        title: `Tanaman dicatat: ${selectedCrop.commonName}`,
        description: result.evaluation.message,
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal mencatat tanaman.";
      setError(message);
    }
  };

  const canSubmitSafely = !evaluation || evaluation.level !== "berbahaya";

  return (
    <div className="space-y-4">
      {plot.activePlanting ? (
        <ErrorNote
          message={`Petak ini masih ditanami ${plot.activePlanting.cropName} sejak ${plot.activePlanting.plantedOn}. Catat panen terlebih dahulu.`}
        />
      ) : null}

      <Field label="Tanaman">
        <select className="ts-input" value={cropId} onChange={(e) => setCropId(e.target.value)}>
          <option value="">— Pilih tanaman —</option>
          {grouped.map(([family, list]) => (
            <optgroup key={family} label={family}>
              {list.map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {crop.commonName} · {demandLabel(crop.nutrientDemand)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>

      {selectedCrop ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="clay">{selectedCrop.familyName}</Badge>
          <Badge tone={demandTone(selectedCrop.nutrientDemand)}>{demandLabel(selectedCrop.nutrientDemand)}</Badge>
          <Badge tone="slate">{selectedCrop.growthDays} hari</Badge>
          <Badge tone="sky">pH {selectedCrop.idealPhMin}–{selectedCrop.idealPhMax}</Badge>
          {selectedCrop.isNitrogenFixer ? <Badge tone="leaf">Legum pengikat N</Badge> : null}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tanggal tanam">
          <input
            type="date"
            className="ts-input"
            value={plantedOn}
            max={todayIso()}
            onChange={(e) => setPlantedOn(e.target.value)}
          />
        </Field>
        <Field label="Catatan hama / penyakit (opsional)">
          <input
            className="ts-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Misal: daun berlubang sedikit, diberi mulsa"
          />
        </Field>
      </div>

      {evaluation ? (
        <div className={`rounded-2xl border p-4 ${levelStyle[evaluation.level].wrapper}`}>
          <div className="flex items-start gap-3">
            {(() => {
              const Icon = levelStyle[evaluation.level].Icon;
              return <Icon className={`mt-0.5 size-5 shrink-0 ${levelStyle[evaluation.level].title}`} />;
            })()}
            <div className="min-w-0">
              <p className={`text-sm font-bold ${levelStyle[evaluation.level].title}`}>{evaluation.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-leaf-900/80">{evaluation.message}</p>
              {evaluation.advice ? (
                <p className="mt-1.5 text-xs leading-relaxed text-leaf-900/70">
                  <strong>Saran:</strong> {evaluation.advice}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {error ? <ErrorNote message={error} /> : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Batal
        </Button>
        {canSubmitSafely ? (
          <Button onClick={() => submit(false)} loading={createPlanting.isPending}>
            <Sprout className="size-4" /> Catat Tanaman
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              onClick={() => setCropId("")}
              disabled={createPlanting.isPending}
            >
              Pilih Tanaman Lain
            </Button>
            <Button variant="danger" onClick={() => submit(true)} loading={createPlanting.isPending}>
              <ShieldAlert className="size-4" /> Tetap Tanam (Saya Paham Risikonya)
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
