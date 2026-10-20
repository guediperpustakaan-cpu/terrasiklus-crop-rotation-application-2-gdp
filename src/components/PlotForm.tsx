"use client";

import { useEffect, useState } from "react";
import { Save, Sprout, Tractor } from "lucide-react";
import { Button, ErrorNote, Field, Modal } from "@/components/ui/primitives";
import { useCreateFarm, useCreatePlot, useUpdatePlot } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { SOIL_TYPES } from "@/lib/types";
import { todayIso } from "@/lib/format";
import type { FarmDto, PlotDto } from "@/lib/types";

export function PlotForm({
  open,
  onClose,
  farms,
  defaultFarmId,
  plot,
}: {
  open: boolean;
  onClose: () => void;
  farms: FarmDto[];
  defaultFarmId?: number;
  plot?: PlotDto | null;
}) {
  const toast = useToast();
  const createPlot = useCreatePlot();
  const updatePlot = useUpdatePlot(plot?.id ?? 0);

  const [farmId, setFarmId] = useState<string>("");
  const [name, setName] = useState("");
  const [area, setArea] = useState("10");
  const [areaUnit, setAreaUnit] = useState("m2");
  const [soilType, setSoilType] = useState<string>(SOIL_TYPES[0]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (plot) {
      setFarmId(String(plot.farmId));
      setName(plot.name);
      setArea(String(plot.area));
      setAreaUnit(plot.areaUnit);
      setSoilType(plot.soilType);
      setNotes(plot.notes ?? "");
    } else {
      setFarmId(String(defaultFarmId ?? farms[0]?.id ?? ""));
      setName("");
      setArea("10");
      setAreaUnit("m2");
      setSoilType(SOIL_TYPES[0]);
      setNotes("");
    }
  }, [open, plot, defaultFarmId, farms]);

  const submit = async () => {
    setError(null);
    if (name.trim().length < 2) {
      setError("Nama petak minimal 2 karakter.");
      return;
    }
    if (!plot && !farmId) {
      setError("Pilih kebun terlebih dahulu. Buat kebun baru bila belum ada.");
      return;
    }
    const areaValue = Number.parseFloat(area.replace(",", "."));
    if (!Number.isFinite(areaValue) || areaValue < 0) {
      setError("Luas petak harus berupa angka.");
      return;
    }

    try {
      if (plot) {
        await updatePlot.mutateAsync({
          name: name.trim(),
          area: areaValue,
          areaUnit,
          soilType,
          notes: notes.trim() || null,
        });
        toast.push({ tone: "success", title: "Petak diperbarui", description: name.trim() });
      } else {
        await createPlot.mutateAsync({
          farmId: Number(farmId),
          name: name.trim(),
          area: areaValue,
          areaUnit,
          soilType,
          notes: notes.trim() || null,
        });
        toast.push({ tone: "success", title: "Petak ditambahkan", description: name.trim() });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan petak.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={plot ? "Ubah Petak" : "Tambah Petak Baru"}
      description="Petak adalah bedeng kecil di kebun Anda yang dikelola secara terpisah dalam rotasi tanam."
    >
      <div className="space-y-4">
        {!plot ? (
          <Field label="Kebun" hint="Petak akan dikelompokkan dalam kebun ini.">
            <select className="ts-input" value={farmId} onChange={(e) => setFarmId(e.target.value)}>
              {farms.length === 0 ? <option value="">Belum ada kebun</option> : null}
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name}
                  {farm.location ? ` — ${farm.location}` : ""}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        <Field label="Nama petak" hint="Contoh: Petak A — Sayuran Buah">
          <input
            className="ts-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Petak A"
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Luas" className="col-span-2">
            <input
              className="ts-input"
              value={area}
              inputMode="decimal"
              onChange={(e) => setArea(e.target.value)}
              placeholder="12"
            />
          </Field>
          <Field label="Satuan">
            <select className="ts-input" value={areaUnit} onChange={(e) => setAreaUnit(e.target.value)}>
              <option value="m2">m²</option>
              <option value="hektar">hektar</option>
              <option value="pot">pot</option>
            </select>
          </Field>
        </div>

        <Field label="Jenis tanah" hint="Jenis tanah memengaruhi drainase dan pilihan tanaman.">
          <select className="ts-input" value={soilType} onChange={(e) => setSoilType(e.target.value)}>
            {SOIL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Catatan (opsional)">
          <textarea
            className="ts-input min-h-20"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Misal: dekat sumur, naikan bahan organik tiap musim"
          />
        </Field>

        {error ? <ErrorNote message={error} /> : null}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={submit}
            loading={createPlot.isPending || updatePlot.isPending}
            disabled={farms.length === 0 && !plot}
          >
            <Save className="size-4" /> {plot ? "Simpan Perubahan" : "Tambah Petak"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function FarmForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const createFarm = useCreateFarm();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setLocation("");
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    setError(null);
    if (name.trim().length < 2) {
      setError("Nama kebun minimal 2 karakter.");
      return;
    }
    try {
      const result = await createFarm.mutateAsync({ name: name.trim(), location: location.trim() || null });
      toast.push({
        tone: "success",
        title: "Kebun dibuat",
        description: `${result.farm.name}${result.farm.location ? ` — ${result.farm.location}` : ""}`,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat kebun.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buat Kebun Baru"
      description="Kebun adalah wadah untuk beberapa petak tanam Anda."
    >
      <div className="space-y-4">
        <Field label="Nama kebun" hint="Contoh: Kebun Rumah Bu Sari">
          <input
            className="ts-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kebun Rumah"
          />
        </Field>
        <Field label="Lokasi (opsional)">
          <input
            className="ts-input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Bandung, Jawa Barat"
          />
        </Field>
        {error ? <ErrorNote message={error} /> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={submit} loading={createFarm.isPending}>
            <Tractor className="size-4" /> Buat Kebun
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function PlotQuickStats({ plot }: { plot: PlotDto }) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="ts-chip bg-leaf-100 text-leaf-800">
        <Sprout className="size-3" /> {plot.soilType}
      </span>
      <span className="ts-chip bg-clay-100 text-clay-800">
        {plot.area} {plot.areaUnit}
      </span>
      <span className="ts-chip bg-slate-100 text-slate-700">Dibuat {todayIso() === plot.createdAt.slice(0, 10) ? "hari ini" : plot.createdAt.slice(0, 10)}</span>
    </div>
  );
}
