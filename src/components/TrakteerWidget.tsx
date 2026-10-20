"use client";

import { useState } from "react";
import { Coffee, X } from "lucide-react";
import { Button, Modal } from "@/components/ui/primitives";

const TRAKTEER_USERNAME = "perpus_opera";

const NOMINALS = [6000, 12000, 18000, 24000, 30000, 50000];

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

export function TrakteerWidget() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg ring-2 ring-white hover:scale-105 transition-transform"
      >
        <Coffee className="size-4" />
        Kopi untuk server?
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Dukung TerraSiklus" wide>
        <div className="space-y-4">
          <p className="text-sm text-leaf-900/80">
            Web app ini gratis & bebas iklan. Kopi kecil, server tetap jalan. Pilih nominal atau scan QR di bawah.
          </p>

          <div className="flex flex-wrap gap-2">
            {NOMINALS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setSelected(amount)}
                className={`rounded-xl border px-3.5 py-2 text-center text-sm font-semibold transition ${
                  selected === amount
                    ? "border-orange-500 bg-orange-100 text-orange-800"
                    : "border-leaf-100 bg-white text-leaf-800 hover:border-orange-300"
                }`}
              >
                {formatRupiah(amount)}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-leaf-100 bg-white p-4 text-center">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-leaf-700">Scan QR untuk traktiran {selected ? formatRupiah(selected) : ""}</p>
            {selected ? (
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="rounded-xl border border-leaf-100 bg-white p-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(
                      `https://trakteer.id/${TRAKTEER_USERNAME}/tip?amount=${selected}`,
                    )}`}
                    alt={`QR traktiran ${formatRupiah(selected)}`}
                    className="h-auto w-48"
                  />
                </div>
                <a
                  href={`https://trakteer.id/${TRAKTEER_USERNAME}/tip?amount=${selected}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-orange-700 underline hover:text-orange-900"
                >
                  Buka di Trakteer
                </a>
              </div>
            ) : (
              <p className="text-xs text-leaf-800/60">Pilih nominal di atas untuk menampilkan QR.</p>
            )}
          </div>

          <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
            <p className="text-xs leading-relaxed text-orange-900/90">
              Dukungan kamu akan membantu menutup biaya hosting, domain, dan kopi biar semangat ngoding tetap menyala. Trakteer
              mendukung pembayaran kartu, e-wallet, hingga QRIS.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} size="sm">
              <X className="size-4" /> Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}