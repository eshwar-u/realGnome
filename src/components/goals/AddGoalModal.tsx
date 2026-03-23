import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { GoalType } from "@/contexts/GoalsContext";
import type { GoalItem } from "@/hooks/api/useGoalsApi";

interface AddGoalModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (goal: GoalItem) => void;
}

export function AddGoalModal({ open, onClose, onSubmit }: AddGoalModalProps) {
  const [description, setDescription] = useState("");
  const [goalType, setGoalType] = useState<GoalType>("long-term");
  const [plantTitle, setPlantTitle] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();

  const handleSubmit = () => {
    if (!description.trim()) return;

    const goal: GoalItem = {
      goal_type: goalType,
      description: description.trim(),
      ...(goalType === "plant" && { plant_title: plantTitle.trim() }),
      ...(dueDate && { dueDate: format(dueDate, "yyyy-MM-dd") }),
    };

    onSubmit(goal);
    handleClose();
  };

  const handleClose = () => {
    setDescription("");
    setGoalType("long-term");
    setPlantTitle("");
    setDueDate(undefined);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Goal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Goal Type */}
          <div className="space-y-2">
            <Label>Goal type</Label>
            <div className="flex gap-2">
              {(["long-term", "short-term", "plant"] as GoalType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setGoalType(type)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all",
                    goalType === type
                      ? "bg-leaf text-white border-leaf"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {type === "long-term" ? "Long-term" : type === "short-term" ? "Short-term" : "Plant"}
                </button>
              ))}
            </div>
          </div>

          {/* Plant Title (only for plant goals) */}
          {goalType === "plant" && (
            <div className="space-y-2">
              <Label htmlFor="plant-title">Plant name</Label>
              <Input
                id="plant-title"
                placeholder="e.g. Tomatoes"
                value={plantTitle}
                onChange={(e) => setPlantTitle(e.target.value)}
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Describe your goal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due date (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start gap-2 font-normal", !dueDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="w-4 h-4" />
                  {dueDate ? format(dueDate, "MMM d, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button variant="nature" onClick={handleSubmit} disabled={!description.trim()}>
            Add Goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}