import { useState, useCallback, useMemo, useEffect } from "react";
import { useGardenLayout } from "@/hooks/api/useGardenLayout";
import { motion } from "framer-motion";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  MarkerType,
  Panel,
  Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Leaf,
  Wifi,
  Layers,
  Plus,
  Trash2,
  Save,
  Download,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlantNode } from "@/components/garden/PlantNode";
import { SensorNode } from "@/components/garden/SensorNode";
import { GroupNode } from "@/components/garden/GroupNode";

const nodeTypes = {
  plant: PlantNode,
  sensor: SensorNode,
  group: GroupNode,
};

const initialNodes: Node[] = [
  {
    id: "group-1",
    type: "group",
    position: { x: 100, y: 100 },
    data: { label: "Vegetable Patch", plants: 3 },
  },
  {
    id: "plant-1",
    type: "plant",
    position: { x: 150, y: 250 },
    data: { label: "Tomatoes", variety: "Cherry", health: 92 },
  },
  {
    id: "plant-2",
    type: "plant",
    position: { x: 350, y: 250 },
    data: { label: "Basil", variety: "Sweet", health: 78 },
  },
  {
    id: "sensor-1",
    type: "sensor",
    position: { x: 550, y: 180 },
    data: { label: "Moisture Sensor", type: "moisture", value: 54 },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "group-1",
    target: "plant-1",
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: "hsl(142, 45%, 38%)" },
  },
  {
    id: "e1-3",
    source: "group-1",
    target: "plant-2",
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: "hsl(142, 45%, 38%)" },
  },
  {
    id: "e2-s1",
    source: "plant-1",
    target: "sensor-1",
    type: "smoothstep",
    animated: true,
    style: { stroke: "hsl(200, 75%, 55%)" },
  },
];

export default function GardenBuilder() {
  const { data: savedLayout, saveLayout } = useGardenLayout();

  const [nodes, setNodes, onNodesChange] = useNodesState(
    (savedLayout?.nodes as Node[]) ?? initialNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    (savedLayout?.edges as Edge[]) ?? initialEdges
  );
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: "hsl(142, 45%, 38%)" },
          },
          eds
        )
      ),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const addPlant = useCallback(() => {
    const newNode: Node = {
      id: `plant-${Date.now()}`,
      type: "plant",
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: { label: "New Plant", variety: "Unknown", health: 100 },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const addSensor = useCallback(() => {
    const newNode: Node = {
      id: `sensor-${Date.now()}`,
      type: "sensor",
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: { label: "New Sensor", type: "moisture", value: 50 },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const addGroup = useCallback(() => {
    const newNode: Node = {
      id: `group-${Date.now()}`,
      type: "group",
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: { label: "New Group", plants: 0 },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const deleteSelected = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) =>
        eds.filter(
          (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
        )
      );
      setSelectedNode(null);
    }
  }, [selectedNode, setNodes, setEdges]);

  const nodeStats = useMemo(() => {
    const plants = nodes.filter((n) => n.type === "plant").length;
    const sensors = nodes.filter((n) => n.type === "sensor").length;
    const groups = nodes.filter((n) => n.type === "group").length;
    return { plants, sensors, groups };
  }, [nodes]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 border-b border-border bg-card/50 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Garden Builder
            </h1>
            <p className="text-muted-foreground mt-1">
              Design your garden layout with plants, sensors, and groups
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" size="sm" className="gap-2">
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button variant="nature" size="sm" className="gap-2">
              <Save className="w-4 h-4" />
              Save Layout
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-72 border-r border-border p-4 bg-card/30 hidden lg:block"
        >
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Add Elements</CardTitle>
                <CardDescription>
                  Drag or click to add to canvas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={addPlant}
                >
                  <div className="w-8 h-8 rounded-lg bg-leaf/20 flex items-center justify-center">
                    <Leaf className="w-4 h-4 text-leaf" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Plant</p>
                    <p className="text-xs text-muted-foreground">
                      Individual plant
                    </p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={addSensor}
                >
                  <div className="w-8 h-8 rounded-lg bg-sky/20 flex items-center justify-center">
                    <Wifi className="w-4 h-4 text-sky" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Sensor</p>
                    <p className="text-xs text-muted-foreground">IoT sensor</p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={addGroup}
                >
                  <div className="w-8 h-8 rounded-lg bg-sun/20 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-sun" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Group</p>
                    <p className="text-xs text-muted-foreground">Plant group</p>
                  </div>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Garden Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-leaf" />
                    <span className="text-sm">Plants</span>
                  </div>
                  <span className="font-medium">{nodeStats.plants}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-sky" />
                    <span className="text-sm">Sensors</span>
                  </div>
                  <span className="font-medium">{nodeStats.sensors}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sun" />
                    <span className="text-sm">Groups</span>
                  </div>
                  <span className="font-medium">{nodeStats.groups}</span>
                </div>
              </CardContent>
            </Card>

            {selectedNode && (
              <Card variant="interactive">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Selected Element</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Type:</span>{" "}
                      {selectedNode.type}
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Name:</span>{" "}
                      {selectedNode.data?.label as string}
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full mt-3"
                      onClick={deleteSelected}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-background"
          >
            <Background color="hsl(var(--border))" gap={20} />
            <Controls className="bg-card border border-border rounded-lg overflow-hidden" />
            <Panel position="top-left" className="lg:hidden">
              <div className="flex gap-2 bg-card/90 backdrop-blur-sm p-2 rounded-lg border border-border">
                <Button size="icon" variant="outline" onClick={addPlant}>
                  <Leaf className="w-4 h-4 text-leaf" />
                </Button>
                <Button size="icon" variant="outline" onClick={addSensor}>
                  <Wifi className="w-4 h-4 text-sky" />
                </Button>
                <Button size="icon" variant="outline" onClick={addGroup}>
                  <Layers className="w-4 h-4 text-sun" />
                </Button>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
