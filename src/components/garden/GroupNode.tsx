import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Layers } from "lucide-react";

interface GroupNodeData {
  label: string;
  plants: number;
}

export const GroupNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as GroupNodeData;

  return (
    <div
      className={`bg-card border-2 rounded-xl p-4 min-w-[160px] shadow-soft hover:shadow-lg transition-shadow ${
        selected ? "border-sun" : "border-sun/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-sun/20 flex items-center justify-center">
          <Layers className="w-5 h-5 text-sun" />
        </div>
        <div>
          <p className="font-medium text-foreground text-sm">{nodeData.label}</p>
          <p className="text-xs text-muted-foreground">Plant Group</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Plants in group</span>
          <span className="font-medium text-foreground bg-sun/20 px-2 py-0.5 rounded-full">
            {nodeData.plants}
          </span>
        </div>
      </div>

      {/* Groups only emit connections — no incoming target handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-sun border-2 border-card"
      />
    </div>
  );
});

GroupNode.displayName = "GroupNode";
