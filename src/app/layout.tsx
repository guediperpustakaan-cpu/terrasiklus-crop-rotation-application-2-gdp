import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import { TrakteerWidget } from "@/components/TrakteerWidget";
import "./globals.css";

export const metadata: Metadata = {
  title: "TerraSiklus — Kalkulator Rotasi Tanam & Pemantau Kesehatan Tanah",
  description:
    "Rencanakan musim tanam berdasarkan keluarga botani dan riwayat tanah. Cegah hama, optimalkan hara, dan pantau kesehatan tanah kebun Anda.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen font-sans text-leaf-900 antialiased">
        <Providers>{children}</Providers>
        <TrakteerWidget />
      </body>
    </html>
  );
}
