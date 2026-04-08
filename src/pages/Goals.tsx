import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Target,
  Plus,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  ChevronRight,
  Leaf,
  Droplets,
  Sparkles,
  Flag,
  Edit2,
  Trash2,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useGoals, GoalType } from "@/contexts/GoalsContext";
import type { Goal } from "@/contexts/GoalsContext";
import { AddGoalModal } from "@/components/goals/AddGoalModal";
import { EditGoalModal } from "@/components/goals/EditGoalModal";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Goals() {
  const { goals, toggleComplete, updateGoalDueDate, updateGoal, addGoal, removeGoal, completedCount } = useGoals();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [activeTab, setActiveTab] = useState<GoalType | "archived">("long-term");
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [pendingDates, setPendingDates] = useState<Record<string, Date | undefined>>({});

  const tabGoals = activeTab === "archived"
    ? goals.filter((g) => g.completed || g.removedFromTab)
    : goals.filter((g) => g.type === activeTab && !g.removedFromTab);

  const stats = {
    total: goals.filter((g) => !g.removedFromTab).length,
    completed: completedCount,
    inProgress: goals.filter((g) => !g.completed && !g.removedFromTab).length,
  };

  const getTypeIcon = (type: GoalType | "archived") => {
    switch (type) {
      case "long-term": return <Flag className="w-4 h-4" />;
      case "plant": return <Leaf className="w-4 h-4" />;
      case "archived": return <Archive className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: GoalType | "archived") => {
    switch (type) {
      case "long-term": return "text-sun";
      case "plant": return "text-leaf";
      case "archived": return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Garden Goals</h1>
            <p className="text-muted-foreground mt-1">Track your vision, milestones, and plant care tasks</p>
          </div>
          <Button variant="nature" className="gap-2" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Goal
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-leaf/10 to-leaf/5 border-leaf/20">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-leaf/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-leaf" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Goals</p>
                <p className="text-2xl font-display font-bold text-foreground">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-sky/10 to-sky/5 border-sky/20">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-sky/20 flex items-center justify-center">
                <Droplets className="w-6 h-6 text-sky" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-display font-bold text-foreground">{stats.inProgress}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-sun/10 to-sun/5 border-sun/20">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-sun/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-sun" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-display font-bold text-foreground">{stats.completed}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={itemVariants}>
          <div className="flex gap-2 p-1 bg-secondary rounded-xl w-fit">
            {(["long-term", "plant", "archived"] as (GoalType | "archived")[]).map((type) => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                  activeTab === type ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className={getTypeColor(type)}>{getTypeIcon(type)}</span>
                {type === "long-term" ? "Long-Term Vision" : type === "plant" ? "Plant Tasks" : "Past Goals"}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Goals List */}
        <motion.div variants={itemVariants} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {tabGoals.map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                {activeTab === "archived" ? (
                  <Card className={cn(goal.completed ? "border-leaf/20 bg-leaf/5" : "border-muted/40 bg-muted/10")}>
                    <CardContent className="p-5">
                      <div className="flex gap-4">
                        {goal.completed
                          ? <CheckCircle2 className="w-6 h-6 text-leaf shrink-0 mt-1" />
                          : <Archive className="w-6 h-6 text-muted-foreground shrink-0 mt-1" />
                        }
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-medium text-muted-foreground line-through">
                                {goal.title || goal.description}
                              </h3>
                              {goal.plant && (
                                <span className="inline-flex items-center gap-1 text-xs text-leaf/70 bg-leaf/10 px-2 py-0.5 rounded-full mt-1">
                                  <Leaf className="w-3 h-3" />
                                  {goal.plant}
                                </span>
                              )}
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeGoal(goal.id, true)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          {goal.title && <p className="text-sm text-muted-foreground/70 mt-1">{goal.description}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card variant="interactive" className={cn(goal.completed && "border-leaf/30 bg-leaf/5")}>
                    <CardContent className="p-5">
                      <div className="flex gap-4">
                        <button onClick={() => toggleComplete(goal.id)} className="shrink-0 mt-1">
                          {goal.completed
                            ? <CheckCircle2 className="w-6 h-6 text-leaf hover:text-leaf/70 transition-colors" />
                            : <Circle className="w-6 h-6 text-muted-foreground hover:text-foreground transition-colors" />
                          }
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className={cn("font-medium", goal.completed ? "text-muted-foreground line-through" : "text-foreground")}>
                                {goal.title || goal.description}
                              </h3>
                              {goal.plant && (
                                <span className="inline-flex items-center gap-1 text-xs text-leaf bg-leaf/10 px-2 py-0.5 rounded-full mt-1">
                                  <Leaf className="w-3 h-3" />
                                  {goal.plant}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {!goal.completed && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingGoal(goal)}>
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeGoal(goal.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {goal.title && <p className={cn("text-sm mt-1", goal.completed ? "text-muted-foreground/60" : "text-muted-foreground")}>{goal.description}</p>}
                          <div className="mt-4 flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Progress</span>
                                <span className={cn("font-medium", goal.completed ? "text-leaf" : "text-foreground")}>{goal.progress}%</span>
                              </div>
                              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${goal.progress}%` }}
                                  transition={{ duration: 0.5 }}
                                  className={cn("h-full rounded-full", goal.completed ? "bg-leaf" : goal.progress >= 50 ? "bg-sky" : "bg-sun")}
                                />
                              </div>
                            </div>
                            {!goal.completed && (
                              <Popover open={openPopoverId === goal.id} onOpenChange={(open) => {
                                setOpenPopoverId(open ? goal.id : null);
                                if (!open) setPendingDates((prev) => { const next = { ...prev }; delete next[goal.id]; return next; });
                              }}>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="sm" className={cn("gap-1 text-xs shrink-0", goal.dueDate ? "text-foreground" : "text-muted-foreground")}>
                                    <CalendarIcon className="w-3 h-3" />
                                    {goal.dueDate ? format(new Date(goal.dueDate + "T00:00:00"), "MMM d, yyyy") : "Set due date"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                  <Calendar
                                    mode="single"
                                    selected={pendingDates[goal.id] ?? (goal.dueDate ? new Date(goal.dueDate + "T00:00:00") : undefined)}
                                    onSelect={(date) => setPendingDates((prev) => ({ ...prev, [goal.id]: date }))}
                                    initialFocus
                                    className="p-3 pointer-events-auto"
                                  />
                                  <div className="flex items-center justify-end gap-2 px-3 pb-3">
                                    <Button variant="ghost" size="sm" onClick={() => {
                                      setPendingDates((prev) => { const next = { ...prev }; delete next[goal.id]; return next; });
                                      setOpenPopoverId(null);
                                    }}>
                                      Cancel
                                    </Button>
                                    <Button variant="nature" size="sm" disabled={!(goal.id in pendingDates)} onClick={() => {
                                      const pending = pendingDates[goal.id];
                                      updateGoalDueDate(goal.id, pending ? format(pending, "yyyy-MM-dd") : undefined);
                                      setPendingDates((prev) => { const next = { ...prev }; delete next[goal.id]; return next; });
                                      setOpenPopoverId(null);
                                    }}>
                                      Confirm
                                    </Button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        </div>
                        {!goal.completed && <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {tabGoals.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary mx-auto flex items-center justify-center mb-4">
                  <Target className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {activeTab === "archived" ? "No feted goals yet" : "No goals yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {activeTab === "archived" ? "Complete a goal to see it here" : "Add your first goal to start tracking your garden progress"}
                </p>
                {activeTab !== "archived" && (
                  <Button variant="nature" onClick={() => setModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Goal
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </motion.div>
      <AddGoalModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={addGoal}
        defaultType={activeTab === "archived" ? "long-term" : activeTab}
        />
      <EditGoalModal
        goal={editingGoal}
        onClose={() => setEditingGoal(null)}
        onSubmit={updateGoal}
        />
    </div>
  );
}
