import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Leaf } from "lucide-react";

interface PlantNodeData {
  label: string;
  variety: string;
  health: number;
}

export const PlantNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as PlantNodeData;
  const healthColor =
    nodeData.health >= 80
      ? "bg-leaf"
      : nodeData.health >= 60
      ? "bg-sun"
      : "bg-warning";

  return (
    <div className="bg-card border-2 border-leaf/50 rounded-xl p-4 min-w-[140px] shadow-soft hover:shadow-lg transition-shadow">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-leaf border-2 border-card"
      />

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-leaf/20 flex items-center justify-center">
          <Leaf className="w-5 h-5 text-leaf" />
        </div>
        <div>
          <p className="font-medium text-foreground text-sm">{nodeData.label}</p>
          <p className="text-xs text-muted-foreground">{nodeData.variety}</p>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Health</span>
          <span className="font-medium text-foreground">{nodeData.health}%</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${healthColor}`}
            style={{ width: `${nodeData.health}%` }}
          />
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-leaf border-2 border-card"
      />
    </div>
  );
});

PlantNode.displayName = "PlantNode";
