import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
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
  removedFromTab?: boolean;
}

interface GoalsContextType {
  goals: Goal[];
  addGoal: (goal: GoalItem) => void;
  removeGoal: (id: string, permanent?: boolean) => void;
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  toggleComplete: (id: string) => void;
  updateGoalDueDate: (id: string, date: string | undefined) => void;
  updateGoal: (id: string, updates: { description: string; plant?: string; dueDate?: string | null }) => void;
  isApiConnected: boolean;
  completedCount: number;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const userID = Number(localStorage.getItem("user_id") ?? 0);
  const { data: apiGoals, isSuccess, createGoals, removeGoals, archiveGoals, updateGoals } = useGoalsApi(userID);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const isApiConnected = isSuccess;
  const deletedIds = useRef(new Set<string>(
    JSON.parse(localStorage.getItem("deletedGoalIds") ?? "[]")
  ));
  const removedFromTabIds = useRef(new Set<string>(
    JSON.parse(localStorage.getItem("removedFromTabIds") ?? "[]")
  ));
  const countInitialized = useRef(false);

  useEffect(() => {
    if (isSuccess && apiGoals) {
      // Initialize completedCount from API on first load only
      if (!countInitialized.current) {
        setCompletedCount((apiGoals as Goal[]).filter(g => g.completed).length);
        countInitialized.current = true;
      }
      setGoals(prev => {
        const prevById = new Map(prev.map(g => [g.id, g]));
        return (apiGoals as Goal[])
          .filter(g => !deletedIds.current.has(g.id))
          .map(apiGoal => {
            const local = prevById.get(apiGoal.id);
            return {
              ...apiGoal,
              completed: local?.completed ?? apiGoal.completed,
              progress: local?.completed ? 100 : apiGoal.progress,
              dueDate: local?.dueDate ?? apiGoal.dueDate,
              removedFromTab: removedFromTabIds.current.has(apiGoal.id) || local?.removedFromTab,
            };
          });
      });
    }
  }, [isSuccess, apiGoals]);

  const toggleComplete = useCallback(
    (id: string) => {
      const goal = goals.find(g => g.id === id);
      if (!goal) return;
      const nowCompleted = !goal.completed;
      // Only toggleComplete can change the counter
      setCompletedCount(c => nowCompleted ? c + 1 : c - 1);
      setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: nowCompleted, progress: nowCompleted ? 100 : 0 } : g));
      if (nowCompleted) {
        archiveGoals.mutate([Number(id)]);
      }
    },
    [goals, archiveGoals]
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
    (id: string, permanent = false) => {
      if (permanent) {
        deletedIds.current.add(id);
        localStorage.setItem("deletedGoalIds", JSON.stringify([...deletedIds.current]));
        removedFromTabIds.current.delete(id);
        localStorage.setItem("removedFromTabIds", JSON.stringify([...removedFromTabIds.current]));
        setGoals(prev => prev.filter(g => g.id !== id));
        removeGoals.mutate([Number(id)]);
      } else {
        removedFromTabIds.current.add(id);
        localStorage.setItem("removedFromTabIds", JSON.stringify([...removedFromTabIds.current]));
        setGoals(prev => prev.map(g => g.id === id ? { ...g, removedFromTab: true } : g));
      }
    },
    [removeGoals]
  );

  return (
    <GoalsContext.Provider value={{ goals, setGoals, toggleComplete, updateGoalDueDate, updateGoal, addGoal, removeGoal, isApiConnected, completedCount }}>
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalsContext);
  if (!context) throw new Error("useGoals must be used within GoalsProvider");
  return context;
}
