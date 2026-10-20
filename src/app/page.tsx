import Link from "next/link";
import {
  ArrowRight,
  Bug,
  FlaskConical,
  Leaf,
  Recycle,
  ShieldCheck,
  Sprout,
  Sun,
  Tractor,
  Gift,
} from "lucide-react";

const FEATURES = [
  {
    icon: Recycle,
    title: "Mesin Rekomendasi Rotasi",
    description:
      "Analisis riwayat tanam tiap petak, lalu usulkan tanaman dari keluarga botani berbeda untuk memutus siklus hama.",
  },
  {
    icon: Bug,
    title: "Peringatan Rotasi Berisiko",
    description:
      "Sistem memperingatkan bila Anda mencoba menanam keluarga yang sama terlalu cepat, lengkap dengan alasannya.",
  },
  {
    icon: FlaskConical,
    title: "Pelacak Kesehatan Tanah",
    description:
      "Catat pH, nitrogen, fosfor, kalium, dan bahan organik. Dapatkan skor kesehatan tanah beserta saran perbaikan.",
  },
  {
    icon: Sprout,
    title: "Katalog 38 Tanaman",
    description:
      "Referensi tanaman lengkap dengan keluarga botani, tingkat kebutuhan hara, dan kisaran pH ideal.",
  },
  {
    icon: Sun,
    title: "Agenda Aksi Berikutnya",
    description:
      "Dashboard mengingatkan waktu panen, petak kosong, hingga uji tanah yang sudah kedaluwarsa.",
  },
  {
    icon: ShieldCheck,
    title: "Ramah Pengguna Baru",
    description:
      "Antarmuka Bahasa Indonesia yang sederhana — cocok untuk petani kecil, pekebun rumahan, dan komunitas sekolah.",
  },
];

const STEPS = [
  {
    icon: Tractor,
    title: "1. Buat Kebun & Petak",
    description: "Daftarkan kebun Anda, lalu pecah menjadi petak-petak dengan luas dan jenis tanah masing-masing.",
  },
  {
    icon: Leaf,
    title: "2. Catat Tanaman",
    description: "Simpan setiap musim tanam: tanaman apa, kapan ditanam, kapan dipanen, dan catatan hama.",
  },
  {
    icon: Recycle,
    title: "3. Terima Rekomendasi",
    description: "Mesin rotasi memberi skor setiap tanaman dan menjelaskan alasan di baliknya.",
  },
  {
    icon: FlaskConical,
    title: "4. Uji & Pulihkan Tanah",
    description: "Masukkan hasil uji tanah, pantau tren kesuburan, dan rawat tanah untuk musim berikutnya.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-leaf-600 text-white shadow-sm">
            <Recycle className="size-5" />
          </span>
          <span>
            <span className="block text-base font-extrabold tracking-tight text-leaf-900">TerraSiklus</span>
            <span className="block text-[11px] font-medium text-leaf-800/60">Rotasi tanam & kesehatan tanah</span>
          </span>
        </div>
        <Link href="/dashboard" className="ts-btn ts-btn-primary">
          Buka Aplikasi <ArrowRight className="size-4" />
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 pb-12 pt-4 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:pt-10">
        <div className="ts-animate-in">
          <span className="ts-chip bg-leaf-100 text-leaf-800">
            <Sprout className="size-3.5" /> Untuk petani kecil & pekebun rumahan
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-leaf-950 sm:text-4xl lg:text-5xl">
            Rencanakan musim tanam berdasarkan{" "}
            <span className="text-leaf-600">keluarga botani</span> dan riwayat tanah Anda.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-leaf-900/75 sm:text-base">
            TerraSiklus menghitung rotasi tanam terbaik untuk setiap petak, memperingatkan Anda saat
            keluarga tanaman diulang terlalu cepat, dan memantau kesehatan tanah agar panen lebih
            sehat tanpa bergantung pada pestisida.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard" className="ts-btn ts-btn-primary">
              Mulai Kelola Kebun <ArrowRight className="size-4" />
            </Link>
            <Link href="/tanaman" className="ts-btn ts-btn-ghost">
              Lihat Katalog Tanaman
            </Link>
            <a
              href="https://github.com/bonarnaga-id/terrasiklus-crop-rotation-application-2-gdp/archive/refs/heads/main.zip"
              target="_blank"
              rel="noopener noreferrer"
              className="ts-btn ts-btn-ghost opacity-80 hover:opacity-100 transition-opacity"
            >
              <Gift className="size-4 mr-2" /> Download Source
            </a>
          </div>
          <dl className="mt-8 grid grid-cols-3 gap-3 sm:max-w-md">
            {[
              { value: "38", label: "Tanaman" },
              { value: "12", label: "Keluarga botani" },
              { value: "12 bln", label: "Jeda rotasi aman" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-leaf-100 bg-white/70 p-3 text-center">
                <dt className="text-lg font-extrabold text-leaf-700">{stat.value}</dt>
                <dd className="text-[11px] font-medium text-leaf-800/70">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="ts-animate-in relative">
          <div className="relative h-64 w-full overflow-hidden rounded-3xl border border-leaf-100 bg-gradient-to-br from-leaf-100 via-leaf-50 to-clay-100 shadow-xl sm:h-80 lg:h-[420px]">
            <div className="absolute inset-0 opacity-70 [background:radial-gradient(320px_220px_at_25%_20%,rgba(255,255,255,0.85),transparent_65%),radial-gradient(280px_200px_at_80%_75%,rgba(196,154,111,0.45),transparent_65%)]" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-leaf-700/35 to-transparent" />
            <div className="absolute inset-0 grid place-items-center">
              <div className="flex flex-col items-center gap-2 text-leaf-800/80">
                <Sprout className="size-16" strokeWidth={1.25} />
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">Kebun Subur · Rotasi Sehat</p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-5 left-4 right-4 rounded-2xl border border-leaf-100 bg-white/95 p-3 shadow-lg backdrop-blur sm:left-8 sm:right-8">
            <p className="text-[11px] font-bold uppercase tracking-wide text-leaf-700">Contoh rekomendasi</p>
            <p className="mt-1 text-xs leading-relaxed text-leaf-900/80">
              &ldquo;Setelah Tomat (Solanaceae), tanam <strong>Kacang Panjang</strong> (Fabaceae) — keluarga
              berbeda mencegah hama menumpuk dan memulihkan nitrogen tanah.&rdquo;
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-leaf-950 sm:text-3xl">
          Semua yang dibutuhkan untuk rotasi tanam yang sehat
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-leaf-900/70">
          Dibangun di atas aturan agronomi sederhana: ganti keluarga tanaman, jaga hara, dan catat
          semua musim tanam Anda.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="ts-card p-5">
                <span className="grid size-10 place-items-center rounded-xl bg-leaf-100 text-leaf-700">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-3 text-sm font-bold text-leaf-900">{feature.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-leaf-900/70">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="rounded-3xl border border-leaf-100 bg-white/70 p-6 sm:p-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-leaf-950 sm:text-3xl">
            Alur kerja TerraSiklus
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-2xl border border-leaf-100 bg-white p-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-clay-100 text-clay-700">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-3 text-sm font-bold text-leaf-900">{step.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-leaf-900/70">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-leaf-800 px-6 py-10 text-center sm:px-10">
          <div className="absolute inset-0 opacity-20 [background:radial-gradient(600px_300px_at_20%_0%,#8ed6aa,transparent_60%),radial-gradient(600px_300px_at_80%_100%,#c49a6f,transparent_60%)]" />
          <div className="relative">
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Siap memulai siklus yang lebih sehat?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-leaf-100/85">
              Kebun contoh sudah disiapkan untuk Anda. Tambahkan petak Anda sendiri, catat tanaman,
              dan biarkan mesin rotasi bekerja.
            </p>
            <Link
              href="/dashboard"
              className="ts-btn mx-auto mt-6 bg-white text-leaf-800 hover:bg-leaf-50"
            >
              Masuk ke Dashboard <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
