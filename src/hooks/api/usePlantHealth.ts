import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { PlantHealth, Alert } from "@/types/api";

const mockPlantHealth: PlantHealth[] = [
  { id: "1", name: "Tomatoes", health: 92, status: "excellent" },
  { id: "2", name: "Basil", health: 78, status: "good" },
  { id: "3", name: "Peppers", health: 65, status: "needs attention" },
  { id: "4", name: "Lettuce", health: 88, status: "excellent" },
  { id: "5", name: "Carrots", health: 71, status: "good" },
];

const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "warning",
    plant: "Peppers",
    message: "Moisture below threshold (35%)",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "2",
    type: "info",
    plant: "Tomatoes",
    message: "Optimal growth conditions detected",
    time: "4 hours ago",
    read: true,
  },
];

export function usePlantHealth() {
  return useQuery<PlantHealth[]>({
    queryKey: ["plants", "health"],
    queryFn: () => apiFetch<PlantHealth[]>("/api/plants/health"),
    retry: false,
    placeholderData: mockPlantHealth,
  });
}

export function useAlerts(limit = 10) {
  return useQuery<Alert[]>({
    queryKey: ["alerts", limit],
    queryFn: () => apiFetch<Alert[]>(`/api/alerts?limit=${limit}`),
    retry: false,
    placeholderData: mockAlerts,
  });
}

// Computed average health
export function useAveragePlantHealth() {
  const query = usePlantHealth();
  const plants = query.data ?? mockPlantHealth;
  const avg = plants.length
    ? Math.round(plants.reduce((s, p) => s + p.health, 0) / plants.length)
    : 0;
  return { ...query, average: avg, count: plants.length };
}
