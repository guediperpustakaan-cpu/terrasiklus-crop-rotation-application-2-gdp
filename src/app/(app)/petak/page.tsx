"use client";

import { useMemo, useState } from "react";
import { FlaskConical, LayoutGrid, Plus, Search, Sprout, Tractor, Trash2 } from "lucide-react";
import { PlotCard } from "@/components/PlotCard";
import { FarmForm, PlotForm } from "@/components/PlotForm";
import { Badge, Button, Card, EmptyState, Modal, SectionTitle, Skeleton } from "@/components/ui/primitives";
import { useDeletePlot, useFarms, usePlots } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import type { PlotDto } from "@/lib/types";

type Filter = "semua" | "aktif" | "kosong" | "perlu-uji";

export default function PlotsPage() {
  const toast = useToast();
  const farmsQuery = useFarms();
  const plotsQuery = usePlots();
  const deletePlot = useDeletePlot();

  const [farmFormOpen, setFarmFormOpen] = useState(false);
  const [plotFormOpen, setPlotFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PlotDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlotDto | null>(null);
  const [filter, setFilter] = useState<Filter>("semua");
  const [search, setSearch] = useState("");

  const farms = farmsQuery.data?.farms ?? [];
  const plots = plotsQuery.data?.plots ?? [];

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return plots.filter((plot) => {
      if (keyword && !plot.name.toLowerCase().includes(keyword) && !plot.soilType.includes(keyword)) {
        return false;
      }
      if (filter === "aktif" && !plot.activePlanting) return false;
      if (filter === "kosong" && plot.activePlanting) return false;
      if (filter === "perlu-uji" && plot.latestSoilTest) return false;
      return true;
    });
  }, [plots, filter, search]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePlot.mutateAsync(deleteTarget.id);
      toast.push({
        tone: "info",
        title: "Petak dihapus",
        description: `${deleteTarget.name} beserta seluruh riwayatnya dihapus.`,
      });
      setDeleteTarget(null);
    } catch (err) {
      toast.push({
        tone: "error",
        title: "Gagal menghapus petak",
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-leaf-900">Kebun &amp; Petak</h1>
          <p className="mt-1 text-sm text-leaf-800/70">
            Kelola kebun Anda dan pecah menjadi petak-petak yang dirotasi secara terpisah.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => setFarmFormOpen(true)}>
            <Tractor className="size-4" /> Kebun Baru
          </Button>
          <Button
            onClick={() => {
              setEditTarget(null);
              setPlotFormOpen(true);
            }}
            disabled={farms.length === 0}
          >
            <Plus className="size-4" /> Tambah Petak
          </Button>
        </div>
      </div>

      {farms.length === 0 && !farmsQuery.isLoading ? (
        <EmptyState
          icon={<Tractor className="size-5" />}
          title="Belum ada kebun"
          description="Buat kebun terlebih dahulu, lalu tambahkan petak-petak di dalamnya."
          action={
            <Button onClick={() => setFarmFormOpen(true)}>
              <Tractor className="size-4" /> Buat Kebun
            </Button>
          }
        />
      ) : null}

      {farms.map((farm) => (
        <Card key={farm.id}>
          <SectionTitle
            icon={<Tractor className="size-5" />}
            title={farm.name}
            description={farm.location ?? "Lokasi belum dicatat"}
            action={
              <Badge tone="clay">
                {farm.plotCount} petak · {farm.totalArea} {farm.areaUnit}
              </Badge>
            }
          />
        </Card>
      ))}

      <Card>
        <SectionTitle
          icon={<LayoutGrid className="size-5" />}
          title="Daftar Petak"
          description={`${filtered.length} dari ${plots.length} petak ditampilkan`}
        />

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-leaf-800/40" />
            <input
              className="ts-input pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama petak atau jenis tanah…"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["semua", "Semua"],
                ["aktif", "Sedang ditanami"],
                ["kosong", "Petak kosong"],
                ["perlu-uji", "Belum uji tanah"],
              ] as Array<[Filter, string]>
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`ts-chip transition ${
                  filter === value ? "bg-leaf-600 text-white" : "bg-leaf-50 text-leaf-800 hover:bg-leaf-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {plotsQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-56" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Sprout className="size-5" />}
            title="Tidak ada petak yang cocok"
            description="Ubah filter atau pencarian, atau tambahkan petak baru untuk mulai berrotasi."
            action={
              <Button
                onClick={() => {
                  setEditTarget(null);
                  setPlotFormOpen(true);
                }}
                disabled={farms.length === 0}
              >
                <Plus className="size-4" /> Tambah Petak
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((plot) => (
              <div key={plot.id} className="flex flex-col gap-2">
                <PlotCard plot={plot} onDelete={(p) => setDeleteTarget(p)} />
                <button
                  type="button"
                  onClick={() => {
                    setEditTarget(plot);
                    setPlotFormOpen(true);
                  }}
                  className="self-start text-[11px] font-semibold text-leaf-700 underline decoration-dotted underline-offset-4 hover:text-leaf-900"
                >
                  Ubah data petak
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {plots.some((plot) => !plot.latestSoilTest) ? (
        <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <FlaskConical className="mt-0.5 size-5 shrink-0 text-sky-700" />
          <p className="text-xs leading-relaxed text-sky-900">
            Ada petak yang belum memiliki data uji tanah. Rekomendasi rotasi tetap berjalan, namun
            penilaian kebutuhan hara akan lebih akurat bila hasil uji tanah dicatat.
          </p>
        </div>
      ) : null}

      <FarmForm open={farmFormOpen} onClose={() => setFarmFormOpen(false)} />
      <PlotForm
        open={plotFormOpen}
        onClose={() => setPlotFormOpen(false)}
        farms={farms}
        defaultFarmId={farms[0]?.id}
        plot={editTarget}
      />

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Hapus petak ini?"
        description="Seluruh riwayat tanam dan uji tanah pada petak ini juga akan dihapus."
      >
        <div className="space-y-4">
          <p className="text-sm text-leaf-900/80">
            Anda akan menghapus <strong>{deleteTarget?.name}</strong> dari kebun{" "}
            <strong>{deleteTarget?.farmName}</strong>. Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={deletePlot.isPending}>
              <Trash2 className="size-4" /> Hapus Permanen
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
