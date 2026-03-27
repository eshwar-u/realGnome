import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Wifi, Droplets, Thermometer, Sun, Camera, Wind, FlaskConical } from "lucide-react";

interface SensorNodeData {
  label: string;
  type: "moisture" | "temperature" | "light" | "camera" | "humidity" | "ph";
  value: number;
}

const sensorIcons = {
  moisture: Droplets,
  temperature: Thermometer,
  light: Sun,
  camera: Camera,
  humidity: Wind,
  ph: FlaskConical,
};

const sensorColors: Record<string, string> = {
  moisture: "bg-moisture text-moisture",
  temperature: "bg-warning text-warning",
  light: "bg-sun text-sun",
  camera: "bg-sky text-sky",
  humidity: "bg-sky text-sky",
  ph: "bg-leaf text-leaf",
};

const sensorUnits: Record<string, string> = {
  moisture: "%",
  temperature: "°C",
  light: "lux",
  camera: "",
  humidity: "%",
  ph: "pH",
};

export const SensorNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as SensorNodeData;
  const Icon = sensorIcons[nodeData.type] ?? Wifi;
  const colorClass = sensorColors[nodeData.type] ?? "bg-sky text-sky";
  const unit = sensorUnits[nodeData.type] ?? "";
  const [bgClass, textClass] = colorClass.split(" ");

  return (
    <div
      className={`bg-card border-2 rounded-xl p-4 min-w-[130px] shadow-soft hover:shadow-lg transition-shadow ${
        selected ? "border-sky" : "border-sky/50"
      }`}
    >
      {/* Sensors are leaf nodes — they only receive connections (left side) */}
      <Handle
        type="target"
        position={Position.Left}
        id="sensor-in"
        className="w-3 h-3 !bg-sky border-2 border-card"
      />

      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${bgClass}/20 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${textClass}`} />
        </div>
        <div>
          <p className="font-medium text-foreground text-sm">{nodeData.label}</p>
          <p className="text-xs text-muted-foreground capitalize">{nodeData.type}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Wifi className="w-3 h-3 text-leaf animate-pulse" />
          <span className="text-xs text-leaf">Live</span>
        </div>
        <span className="text-lg font-display font-bold text-foreground">
          {nodeData.value}{unit}
        </span>
      </div>
    </div>
  );
});

SensorNode.displayName = "SensorNode";
