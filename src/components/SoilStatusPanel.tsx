"use client";

import { FlaskConical, Sparkles, TrendingUp } from "lucide-react";
import { Badge, Card, EmptyState, Progress, SectionTitle } from "@/components/ui/primitives";
import { analyzeSoilTest } from "@/lib/soil";
import { formatDate } from "@/lib/format";
import type { SoilTestDto } from "@/lib/types";

const toneMap: Record<string, { bar: "leaf" | "amber" | "red" | "clay"; badge: string; label: string }> = {
  good: { bar: "leaf", badge: "leaf", label: "Baik" },
  warn: { bar: "amber", badge: "amber", label: "Cukup" },
  bad: { bar: "red", badge: "red", label: "Rendah" },
  neutral: { bar: "clay", badge: "slate", label: "Netral" },
};

export function SoilStatusPanel({
  soilTests,
  onAdd,
}: {
  soilTests: SoilTestDto[];
  onAdd?: () => void;
}) {
  const latest = soilTests[0] ?? null;
  const analysis = analyzeSoilTest(latest);

  if (!latest || !analysis) {
    return (
      <Card>
        <SectionTitle
          icon={<FlaskConical className="size-5" />}
          title="Kesehatan Tanah"
          description="Belum ada hasil uji tanah untuk petak ini."
        />
        <EmptyState
          icon={<FlaskConical className="size-5" />}
          title="Belum ada data uji tanah"
          description="Catat pH, nitrogen, fosfor, kalium, dan bahan organik agar mesin rotasi dapat memberi rekomendasi hara yang akurat."
          action={
            onAdd ? (
              <button type="button" className="ts-btn ts-btn-primary" onClick={onAdd}>
                <FlaskConical className="size-4" /> Catat Uji Tanah
              </button>
            ) : null
          }
        />
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle
        icon={<FlaskConical className="size-5" />}
        title="Kesehatan Tanah"
        description={`Uji terakhir ${formatDate(latest.testedOn)}${soilTests.length > 1 ? ` · ${soilTests.length} riwayat uji` : ""}`}
        action={
          onAdd ? (
            <button type="button" className="ts-btn ts-btn-ghost" onClick={onAdd}>
              <FlaskConical className="size-4" /> Uji Baru
            </button>
          ) : null
        }
      />

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-28">
          <p className="text-3xl font-extrabold text-leaf-800">{analysis.score}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-leaf-800/60">dari 100</p>
          <div className="mt-2">
            <Progress value={analysis.score} tone={analysis.score >= 70 ? "leaf" : analysis.score >= 45 ? "amber" : "red"} />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <Badge tone={analysis.score >= 70 ? "leaf" : analysis.score >= 45 ? "amber" : "red"}>
            {analysis.grade}
          </Badge>
          <p className="mt-2 text-xs leading-relaxed text-leaf-900/75">{analysis.summary}</p>
          {latest.notes ? (
            <p className="mt-2 rounded-xl bg-clay-50 p-2 text-[11px] italic leading-relaxed text-clay-800">
              “{latest.notes}”
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {analysis.metrics.map((metric) => {
          const tone = toneMap[metric.tone] ?? toneMap.neutral;
          return (
            <div key={metric.key} className="rounded-2xl border border-leaf-100 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-leaf-900">{metric.label}</p>
                <Badge tone={tone.badge}>{tone.label}</Badge>
              </div>
              <p className="mt-1 text-lg font-extrabold text-leaf-900">
                {metric.value}
                {metric.unit ? <span className="ml-1 text-xs font-semibold text-leaf-800/60">{metric.unit}</span> : null}
              </p>
              <div className="mt-1.5">
                <Progress value={metric.progress} tone={tone.bar} />
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-leaf-800/70">{metric.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-leaf-200 bg-leaf-50/70 p-4">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-leaf-700">
          <Sparkles className="size-3.5" /> Saran perbaikan
        </p>
        <ul className="mt-2 space-y-1.5">
          {analysis.suggestions.map((suggestion) => (
            <li key={suggestion} className="flex gap-2 text-xs leading-relaxed text-leaf-900/85">
              <span className="text-leaf-600">•</span>
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>

      {soilTests.length > 1 ? (
        <div className="mt-4">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-leaf-800/60">
            <TrendingUp className="size-3.5" /> Riwayat uji tanah
          </p>
          <div className="space-y-2">
            {soilTests.slice(0, 5).map((test) => {
              const testAnalysis = analyzeSoilTest(test);
              return (
                <div
                  key={test.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-xs"
                >
                  <span className="font-semibold text-leaf-900">{formatDate(test.testedOn)}</span>
                  <span className="font-mono text-[11px] text-leaf-800/70">
                    pH {test.ph.toFixed(1)} · N {Math.round(test.n)} · P {Math.round(test.p)} · K{" "}
                    {Math.round(test.k)} · BO {test.organicMatter.toFixed(1)}%
                  </span>
                  <Badge tone={(testAnalysis?.score ?? 0) >= 70 ? "leaf" : (testAnalysis?.score ?? 0) >= 45 ? "amber" : "red"}>
                    {testAnalysis?.score ?? "-"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
