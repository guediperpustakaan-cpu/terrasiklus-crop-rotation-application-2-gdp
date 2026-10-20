# TerraSiklus 🌱

**Kalkulator rotasi tanam & pemantau kesehatan tanah** untuk petani kecil dan pekebun rumahan.
Aplikasi membantu merencanakan musim tanam berdasarkan **keluarga botani** dan **riwayat tanah**
untuk mencegah hama serta mengoptimalkan hara. Seluruh antarmuka menggunakan Bahasa Indonesia.

---

## ✨ Fitur

| Fitur | Keterangan |
| --- | --- |
| **Kebun & Petak** | Buat `Kebun`, lalu tambahkan beberapa `Petak` (nama, luas + satuan, jenis tanah, catatan). |
| **Katalog tanaman** | 38 tanaman & 12 keluarga botani (Solanaceae, Fabaceae, Brassicaceae, …) lengkap dengan tingkat kebutuhan hara, durasi tanam, dan kisaran pH ideal. |
| **Riwayat tanam** | Catat tanaman, tanggal tanam, tanggal panen, serta catatan hama/penyakit. |
| **Mesin rotasi** | Rekomendasi tanaman berikutnya dengan skor 0–100, alasan (`reasons`) & peringatan (`warnings`), plus daftar keluarga yang masih dalam masa jeda. |
| **Peringatan rotasi** | Blokir (dengan opsi tetap lanjut) bila keluarga botani sama ditanam < 12 bulan. |
| **Pelacak kesehatan tanah** | Form pH, N, P, K, bahan organik → skor 0–100, grade, saran perbaikan, dan riwayat uji. |
| **Dashboard interaktif** | Ringkasan kebun, tanaman aktif + perkiraan panen, skor tanah per petak, dan daftar **Aksi Berikutnya** (mis. “Waktunya panen Petak A”). |

## 🧱 Teknologi

- **React 19 + TypeScript** (Next.js App Router)
- **Tailwind CSS v4** dengan tema kustom *nature-inspired* (`leaf-*`, `clay-*`)
- **Lucide React** untuk ikon
- **TanStack Query** untuk state & data fetching
- **Drizzle ORM + PostgreSQL** (kompatibel penuh dengan **Neon Postgres**)

## 📁 Struktur utama

```
src/
├─ app/
│  ├─ page.tsx                 # Landing page (statis, Bahasa Indonesia)
│  ├─ (app)/                   # Shell aplikasi (sidebar + topbar responsif)
│  │  ├─ dashboard/            # Dashboard interaktif
│  │  ├─ petak/                # Kelola kebun & petak
│  │  ├─ petak/[id]/           # Detail petak: rotasi, uji tanah, riwayat
│  │  ├─ tanaman/              # Katalog tanaman
│  │  └─ panduan/              # Panduan rotasi tanam
│  └─ api/                     # REST API (health, farms, plots, plantings,
│                              #  soil-tests, crops, families, rotation, dashboard)
├─ components/                 # Komponen modular
│  ├─ layout/AppShell.tsx      # Layout responsif (mobile-first)
│  ├─ PlotCard.tsx  PlotForm.tsx  PlantingForm.tsx
│  ├─ RotationEngine.tsx  SoilForm.tsx  SoilStatusPanel.tsx
│  ├─ PlantingHistory.tsx  DashboardView.tsx
│  └─ ui/                      # Primitif UI + toast
├─ db/                         # schema.ts (Drizzle), seed.ts, index.ts
└─ lib/                        # types, rotation (mesin), soil, queries, api-client
drizzle/                       # Migrasi SQL siap pakai untuk Neon
```

## 🗄️ Skema basis data

`profiles` → `farms` → `plots` → (`plantings`, `soil_tests`), plus data referensi
`plant_families` → `crops`.

```
profiles(id, username, created_at)
farms(id, owner_id → profiles, name, location, created_at)
plots(id, farm_id → farms, name, area, area_unit, soil_type, notes, created_at)
plant_families(id, name, local_name, is_nitrogen_fixer, notes)
crops(id, common_name, family_id → plant_families, nutrient_demand, growth_days, ideal_ph_min, ideal_ph_max, notes)
plantings(id, plot_id → plots, crop_id → crops, planted_on, harvested_on, notes, created_at)
soil_tests(id, plot_id → plots, tested_on, ph, n, p, k, organic_matter, notes, created_at)
```

### Menjalankan migrasi

```bash
# 1) Otomatis via Drizzle (sinkronisasi skema)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require" \
  npx drizzle-kit push --dialect postgresql --schema ./src/db/schema.ts --url "$DATABASE_URL"

# 2) Atau menjalankan skrip SQL mentah (drizzle/0000_terrasiklus_init.sql)
psql "$DATABASE_URL" -f drizzle/0000_terrasiklus_init.sql
```

Data referensi (keluarga botani, katalog tanaman) dan kebun contoh di-seed **otomatis** saat
request pertama (`ensureSeeded()` dipanggil pada `/api/health` dan semua endpoint data) —
idempoten, aman dipanggil berulang.

## 🔌 API

| Metode | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/api/health` | Health check + auto seed |
| GET | `/api/farms` · POST | Daftar / buat kebun |
| GET | `/api/plots` · POST | Daftar / buat petak |
| GET/PATCH/DELETE | `/api/plots/:id` | Detail, ubah, hapus petak (cascade) |
| GET | `/api/crops`, `/api/families` | Katalog referensi |
| GET | `/api/plantings?plotId=` · POST | Riwayat & catat tanam (validasi rotasi) |
| PATCH/DELETE | `/api/plantings/:id` | Catat panen / hapus riwayat |
| GET | `/api/soil-tests?plotId=` · POST | Riwayat & tambah hasil uji tanah |
| GET | `/api/rotation?plotId=` | Analisis mesin rekomendasi rotasi |
| GET | `/api/dashboard` | Ringkasan dashboard + aksi berikutnya |

## 🔄 Logika mesin rotasi (`src/lib/rotation.ts`)

1. **Aturan utama** — keluarga botani sama dengan musim sebelumnya mendapat penalti besar;
   bila jeda < **12 bulan** → status `hindari` (blokir dengan konfirmasi risiko).
2. **Riwayat keluarga** — keluarga yang masih dalam siklus (< 12 bulan) ditandai
   sebagai *blocked family*.
3. **Keseimbangan hara** — legum (Fabaceae) diprioritaskan saat nitrogen rendah; tanaman
   pemakai hara berat dihukum pada tanah miskin hara.
4. **pH** — bonus/pengurangan skor sesuai jarak pH aktual ke kisaran ideal tanaman.
5. **Keterangan transparan** — setiap kandidat menyertakan daftar `reasons` & `warnings`
   dalam Bahasa Indonesia, misal: *“Keluarga tanaman berbeda dari musim sebelumnya
   (Solanaceae) untuk mencegah hama menumpuk.”*

Status akhir: `direkomendasikan` (≥ 68), `hati-hati` (45–67), `hindari` (< 45).

## 🚀 Menjalankan lokal

```bash
npm install
echo 'DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db' > .env
npx drizzle-kit push      # buat tabel
npm run build && npm start
```

Untuk **Neon**, cukup ganti `DATABASE_URL` dengan connection string Neon
(dengan `?sslmode=require`).
