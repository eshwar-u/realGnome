import { useState, useCallback, useMemo } from "react";
import { useGardenLayout } from "@/hooks/api/useGardenLayout";
import { motion } from "framer-motion";
import {
  ReactFlow,
  ReactFlowProvider,
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
  Trash2,
  Save,
  Download,
  Upload,
  Info,
  LayoutDashboard,
  Pencil,
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
import { AddNodeModal, NodeType } from "@/components/garden/AddNodeModal";
import { useToast } from "@/hooks/use-toast";
import { computeLayout } from "@/lib/gardenLayout";
import { useReactFlow } from "@xyflow/react";

const nodeTypes = {
  plant: PlantNode,
  sensor: SensorNode,
  group: GroupNode,
};

// Edge color palette
const EDGE_GROUP_PLANT = "hsl(142, 45%, 38%)";  // leaf green
const EDGE_SENSOR = "hsl(200, 75%, 55%)";         // sky blue

const initialNodes: Node[] = [
  {
    id: "group-1",
    type: "group",
    position: { x: 100, y: 80 },
    data: { label: "Vegetable Patch", plants: 2 },
  },
  {
    id: "plant-1",
    type: "plant",
    position: { x: 80, y: 250 },
    data: { label: "Tomatoes", variety: "Cherry", health: 92 },
  },
  {
    id: "plant-2",
    type: "plant",
    position: { x: 300, y: 250 },
    data: { label: "Basil", variety: "Sweet", health: 78 },
  },
  {
    id: "sensor-1",
    type: "sensor",
    position: { x: 350, y: 100 },
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
    style: { stroke: EDGE_GROUP_PLANT },
  },
  {
    id: "e1-3",
    source: "group-1",
    target: "plant-2",
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: EDGE_GROUP_PLANT },
  },
  {
    id: "e2-s1",
    source: "plant-1",
    target: "sensor-1",
    type: "smoothstep",
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: EDGE_SENSOR },
  },
];

/** Returns true if the connection type is structurally valid (ignores cardinality). */
function isAllowedType(srcType: string | undefined, tgtType: string | undefined): boolean {
  return (
    (srcType === "group" && tgtType === "plant") ||
    (srcType === "group" && tgtType === "sensor") ||
    (srcType === "plant" && tgtType === "sensor")
  );
}

function GardenBuilderInner() {
  const { data: savedLayout, saveLayout } = useGardenLayout();
  const { toast } = useToast();
  const { fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(
    (savedLayout?.nodes as Node[]) ?? initialNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    (savedLayout?.edges as Edge[]) ?? initialEdges
  );
  const [pendingNodeType, setPendingNodeType] = useState<NodeType | null>(null);
  const [edgeMenu, setEdgeMenu] = useState<{ edgeId: string; x: number; y: number } | null>(null);
  const [nodeMenu, setNodeMenu] = useState<{ nodeId: string; x: number; y: number } | null>(null);
  const [editingNode, setEditingNode] = useState<Node | null>(null);

  /** Structural type check — called during drag for visual handle feedback. */
  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      const src = nodes.find((n) => n.id === connection.source)?.type;
      const tgt = nodes.find((n) => n.id === connection.target)?.type;
      return isAllowedType(src, tgt);
    },
    [nodes]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const srcNode = nodes.find((n) => n.id === params.source);
      const tgtNode = nodes.find((n) => n.id === params.target);
      const src = srcNode?.type;
      const tgt = tgtNode?.type;

      // Guard: structural type check
      if (!isAllowedType(src, tgt)) {
        toast({
          title: "Invalid connection",
          description: "That connection type is not allowed. Check the Connection Rules panel.",
          variant: "destructive",
        });
        return;
      }

      // Guard: a plant can belong to at most one group
      if (src === "group" && tgt === "plant") {
        const alreadyInGroup = edges.some(
          (e) =>
            e.target === params.target &&
            nodes.find((n) => n.id === e.source)?.type === "group"
        );
        if (alreadyInGroup) {
          toast({
            title: "Plant already in a group",
            description: "A plant can only belong to one group.",
            variant: "destructive",
          });
          return;
        }
      }

      // Guard: a sensor can only be connected to one plant or group
      if (tgt === "sensor") {
        const sensorAlreadyConnected = edges.some((e) => e.target === params.target);
        if (sensorAlreadyConnected) {
          toast({
            title: "Sensor already connected",
            description: "A sensor can only monitor one plant or group.",
            variant: "destructive",
          });
          return;
        }
      }

      const isSensorEdge = tgt === "sensor";
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "smoothstep",
            animated: isSensorEdge,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: isSensorEdge ? EDGE_SENSOR : EDGE_GROUP_PLANT },
          },
          eds
        )
      );

      // Keep group plant count in sync
      if (src === "group" && tgt === "plant") {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === params.source
              ? { ...n, data: { ...n.data, plants: (n.data.plants as number) + 1 } }
              : n
          )
        );
      }
    },
    [nodes, edges, setEdges, setNodes, toast]
  );

  const onEdgeClick = useCallback((e: React.MouseEvent, edge: Edge) => {
    const canvas = (e.currentTarget as HTMLElement).closest(".react-flow") as HTMLElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setEdgeMenu({ edgeId: edge.id, x: e.clientX - rect.left, y: e.clientY - rect.top });
    setNodeMenu(null);
  }, []);

  const deleteEdge = useCallback((edgeId: string) => {
    const edge = edges.find((e) => e.id === edgeId);
    if (!edge) return;
    const srcType = nodes.find((n) => n.id === edge.source)?.type;
    const tgtType = nodes.find((n) => n.id === edge.target)?.type;
    if (srcType === "group" && tgtType === "plant") {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === edge.source
            ? { ...n, data: { ...n.data, plants: Math.max(0, (n.data.plants as number) - 1) } }
            : n
        )
      );
    }
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    setEdgeMenu(null);
  }, [edges, nodes, setEdges, setNodes]);

  const onNodeClick = useCallback((e: React.MouseEvent, node: Node) => {
    const canvas = (e.currentTarget as HTMLElement).closest(".react-flow") as HTMLElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setNodeMenu({ nodeId: node.id, x: e.clientX - rect.left, y: e.clientY - rect.top });
    setEdgeMenu(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setNodeMenu(null);
    setEdgeMenu(null);
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    if (node.type === "plant") {
      const groupEdge = edges.find(
        (e) => e.target === nodeId && nodes.find((n) => n.id === e.source)?.type === "group"
      );
      if (groupEdge) {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === groupEdge.source
              ? { ...n, data: { ...n.data, plants: Math.max(0, (n.data.plants as number) - 1) } }
              : n
          )
        );
      }
    }
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setNodeMenu(null);
  }, [nodes, edges, setNodes, setEdges]);

  const openEditNode = useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) setEditingNode(node);
    setNodeMenu(null);
  }, [nodes]);

  const handleEditConfirm = useCallback((data: Record<string, string>) => {
    if (!editingNode) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== editingNode.id) return n;
        if (n.type === "plant") return { ...n, data: { ...n.data, label: data.label, variety: data.variety } };
        if (n.type === "sensor") return { ...n, data: { ...n.data, label: data.label, type: data.type } };
        if (n.type === "group") return { ...n, data: { ...n.data, label: data.label } };
        return n;
      })
    );
    setEditingNode(null);
  }, [editingNode, setNodes]);

  const handleModalConfirm = useCallback(
    (data: Record<string, string>) => {
      if (!pendingNodeType) return;
      const newNode: Node = {
        id: `${pendingNodeType}-${Date.now()}`,
        type: pendingNodeType,
        position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
        data:
          pendingNodeType === "plant"
            ? { label: data.label, variety: data.variety, health: Number(data.health) }
            : pendingNodeType === "sensor"
            ? { label: data.label, type: data.type, value: Number(data.value) }
            : { label: data.label, plants: 0 },
      };
      setNodes((nds) => [...nds, newNode]);
      setPendingNodeType(null);
    },
    [pendingNodeType, setNodes]
  );

  const addPlant = useCallback(() => setPendingNodeType("plant"), []);
  const addSensor = useCallback(() => setPendingNodeType("sensor"), []);
  const addGroup = useCallback(() => setPendingNodeType("group"), []);

  const organizeLayout = useCallback(() => {
    const laid = computeLayout(nodes, edges);
    setNodes(laid);
    setNodeMenu(null);
    setEdgeMenu(null);
    setTimeout(() => fitView({ duration: 400, padding: 0.15 }), 50);
  }, [nodes, edges, setNodes, fitView]);

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
            <Button variant="outline" size="sm" className="gap-2" onClick={organizeLayout}>
              <LayoutDashboard className="w-4 h-4" />
              Organize
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              variant="nature"
              size="sm"
              className="gap-2"
              onClick={() =>
                saveLayout.mutate({
                  nodes: nodes.map((n) => ({
                    id: n.id,
                    type: n.type as "plant" | "sensor" | "group",
                    position: n.position,
                    data: n.data as any,
                  })),
                  edges: edges.map((e) => ({
                    id: e.id,
                    source: e.source,
                    target: e.target,
                    type: e.type,
                    animated: e.animated,
                    style: e.style as any,
                  })),
                })
              }
            >
              <Save className="w-4 h-4" />
              Save Layout
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-72 border-r border-border p-4 bg-card/30 hidden lg:flex lg:flex-col gap-4 overflow-y-auto"
        >
          {/* Add Elements */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Add Elements</CardTitle>
              <CardDescription>Click to add to canvas</CardDescription>
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
                  <p className="text-xs text-muted-foreground">Individual plant</p>
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

          {/* Connection Rules */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-lg">Connection Rules</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-2">
                <div className="mt-0.5 w-2 h-2 rounded-full bg-sun shrink-0" />
                <p className="text-muted-foreground">
                  A <span className="text-foreground font-medium">Group</span> can contain
                  many <span className="text-foreground font-medium">Plants</span>.
                </p>
              </div>
              <div className="flex gap-2">
                <div className="mt-0.5 w-2 h-2 rounded-full bg-leaf shrink-0" />
                <p className="text-muted-foreground">
                  A <span className="text-foreground font-medium">Plant</span> can be
                  standalone or in at most{" "}
                  <span className="text-foreground font-medium">one Group</span>.
                </p>
              </div>
              <div className="flex gap-2">
                <div className="mt-0.5 w-2 h-2 rounded-full bg-sky shrink-0" />
                <p className="text-muted-foreground">
                  A <span className="text-foreground font-medium">Sensor</span> can monitor
                  exactly <span className="text-foreground font-medium">one Plant or Group</span>.
                </p>
              </div>
              <div className="pt-2 border-t border-border space-y-1 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Valid connections</p>
                <p>Group → Plant</p>
                <p>Group → Sensor</p>
                <p>Plant → Sensor</p>
              </div>
            </CardContent>
          </Card>

          {/* Garden Stats */}
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
            onPaneClick={onPaneClick}
            onEdgeClick={onEdgeClick}
            isValidConnection={isValidConnection}
            nodeTypes={nodeTypes}
            fitView
            className="bg-background"
          >
            <Background color="hsl(var(--border))" gap={20} />
            <Controls className="bg-card border border-border rounded-lg overflow-hidden" />
            {/* Mobile toolbar */}
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

          {/* Floating node action popup */}
          {nodeMenu && (
            <div
              className="absolute z-10 pointer-events-none"
              style={{ left: nodeMenu.x, top: nodeMenu.y, transform: "translate(-50%, -125%)" }}
            >
              <div className="pointer-events-auto flex items-center gap-1 bg-card border border-border rounded-lg shadow-lg p-1">
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium hover:bg-accent transition-colors"
                  onClick={() => openEditNode(nodeMenu.nodeId)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <div className="w-px h-4 bg-border" />
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => deleteNode(nodeMenu.nodeId)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Floating edge delete button */}
          {edgeMenu && (
            <div
              className="absolute z-10 pointer-events-none"
              style={{ left: edgeMenu.x, top: edgeMenu.y, transform: "translate(-50%, -125%)" }}
            >
              <button
                className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium shadow-lg hover:bg-destructive/90 active:scale-95 transition-transform"
                onClick={() => deleteEdge(edgeMenu.edgeId)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove connection
              </button>
            </div>
          )}
        </div>
      </div>

      <AddNodeModal
        open={pendingNodeType !== null}
        nodeType={pendingNodeType}
        onConfirm={handleModalConfirm}
        onCancel={() => setPendingNodeType(null)}
      />
      <AddNodeModal
        open={editingNode !== null}
        mode="edit"
        nodeType={editingNode?.type as NodeType | null}
        initialData={editingNode ? Object.fromEntries(
          Object.entries(editingNode.data).map(([k, v]) => [k, String(v)])
        ) : undefined}
        onConfirm={handleEditConfirm}
        onCancel={() => setEditingNode(null)}
      />
    </div>
  );
}

export default function GardenBuilder() {
  return (
    <ReactFlowProvider>
      <GardenBuilderInner />
    </ReactFlowProvider>
  );
}
