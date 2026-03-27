import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useGoalsApi } from "@/hooks/api/useGoalsApi";
import type { GoalItem } from "@/hooks/api/useGoalsApi";

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

interface GoalsContextType {
  goals: Goal[];
  addGoal: (goal: GoalItem) => void;
  removeGoal: (id: string) => void;
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  toggleComplete: (id: string) => void;
  updateGoalDueDate: (id: string, date: string | undefined) => void;
  updateGoal: (id: string, updates: { description: string; plant?: string; dueDate?: string | null }) => void;
  isApiConnected: boolean;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const userID = Number(localStorage.getItem("user_id") ?? 0);
  const { data: apiGoals, isSuccess, createGoals, removeGoals, archiveGoals, updateGoals } = useGoalsApi(userID);

  const [goals, setGoals] = useState<Goal[]>([]);
  const isApiConnected = isSuccess;

  useEffect(() => {
    if (isSuccess && apiGoals) {
      setGoals(apiGoals as Goal[]);
    }
  }, [isSuccess, apiGoals]);

  const toggleComplete = useCallback(
    (id: string) => {
      setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
      archiveGoals.mutate([Number(id)]);
    },
    [archiveGoals]
  );

  const updateGoalDueDate = useCallback(
    (id: string, date: string | undefined) => {
      updateGoals.mutate([{ goal_id: Number(id), due_date: date ?? null }]);
    },
    [updateGoals]
  );

  const updateGoal = useCallback(
    (id: string, updates: { description: string; plant?: string; dueDate?: string | null }) => {
      const encodedDescription = updates.plant !== undefined
        ? `${updates.plant.length}${updates.plant}${updates.description}`
        : updates.description;
      updateGoals.mutate([{
        goal_id: Number(id),
        description: encodedDescription,
        due_date: updates.dueDate ?? null,
      }]);
    },
    [updateGoals]
  );

  const addGoal = useCallback(
    (goal: GoalItem) => {
      const newGoal: Goal = {
        id: Date.now().toString(),
        title: goal.title || goal.description,
        description: goal.description,
        type: goal.goal_type,
        progress: 0,
        completed: false,
        plant: goal.plant_title,
        dueDate: goal.dueDate,
      };
      setGoals(prev => [...prev, newGoal]);
      createGoals.mutate([goal]);
    },
    [createGoals]
  );

  const removeGoal = useCallback(
    (id: string) => {
      setGoals(prev => prev.filter(g => g.id !== id));
      removeGoals.mutate([Number(id)]);
    },
    [removeGoals]
  );

  return (
    <GoalsContext.Provider value={{ goals, setGoals, toggleComplete, updateGoalDueDate, updateGoal, addGoal, removeGoal, isApiConnected }}>
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalsContext);
  if (!context) throw new Error("useGoals must be used within GoalsProvider");
  return context;
}
