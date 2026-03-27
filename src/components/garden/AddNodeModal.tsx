import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type NodeType = "plant" | "sensor" | "group";

interface AddNodeModalProps {
  open: boolean;
  nodeType: NodeType | null;
  mode?: "add" | "edit";
  initialData?: Record<string, string>;
  onConfirm: (data: Record<string, string>) => void;
  onCancel: () => void;
}

export function AddNodeModal({
  open,
  nodeType,
  mode = "add",
  initialData,
  onConfirm,
  onCancel,
}: AddNodeModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sensorType, setSensorType] = useState("moisture");

  // Sync fields when editing an existing node
  useEffect(() => {
    if (open && mode === "edit" && initialData) {
      setName(initialData.label ?? "");
      setDescription(initialData.variety ?? initialData.description ?? "");
      setSensorType(initialData.type ?? "moisture");
    } else if (open && mode === "add") {
      setName("");
      setDescription("");
      setSensorType("moisture");
    }
  }, [open, mode, initialData]);

  const handleConfirm = () => {
    if (!name.trim()) return;

    if (nodeType === "plant") {
      onConfirm({ label: name, variety: description || "Unknown", health: initialData?.health ?? "100" });
    } else if (nodeType === "sensor") {
      onConfirm({ label: name, type: sensorType, value: initialData?.value ?? "50" });
    } else if (nodeType === "group") {
      onConfirm({ label: name, description, plants: initialData?.plants ?? "0" });
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  const addTitles: Record<NodeType, string> = {
    plant: "Add Plant",
    sensor: "Add Sensor",
    group: "Add Plant Group",
  };

  const editTitles: Record<NodeType, string> = {
    plant: "Edit Plant",
    sensor: "Edit Sensor",
    group: "Edit Plant Group",
  };

  if (!nodeType) return null;
  const titles = mode === "edit" ? editTitles : addTitles;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titles[nodeType]}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="node-name">Name</Label>
            <Input
              id="node-name"
              placeholder={
                nodeType === "plant"
                  ? "e.g. Tomatoes"
                  : nodeType === "sensor"
                  ? "e.g. Moisture Sensor"
                  : "e.g. Vegetable Patch"
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              autoFocus
            />
          </div>

          {nodeType === "plant" && (
            <div className="space-y-1.5">
              <Label htmlFor="node-variety">Variety</Label>
              <Input
                id="node-variety"
                placeholder="e.g. Cherry, Sweet, Heirloom"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              />
            </div>
          )}

          {nodeType === "sensor" && (
            <div className="space-y-1.5">
              <Label htmlFor="sensor-type">Sensor Type</Label>
              <Select value={sensorType} onValueChange={setSensorType}>
                <SelectTrigger id="sensor-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moisture">Moisture</SelectItem>
                  <SelectItem value="temperature">Temperature</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="humidity">Humidity</SelectItem>
                  <SelectItem value="ph">pH</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {nodeType === "group" && (
            <div className="space-y-1.5">
              <Label htmlFor="node-description">Description</Label>
              <Input
                id="node-description"
                placeholder="e.g. South-facing raised bed"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="nature" onClick={handleConfirm} disabled={!name.trim()}>
            {mode === "edit" ? "Save" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
