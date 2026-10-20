"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Leaf, Menu, Sprout, BookOpen, X, Recycle } from "lucide-react";
import { useState, type ReactNode } from "react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "Ringkasan kebun" },
  { href: "/petak", label: "Kebun & Petak", icon: Sprout, desc: "Kelola petak tanam" },
  { href: "/tanaman", label: "Katalog Tanaman", icon: Leaf, desc: "Keluarga botani" },
  { href: "/panduan", label: "Panduan Rotasi", icon: BookOpen, desc: "Cara kerja mesin" },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              active
                ? "bg-leaf-600 text-white shadow-sm"
                : "text-leaf-800 hover:bg-leaf-100/70"
            }`}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar desktop */}
      <aside className="hidden w-72 shrink-0 border-r border-leaf-100 bg-white/80 p-5 backdrop-blur lg:flex lg:flex-col">
        <Link href="/" className="mb-6 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-leaf-600 text-white shadow-sm">
            <Recycle className="size-5" />
          </span>
          <span>
            <span className="block text-base font-extrabold tracking-tight text-leaf-900">TerraSiklus</span>
            <span className="block text-[11px] font-medium text-leaf-800/60">Rotasi tanam cerdas</span>
          </span>
        </Link>
        <NavLinks />
        <div className="mt-auto rounded-2xl border border-leaf-100 bg-leaf-50 p-4">
          <p className="text-xs font-bold text-leaf-900">Aturan emas rotasi</p>
          <p className="mt-1 text-[11px] leading-relaxed text-leaf-800/80">
            Jangan ulangi keluarga botani yang sama pada satu petak dalam 12 bulan. Ganti dengan
            keluarga lain agar hama dan penyakit tanah tidak menumpuk.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar mobile */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-leaf-100 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-leaf-600 text-white">
              <Recycle className="size-4" />
            </span>
            <span className="text-sm font-extrabold tracking-tight text-leaf-900">TerraSiklus</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="ts-btn ts-btn-ghost px-3 py-2"
            aria-label="Buka menu"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </header>

        {open ? (
          <div className="border-b border-leaf-100 bg-white px-4 py-3 lg:hidden">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 sm:py-8">{children}</main>

        <footer className="border-t border-leaf-100 bg-white/70 px-4 py-4 text-center text-[11px] text-leaf-800/60 sm:px-6">
          TerraSiklus · Kalkulator rotasi tanam & pemantau kesehatan tanah untuk petani kecil dan
          pekebun rumahan.
        </footer>
      </div>
    </div>
  );
}
