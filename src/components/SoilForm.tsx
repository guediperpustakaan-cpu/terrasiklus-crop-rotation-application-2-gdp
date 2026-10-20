"use client";

import { useState } from "react";
import { FlaskConical, Save } from "lucide-react";
import { Button, ErrorNote, Field, Modal } from "@/components/ui/primitives";
import { useCreateSoilTest } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { analyzeSoilTest } from "@/lib/soil";
import { todayIso } from "@/lib/format";
import type { PlotDto } from "@/lib/types";

const DEFAULTS = { ph: 6.5, n: 45, p: 40, k: 45, organicMatter: 3.5 };

export function SoilForm({ open, onClose, plot }: { open: boolean; onClose: () => void; plot: PlotDto }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Catat Hasil Uji Tanah"
      description={`${plot.name} · masukkan hasil pengukuran terbaru Anda`}
    >
      {open ? <SoilFormBody key="soil-form-" plot={plot} onClose={onClose} /> : null}
    </Modal>
  );
}

function SoilFormBody({ plot, onClose }: { plot: PlotDto; onClose: () => void }) {
  const toast = useToast();
  const createSoilTest = useCreateSoilTest(plot.id);

  const [testedOn, setTestedOn] = useState(() => todayIso());
  const [ph, setPh] = useState(() => {
    const latest = plot.latestSoilTest;
    return latest ? Math.round(latest.ph * 10) / 10 : DEFAULTS.ph;
  });
  const [n, setN] = useState(() => {
    const latest = plot.latestSoilTest;
    return Math.round(latest?.n ?? DEFAULTS.n);
  });
  const [p, setP] = useState(() => {
    const latest = plot.latestSoilTest;
    return Math.round(latest?.p ?? DEFAULTS.p);
  });
  const [k, setK] = useState(() => {
    const latest = plot.latestSoilTest;
    return Math.round(latest?.k ?? DEFAULTS.k);
  });
  const [organicMatter, setOrganicMatter] = useState(() => {
    const latest = plot.latestSoilTest;
    return latest ? Math.round(latest.organicMatter * 10) / 10 : DEFAULTS.organicMatter;
  });
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const preview = analyzeSoilTest({
    id: 0,
    plotId: plot.id,
    testedOn,
    ph,
    n,
    p,
    k,
    organicMatter,
    notes: null,
  });

  const submit = async () => {
    setError(null);
    try {
      const result = await createSoilTest.mutateAsync({
        plotId: plot.id,
        testedOn,
        ph,
        n,
        p,
        k,
        organicMatter,
        notes: notes.trim() || null,
      });
      toast.push({
        tone: (result.analysis?.score ?? 0) >= 60 ? "success" : "warning",
        title: `Hasil uji tanah tersimpan · skor ${result.analysis?.score ?? "-"}/100`,
        description: result.analysis?.suggestions[0] ?? "Kesehatan tanah tercatat.",
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan hasil uji tanah.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tanggal uji">
          <input
            type="date"
            className="ts-input"
            value={testedOn}
            max={todayIso()}
            onChange={(e) => setTestedOn(e.target.value)}
          />
        </Field>
        <Field label={`pH tanah: ${ph.toFixed(1)}`} hint="Kisaran ideal kebanyakan sayuran 6,0 – 7,0">
          <input
            type="range"
            min={3.5}
            max={9}
            step={0.1}
            value={ph}
            onChange={(e) => setPh(Number(e.target.value))}
            className="mt-2 w-full accent-leaf-600"
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Nitrogen (N)" hint="Indeks 0–100">
          <input
            className="ts-input"
            inputMode="numeric"
            value={n}
            onChange={(e) => setN(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
          />
        </Field>
        <Field label="Fosfor (P)" hint="Indeks 0–100">
          <input
            className="ts-input"
            inputMode="numeric"
            value={p}
            onChange={(e) => setP(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
          />
        </Field>
        <Field label="Kalium (K)" hint="Indeks 0–100">
          <input
            className="ts-input"
            inputMode="numeric"
            value={k}
            onChange={(e) => setK(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
          />
        </Field>
      </div>

      <Field
        label="Bahan organik (%)"
        hint="Tanah sehat biasanya 3–6%. Kompos dan mulsa menaikkan nilai ini."
      >
        <input
          className="ts-input sm:w-40"
          inputMode="decimal"
          value={organicMatter}
          onChange={(e) => {
            const raw = e.target.value.replace(",", ".");
            const parsed = Number.parseFloat(raw);
            setOrganicMatter(Number.isFinite(parsed) ? parsed : 0);
          }}
        />
      </Field>

      <Field label="Catatan (opsional)">
        <textarea
          className="ts-input min-h-20"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Misal: sampel diambil dari kedalaman 20 cm, warna tanah coklat gelap"
        />
      </Field>

      {preview ? (
        <div className="rounded-2xl border border-leaf-100 bg-leaf-50/60 p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-leaf-700">
            <FlaskConical className="size-3.5" /> Pratinjau skor kesehatan tanah
          </p>
          <p className="mt-1 text-lg font-extrabold text-leaf-900">
            {preview.score}/100 <span className="text-sm font-semibold text-leaf-800/70">({preview.grade})</span>
          </p>
          <ul className="mt-2 space-y-1">
            {preview.suggestions.slice(0, 3).map((suggestion) => (
              <li key={suggestion} className="flex gap-2 text-xs leading-relaxed text-leaf-900/80">
                <span className="text-leaf-600">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? <ErrorNote message={error} /> : null}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Batal
        </Button>
        <Button onClick={submit} loading={createSoilTest.isPending}>
          <Save className="size-4" /> Simpan Hasil Uji
        </Button>
      </div>
    </div>
  );
}