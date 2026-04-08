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
import type { Goal } from "@/contexts/GoalsContext";

interface EditGoalModalProps {
  goal: Goal | null;
  onClose: () => void;
  onSubmit: (id: string, updates: { description: string; plant?: string; dueDate?: string | null }) => void;
}

export function EditGoalModal({ goal, onClose, onSubmit }: EditGoalModalProps) {
  const [description, setDescription] = useState(goal?.description ?? "");
  const [plantTitle, setPlantTitle] = useState(goal?.plant ?? "");
  const [dueDate, setDueDate] = useState<Date | undefined>(
    goal?.dueDate ? new Date(goal.dueDate + "T00:00:00") : undefined
  );

  if (!goal) return null;

  const handleSubmit = () => {
    if (!description.trim()) return;
    onSubmit(goal.id, {
      description: description.trim(),
      ...(goal.type === "plant" && { plant: plantTitle.trim() }),
      dueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
    });
    onClose();
  };

  return (
    <Dialog open={!!goal} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Goal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Plant Title (only for plant goals) */}
          {goal.type === "plant" && (
            <div className="space-y-2">
              <Label htmlFor="plant-title">Plant name</Label>
              <Input
                id="plant-title"
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start gap-2 font-normal", !dueDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="w-4 h-4" />
                  {dueDate ? format(dueDate, "MMM d, yyyy") : "No due date"}
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
                {dueDate && (
                  <div className="px-3 pb-3">
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setDueDate(undefined)}>
                      Clear date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="nature" onClick={handleSubmit} disabled={!description.trim()}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
