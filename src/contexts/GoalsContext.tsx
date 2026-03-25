import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useGoalsApi } from "@/hooks/api/useGoalsApi";
import type { GoalPayload } from "@/types/api";
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
  addGoal: (goal: GoalItem) => void;
  removeGoal: (id: string) => void;
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  toggleComplete: (id: string) => void;
  updateGoalDueDate: (id: string, date: string | undefined) => void;
  isApiConnected: boolean;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const userID = Number(localStorage.getItem("user_id") ?? 0);
  const { data: apiGoals, isSuccess, createGoals, removeGoals } = useGoalsApi(userID);

  const goals: Goal[] = (isSuccess && apiGoals) ? apiGoals as Goal[] : [];
  const isApiConnected = isSuccess;

  const toggleComplete = useCallback(
    (id: string) => {
      // local only for now
    }, []
  );

  const updateGoalDueDate = useCallback(
    (id: string, date: string | undefined) => {
      // local only for now
    }, []
  );

  const addGoal = useCallback(
    (goal: GoalItem) => {
      createGoals.mutate([goal]);
    },
    [createGoals]
  );

  const removeGoal = useCallback(
    (id: string) => {
      removeGoals.mutate([Number(id)]);
    },
    [removeGoals]
  );

  return (
    <GoalsContext.Provider value={{ goals, setGoals: () => {}, toggleComplete, updateGoalDueDate, addGoal, removeGoal, isApiConnected }}>
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalsContext);
  if (!context) throw new Error("useGoals must be used within GoalsProvider");
  return context;
}

