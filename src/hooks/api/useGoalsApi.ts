import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { GoalPayload, CreateGoalPayload } from "@/types/api";

const QUERY_KEY = ["goals"];

export function useGoalsApi() {
  const qc = useQueryClient();

  const query = useQuery<GoalPayload[]>({
    queryKey: QUERY_KEY,
    queryFn: () => apiFetch<GoalPayload[]>("/api/goals"),
    retry: false,
  });

  const createGoal = useMutation({
    mutationFn: (payload: CreateGoalPayload) =>
      apiFetch<GoalPayload>("/api/goals", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const updateGoal = useMutation({
    mutationFn: ({ id, ...patch }: Partial<GoalPayload> & { id: string }) =>
      apiFetch<GoalPayload>(`/api/goals/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const deleteGoal = useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/goals/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return { ...query, createGoal, updateGoal, deleteGoal };
}
