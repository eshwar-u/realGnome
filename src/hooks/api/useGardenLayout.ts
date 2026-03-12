import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { GardenLayout } from "@/types/api";

const QUERY_KEY = ["garden", "layout"];

export function useGardenLayout() {
  const qc = useQueryClient();

  const query = useQuery<GardenLayout>({
    queryKey: QUERY_KEY,
    queryFn: () => apiFetch<GardenLayout>("/api/garden/layout"),
    retry: false,
  });

  const saveLayout = useMutation({
    mutationFn: (layout: GardenLayout) =>
      apiFetch<GardenLayout>("/api/garden/layout", {
        method: "PUT",
        body: JSON.stringify(layout),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return { ...query, saveLayout };
}
