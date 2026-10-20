"use client";

import { useMemo, useState } from "react";
import { Leaf, Search, Sprout, Info } from "lucide-react";
import { Badge, Card, EmptyState, SectionTitle, Skeleton } from "@/components/ui/primitives";
import { useCrops, useFamilies } from "@/lib/api-client";
import { demandLabel, demandTone } from "@/lib/format";
import type { NutrientDemand } from "@/lib/types";

const DEMAND_FILTERS: Array<{ value: "semua" | NutrientDemand; label: string }> = [
  { value: "semua", label: "Semua" },
  { value: "tinggi", label: "Hara berat" },
  { value: "sedang", label: "Hara sedang" },
  { value: "rendah", label: "Hara ringan" },
];

export default function CropCatalogPage() {
  const cropsQuery = useCrops();
  const familiesQuery = useFamilies();
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState("semua");
  const [demand, setDemand] = useState<"semua" | NutrientDemand>("semua");

  const crops = useMemo(() => cropsQuery.data?.crops ?? [], [cropsQuery.data?.crops]);
  const families = useMemo(() => familiesQuery.data?.families ?? [], [familiesQuery.data?.families]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return crops.filter((crop) => {
      if (family !== "semua" && crop.familyName !== family) return false;
      if (demand !== "semua" && crop.nutrientDemand !== demand) return false;
      if (
        keyword &&
        !crop.commonName.toLowerCase().includes(keyword) &&
        !crop.familyName.toLowerCase().includes(keyword)
      ) {
        return false;
      }
      return true;
    });
  }, [crops, family, demand, search]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-leaf-900">Katalog Tanaman</h1>
        <p className="mt-1 text-sm text-leaf-800/70">
          Referensi tanaman beserta keluarga botani, tingkat kebutuhan hara, dan kisaran pH ideal.
        </p>
      </div>

      <Card>
        <SectionTitle
          icon={<Leaf className="size-5" />}
          title="Keluarga Botani"
          description="Dasar dari mesin rotasi: tanaman sekeluarga menyerang hama dan menyerap hara yang mirip."
        />
        {familiesQuery.isLoading ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {families.map((fam) => (
              <button
                key={fam.id}
                type="button"
                onClick={() => setFamily(family === fam.name ? "semua" : fam.name)}
                className={`rounded-2xl border p-3 text-left transition ${
                  family === fam.name
                    ? "border-leaf-400 bg-leaf-50 ring-1 ring-leaf-200"
                    : "border-leaf-100 bg-white hover:border-leaf-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-leaf-900">{fam.name}</p>
                  <Badge tone="slate">{fam.cropCount ?? 0}</Badge>
                </div>
                {fam.localName ? (
                  <p className="text-[11px] font-medium text-clay-700">{fam.localName}</p>
                ) : null}
                {fam.isNitrogenFixer ? (
                  <p className="mt-1 text-[11px] font-semibold text-sky-700">Legum pengikat nitrogen</p>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle
          icon={<Sprout className="size-5" />}
          title="Daftar Tanaman"
          description={`${filtered.length} tanaman ditampilkan`}
        />

        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-leaf-800/40" />
            <input
              className="ts-input pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari tanaman, misal: tomat, kacang, wortel…"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {DEMAND_FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setDemand(item.value)}
                className={`ts-chip transition ${
                  demand === item.value ? "bg-leaf-600 text-white" : "bg-leaf-50 text-leaf-800 hover:bg-leaf-100"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {cropsQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Search className="size-5" />}
            title="Tidak ditemukan"
            description="Coba kata kunci lain atau reset filter keluarga botani dan kebutuhan hara."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((crop) => (
              <div key={crop.id} className="ts-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-leaf-900">{crop.commonName}</h3>
                  {crop.isNitrogenFixer ? <Badge tone="sky">Legum</Badge> : null}
                </div>
                <p className="mt-0.5 text-[11px] font-semibold text-clay-700">
                  {crop.familyName}
                  {crop.familyLocalName ? ` · ${crop.familyLocalName}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone={demandTone(crop.nutrientDemand)}>{demandLabel(crop.nutrientDemand)}</Badge>
                  <Badge tone="slate">{crop.growthDays} hari</Badge>
                  <Badge tone="leaf">pH {crop.idealPhMin}–{crop.idealPhMax}</Badge>
                </div>
                {crop.notes ? (
                  <p className="mt-2 flex gap-1.5 text-[11px] leading-relaxed text-leaf-800/70">
                    <Info className="mt-0.5 size-3 shrink-0" />
                    <span>{crop.notes}</span>
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
