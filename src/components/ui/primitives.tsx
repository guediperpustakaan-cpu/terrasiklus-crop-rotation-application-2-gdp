"use client";

import { Loader2, X } from "lucide-react";
import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`ts-card p-4 sm:p-5 ${className}`}>{children}</div>;
}

export function SectionTitle({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-leaf-100 text-leaf-700">
            {icon}
          </span>
        ) : null}
        <div>
          <h2 className="text-base font-bold text-leaf-900 sm:text-lg">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-leaf-800/70 sm:text-sm">{description}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

const toneClass: Record<string, string> = {
  leaf: "bg-leaf-100 text-leaf-800",
  clay: "bg-clay-100 text-clay-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
  slate: "bg-slate-100 text-slate-700",
  sky: "bg-sky-100 text-sky-800",
};

export function Badge({
  children,
  tone = "leaf",
  className = "",
}: {
  children: ReactNode;
  tone?: keyof typeof toneClass | string;
  className?: string;
}) {
  return <span className={`ts-chip ${toneClass[tone] ?? toneClass.leaf} ${className}`}>{children}</span>;
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
  size = "md",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`ts-btn ts-btn-${variant} ${size === "sm" ? "px-3 py-1.5 text-xs" : ""} ${className}`}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="ts-label">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-leaf-800/60">{hint}</span> : null}
    </label>
  );
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-leaf-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className={`ts-animate-in flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${
          wide ? "sm:max-w-3xl" : "sm:max-w-lg"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-leaf-100 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-leaf-900">{title}</h3>
            {description ? <p className="mt-0.5 text-xs text-leaf-800/70">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-leaf-800/60 transition hover:bg-leaf-50 hover:text-leaf-900"
            aria-label="Tutup"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-leaf-200 bg-leaf-50/50 px-5 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-white text-leaf-600 shadow-sm">{icon}</span>
      <p className="mt-3 text-sm font-semibold text-leaf-900">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-leaf-800/70">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Progress({
  value,
  tone = "leaf",
}: {
  value: number;
  tone?: "leaf" | "amber" | "red" | "clay";
}) {
  const color =
    tone === "red"
      ? "bg-red-500"
      : tone === "amber"
        ? "bg-amber-500"
        : tone === "clay"
          ? "bg-clay-500"
          : "bg-leaf-500";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-leaf-100">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  sub,
  tone = "leaf",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "leaf" | "clay" | "amber" | "sky";
}) {
  const toneCls =
    tone === "clay"
      ? "bg-clay-100 text-clay-700"
      : tone === "amber"
        ? "bg-amber-100 text-amber-700"
        : tone === "sky"
          ? "bg-sky-100 text-sky-700"
          : "bg-leaf-100 text-leaf-700";
  return (
    <div className="ts-card flex items-center gap-3 p-4">
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${toneCls}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-leaf-800/60">{label}</p>
        <p className="truncate text-lg font-bold text-leaf-900">{value}</p>
        {sub ? <p className="truncate text-[11px] text-leaf-800/60">{sub}</p> : null}
      </div>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-leaf-100/70 ${className}`} />;
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
      {message}
    </div>
  );
}
