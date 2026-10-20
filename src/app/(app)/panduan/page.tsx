import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, FlaskConical, Recycle, ShieldAlert, Sprout, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Panduan Rotasi — TerraSiklus",
};

const RULES = [
  {
    icon: Recycle,
    title: "Aturan 1 — Ganti keluarga botani",
    body:
      "Setiap petak sebaiknya tidak ditanami keluarga botani yang sama secara berturut-turut. TerraSiklus memberi jeda minimal 12 bulan untuk keluarga yang sama, dan menandai keluarga yang masih dalam siklus rotasi.",
  },
  {
    icon: ShieldAlert,
    title: "Aturan 2 — Peringatan bila diulang",
    body:
      "Bila Anda tetap memilih keluarga yang sama terlalu cepat, sistem menampilkan peringatan berbahaya beserta alasannya. Anda masih bisa melanjutkan, namun risiko hama dan penyakit tanah menjadi lebih tinggi.",
  },
  {
    icon: Sprout,
    title: "Aturan 3 — Imbangi hara",
    body:
      "Setelah tanaman pemakai hara berat (Solanaceae, Brassicaceae), pilih legum Fabaceae atau tanaman berhara ringan. Legum mengikat nitrogen dan menyisakannya untuk musim berikutnya.",
  },
  {
    icon: FlaskConical,
    title: "Aturan 4 — Sesuaikan pH",
    body:
      "Setiap tanaman punya kisaran pH ideal. Bila pH tanah di luar kisaran, skor rekomendasi diturunkan dan muncul saran perbaikan seperti pemberian kapur dolomit atau kompos.",
  },
];

const LEVELS = [
  { label: "Hara berat (tinggi)", tone: "bg-red-100 text-red-800", example: "Tomat, cabai, kentang, kubis, brokoli, jagung, semangka" },
  { label: "Hara sedang", tone: "bg-amber-100 text-amber-800", example: "Terong, sawi, timun, wortel, bayam, bawang merah, jahe" },
  { label: "Hara ringan (rendah)", tone: "bg-leaf-100 text-leaf-800", example: "Kacang panjang, buncis, kedelai, selada, kemangi, bawang daun" },
];

const SOIL_METRICS = [
  { label: "pH tanah", ideal: "6,0 – 7,0", note: "Di luar rentang ini hara sulit diserap." },
  { label: "Nitrogen (N)", ideal: "Indeks > 45", note: "Rendah → tanam legum, tambahkan kompos kaya N." },
  { label: "Fosfor (P)", ideal: "Indeks > 40", note: "Rendah → pupuk fosfat alami / tepung tulang." },
  { label: "Kalium (K)", ideal: "Indeks > 40", note: "Rendah → abu kayu atau kalium sulfat." },
  { label: "Bahan organik", ideal: "3 – 6%", note: "Rendah → kompos 2–3 kg/m² + mulsa." },
];

export default function GuidePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-leaf-900">Panduan Rotasi Tanam</h1>
        <p className="mt-1 max-w-2xl text-sm text-leaf-800/70">
          Rotasi tanam adalah praktik menanam keluarga tanaman yang berbeda pada petak yang sama
          secara bergantian. Tujuannya memutus siklus hama, menyeimbangkan hara, dan menjaga
          kesehatan tanah dalam jangka panjang.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {RULES.map((rule) => {
          const Icon = rule.icon;
          return (
            <div key={rule.title} className="ts-card p-5">
              <span className="grid size-10 place-items-center rounded-xl bg-leaf-100 text-leaf-700">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-3 text-sm font-bold text-leaf-900">{rule.title}</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-leaf-900/75">{rule.body}</p>
            </div>
          );
        })}
      </div>

      <div className="ts-card p-5">
        <h2 className="flex items-center gap-2 text-base font-bold text-leaf-900">
          <BookOpen className="size-5 text-leaf-700" /> Tingkat kebutuhan hara
        </h2>
        <p className="mt-1 text-xs text-leaf-800/70">
          Kebutuhan hara menentukan urutan rotasi yang sehat: ringan → sedang → berat → legum.
        </p>
        <div className="mt-3 space-y-2">
          {LEVELS.map((level) => (
            <div key={level.label} className="flex flex-wrap items-center gap-2 rounded-2xl border border-leaf-100 p-3">
              <span className={`ts-chip ${level.tone}`}>{level.label}</span>
              <span className="text-xs text-leaf-900/75">{level.example}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ts-card p-5">
        <h2 className="flex items-center gap-2 text-base font-bold text-leaf-900">
          <FlaskConical className="size-5 text-leaf-700" /> Cara membaca hasil uji tanah
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead>
              <tr className="border-b border-leaf-100 text-leaf-800/70">
                <th className="py-2 pr-3 font-semibold">Parameter</th>
                <th className="py-2 pr-3 font-semibold">Kisaran sehat</th>
                <th className="py-2 font-semibold">Tindakan bila kurang</th>
              </tr>
            </thead>
            <tbody>
              {SOIL_METRICS.map((metric) => (
                <tr key={metric.label} className="border-b border-leaf-50 last:border-0">
                  <td className="py-2 pr-3 font-semibold text-leaf-900">{metric.label}</td>
                  <td className="py-2 pr-3 font-mono text-leaf-800/80">{metric.ideal}</td>
                  <td className="py-2 text-leaf-800/70">{metric.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-leaf-800 p-6 text-white">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(600px_300px_at_20%_0%,#8ed6aa,transparent_60%),radial-gradient(500px_260px_at_90%_100%,#c49a6f,transparent_60%)]" />
        <div className="relative">
          <h2 className="text-lg font-extrabold">Contoh siklus 4 musim</h2>
          <p className="mt-2 text-sm leading-relaxed text-leaf-100/85">
            Tomat (Solanaceae) → Sawi (Brassicaceae) → Kacang panjang (Fabaceae) → Bawang merah
            (Amaryllidaceae) → kembali ke Tomat. Empat keluarga berbeda, hara tetap seimbang, dan
            patogen tanah tidak sempat menumpuk.
          </p>
          <Link href="/dashboard" className="ts-btn mt-4 bg-white text-leaf-800 hover:bg-leaf-50">
            Coba di kebun saya <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
