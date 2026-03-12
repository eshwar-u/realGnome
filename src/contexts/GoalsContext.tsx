import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useGoalsApi } from "@/hooks/api/useGoalsApi";
import type { GoalPayload } from "@/types/api";

export type GoalType = "long-term" | "short-term" | "plant";

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: GoalType;
  progress: number;
  dueDate?: string;
  completed: boolean;
  plant?: string;
}

// Fallback data when API is unavailable
const fallbackGoals: Goal[] = [
  { id: "1", title: "Grow 100% organic vegetables", description: "Transition to completely organic growing methods with natural pesticides and fertilizers", type: "long-term", progress: 45, completed: false },
  { id: "2", title: "Improve soil nutrient density", description: "Add compost and natural amendments to increase nutrient content by 30%", type: "long-term", progress: 60, completed: false },
  { id: "3", title: "Plant summer squash section", description: "Prepare and plant 4 varieties of summer squash", type: "short-term", progress: 20, dueDate: "2026-04-15", completed: false },
  { id: "4", title: "Install drip irrigation", description: "Set up automated drip irrigation for the vegetable patch", type: "short-term", progress: 80, dueDate: "2026-03-30", completed: false },
  { id: "5", title: "Tomatoes - Daily watering", description: "Water every morning before 9 AM, 500ml per plant", type: "plant", progress: 100, plant: "Tomatoes", dueDate: "2026-02-20", completed: true },
  { id: "6", title: "Basil - Harvest leaves", description: "Harvest mature leaves weekly to encourage bushy growth", type: "plant", progress: 75, plant: "Basil", dueDate: "2026-02-25", completed: false },
];

interface GoalsContextType {
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  toggleComplete: (id: string) => void;
  updateGoalDueDate: (id: string, date: string | undefined) => void;
  isApiConnected: boolean;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>(fallbackGoals);
  const { data: apiGoals, isSuccess, updateGoal } = useGoalsApi();
  const [isApiConnected, setIsApiConnected] = useState(false);

  // Sync from API when available
  useEffect(() => {
    if (isSuccess && apiGoals) {
      setGoals(apiGoals as Goal[]);
      setIsApiConnected(true);
    }
  }, [isSuccess, apiGoals]);

  const toggleComplete = useCallback(
    (id: string) => {
      setGoals((prev) =>
        prev.map((g) =>
          g.id === id
            ? { ...g, completed: !g.completed, progress: g.completed ? g.progress : 100 }
            : g
        )
      );
      // Persist to API if connected
      if (isApiConnected) {
        const goal = goals.find((g) => g.id === id);
        if (goal) {
          updateGoal.mutate({ id, completed: !goal.completed, progress: goal.completed ? goal.progress : 100 });
        }
      }
    },
    [isApiConnected, goals, updateGoal]
  );

  const updateGoalDueDate = useCallback(
    (id: string, date: string | undefined) => {
      setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, dueDate: date } : g)));
      if (isApiConnected) {
        updateGoal.mutate({ id, dueDate: date });
      }
    },
    [isApiConnected, updateGoal]
  );

  return (
    <GoalsContext.Provider value={{ goals, setGoals, toggleComplete, updateGoalDueDate, isApiConnected }}>
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalsContext);
  if (!context) throw new Error("useGoals must be used within GoalsProvider");
  return context;
}
