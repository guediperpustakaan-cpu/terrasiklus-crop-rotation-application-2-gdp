export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDateLong(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00Z`).getTime();
  const b = new Date(`${to}T00:00:00Z`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

export function relativeDays(iso: string, base = todayIso()): string {
  const diff = daysBetween(base, iso);
  if (diff === 0) return "hari ini";
  if (diff === 1) return "besok";
  if (diff === -1) return "kemarin";
  if (diff > 1) return `${diff} hari lagi`;
  return `${Math.abs(diff)} hari lalu`;
}

export function formatNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function monthsLabel(months: number): string {
  const rounded = Math.round(months);
  if (rounded <= 0) return "baru saja";
  return `${rounded} bulan lalu`;
}

export function demandLabel(demand: string): string {
  if (demand === "tinggi") return "Hara berat";
  if (demand === "rendah") return "Hara ringan";
  return "Hara sedang";
}

export function demandTone(demand: string): "red" | "amber" | "leaf" {
  if (demand === "tinggi") return "red";
  if (demand === "rendah") return "leaf";
  return "amber";
}
