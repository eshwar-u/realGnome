import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { GoalPayload } from "@/types/api";

const QUERY_KEY = ["goals"];
const API_URL = "https://hotrs7nexh.execute-api.us-east-2.amazonaws.com/test/user-goals";

function decodePlantDescription(combined: string): { plant_title: string; description: string } {
  const match = combined.match(/^(\d+)(.*)$/s);
  if (!match) return { plant_title: "", description: combined };
  
  const titleLength = parseInt(match[1], 10);
  const rest = match[2];
  const plant_title = rest.slice(0, titleLength);
  const description = rest.slice(titleLength);
  
  return { plant_title, description };
}

// ── Request body shapes ──────────────────────────────────

interface GoalItem {
  goal_type: "long-term" | "short-term" | "plant";
  description: string;
  plant_title?: string;
}

interface AddGoalsPayload {
  api_type: "add";
  userID: number;
  goal_list: GoalItem[];
}

interface RemoveGoalsPayload {
  api_type: "remove";
  goal_ids: number[];
}

interface GetUserGoalsPayload {
  api_type: "get_user";
  userID: number;
}

// ── Hook ─────────────────────────────────────────────────

export function useGoalsApi(userID: number) {
  const qc = useQueryClient();

  const query = useQuery<GoalPayload[]>({
    queryKey: [...QUERY_KEY, userID],
    queryFn: async () => {
      const raw = await apiFetch<Record<string, {
        goal_id: number;
        userID: number;
        goal_type: "long-term" | "short-term" | "plant";
        description: string;
        status: string | null;
      }>>(API_URL, {
        method: "POST",
        body: JSON.stringify({ api_type: "get_user", userID } satisfies GetUserGoalsPayload),
      });

      return Object.values(raw).map((g) => {
        const { plant_title, description } = g.goal_type === "plant"
          ? decodePlantDescription(g.description)
          : { plant_title: undefined, description: g.description };

        return {
          id: String(g.goal_id),
          title: "",
          description,
          type: g.goal_type,
          progress: g.status === "archived" ? 100 : 0,
          completed: g.status === "archived",
          plant: plant_title,
          dueDate: undefined,
        } satisfies GoalPayload;
      });
    },  // <-- closes queryFn
    retry: false,
  });  // <-- closes useQuery

  const createGoals = useMutation({
    mutationFn: (goal_list: GoalItem[]) =>
      apiFetch<{ message: string }>(API_URL, {
        method: "POST",
        body: JSON.stringify({ api_type: "add", userID, goal_list } satisfies AddGoalsPayload),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...QUERY_KEY, userID] }),
  });

  const removeGoals = useMutation({
    mutationFn: (goal_ids: number[]) =>
      apiFetch<{ message: string }>(API_URL, {
        method: "POST",
        body: JSON.stringify({ api_type: "remove", goal_ids } satisfies RemoveGoalsPayload),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...QUERY_KEY, userID] }),
  });

  return { ...query, createGoals, removeGoals };
}  // <-- closes useGoalsApi