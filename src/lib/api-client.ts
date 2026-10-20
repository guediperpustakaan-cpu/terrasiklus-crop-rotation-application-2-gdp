"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type {
  CropDto,
  DashboardDto,
  FarmDto,
  FamilyDto,
  PlantingDto,
  PlantingEvaluation,
  PlotDetailDto,
  PlotDto,
  RotationAnalysis,
  SoilAnalysis,
  SoilTestDto,
} from "@/lib/types";

export interface ApiError extends Error {
  status: number;
  code?: string;
  evaluation?: PlantingEvaluation;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  if (!response.ok) {
    const error = new Error(
      typeof payload.error === "string" ? payload.error : "Terjadi kesalahan pada server",
    ) as ApiError;
    error.status = response.status;
    if (typeof payload.code === "string") error.code = payload.code;
    if (payload.evaluation) error.evaluation = payload.evaluation as PlantingEvaluation;
    throw error;
  }
  return payload as T;
}

export const api = {
  farms: () => request<{ farms: FarmDto[] }>("/api/farms"),
  createFarm: (body: { name: string; location?: string | null }) =>
    request<{ farm: FarmDto }>("/api/farms", { method: "POST", body: JSON.stringify(body) }),

  plots: () => request<{ plots: PlotDto[] }>("/api/plots"),
  plot: (id: number) => request<PlotDetailDto>(`/api/plots/${id}`),
  createPlot: (body: {
    farmId: number;
    name: string;
    area: number;
    areaUnit: string;
    soilType: string;
    notes?: string | null;
  }) => request<{ plot: PlotDto }>("/api/plots", { method: "POST", body: JSON.stringify(body) }),
  updatePlot: (
    id: number,
    body: Partial<{ name: string; area: number; areaUnit: string; soilType: string; notes: string | null }>,
  ) => request<PlotDetailDto>(`/api/plots/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deletePlot: (id: number) => request<{ deleted: boolean }>(`/api/plots/${id}`, { method: "DELETE" }),

  crops: () => request<{ crops: CropDto[] }>("/api/crops"),
  families: () => request<{ families: FamilyDto[] }>("/api/families"),

  plantings: (plotId: number) =>
    request<{ plantings: PlantingDto[] }>(`/api/plantings?plotId=${plotId}`),
  createPlanting: (body: {
    plotId: number;
    cropId: number;
    plantedOn: string;
    notes?: string | null;
    force?: boolean;
  }) =>
    request<{ planting: PlantingDto; evaluation: PlantingEvaluation }>("/api/plantings", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updatePlanting: (
    id: number,
    body: { harvestedOn?: string | null; notes?: string | null },
  ) => request<{ planting: PlantingDto }>(`/api/plantings/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deletePlanting: (id: number) => request<{ deleted: boolean }>(`/api/plantings/${id}`, { method: "DELETE" }),

  soilTests: (plotId: number) =>
    request<{ soilTests: SoilTestDto[]; analysis: SoilAnalysis | null }>(`/api/soil-tests?plotId=${plotId}`),
  createSoilTest: (body: {
    plotId: number;
    testedOn: string;
    ph: number;
    n: number;
    p: number;
    k: number;
    organicMatter: number;
    notes?: string | null;
  }) =>
    request<{ soilTest: SoilTestDto; analysis: SoilAnalysis | null }>("/api/soil-tests", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  rotation: (plotId: number) => request<{ analysis: RotationAnalysis }>(`/api/rotation?plotId=${plotId}`),
  dashboard: () => request<DashboardDto>("/api/dashboard"),
};

export function invalidatePlotData(client: QueryClient, plotId?: number): void {
  void client.invalidateQueries({ queryKey: ["dashboard"] });
  void client.invalidateQueries({ queryKey: ["plots"] });
  void client.invalidateQueries({ queryKey: ["farms"] });
  if (plotId) {
    void client.invalidateQueries({ queryKey: ["plot", plotId] });
    void client.invalidateQueries({ queryKey: ["rotation", plotId] });
    void client.invalidateQueries({ queryKey: ["soil-tests", plotId] });
    void client.invalidateQueries({ queryKey: ["plantings", plotId] });
  }
}

export function useFarms() {
  return useQuery({ queryKey: ["farms"], queryFn: api.farms });
}

export function usePlots() {
  return useQuery({ queryKey: ["plots"], queryFn: api.plots });
}

export function usePlot(plotId: number | null) {
  return useQuery({
    queryKey: ["plot", plotId],
    queryFn: () => api.plot(plotId as number),
    enabled: plotId !== null,
  });
}

export function useCrops() {
  return useQuery({ queryKey: ["crops"], queryFn: api.crops });
}

export function useFamilies() {
  return useQuery({ queryKey: ["families"], queryFn: api.families });
}

export function useRotation(plotId: number | null) {
  return useQuery({
    queryKey: ["rotation", plotId],
    queryFn: () => api.rotation(plotId as number),
    enabled: plotId !== null,
  });
}

export function useDashboard() {
  return useQuery({ queryKey: ["dashboard"], queryFn: api.dashboard });
}

export function useCreateFarm() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.createFarm,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["farms"] });
      void client.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreatePlot() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.createPlot,
    onSuccess: () => invalidatePlotData(client),
  });
}

export function useUpdatePlot(plotId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof api.updatePlot>[1]) => api.updatePlot(plotId, body),
    onSuccess: () => invalidatePlotData(client, plotId),
  });
}

export function useDeletePlot() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deletePlot(id),
    onSuccess: () => invalidatePlotData(client),
  });
}

export function useCreatePlanting() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.createPlanting,
    onSuccess: (_data, variables) => invalidatePlotData(client, variables.plotId),
  });
}

export function useUpdatePlanting(plotId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number; harvestedOn?: string | null; notes?: string | null }) =>
      api.updatePlanting(id, body),
    onSuccess: () => invalidatePlotData(client, plotId),
  });
}

export function useDeletePlanting(plotId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deletePlanting(id),
    onSuccess: () => invalidatePlotData(client, plotId),
  });
}

export function useCreateSoilTest(plotId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.createSoilTest,
    onSuccess: () => invalidatePlotData(client, plotId),
  });
}
