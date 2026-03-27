import dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";

// Approximate rendered sizes per node type
const NODE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  group:  { width: 180, height: 110 },
  plant:  { width: 160, height: 130 },
  sensor: { width: 160, height: 100 },
};

const DEFAULT_DIM = { width: 160, height: 110 };

const GRAPH_OPTIONS = {
  rankdir: "TB",   // top → bottom
  nodesep: 60,     // horizontal gap between sibling nodes
  ranksep: 80,     // vertical gap between ranks
  marginx: 40,
  marginy: 40,
};

/**
 * Computes an auto-layout for the garden graph using dagre.
 * Returns a new nodes array with updated positions; edges are unchanged.
 */
export function computeLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph(GRAPH_OPTIONS);

  for (const node of nodes) {
    const dim = NODE_DIMENSIONS[node.type ?? ""] ?? DEFAULT_DIM;
    g.setNode(node.id, { width: dim.width, height: dim.height });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const { x, y, width, height } = g.node(node.id);
    // dagre returns the centre; ReactFlow uses the top-left corner
    return {
      ...node,
      position: { x: x - width / 2, y: y - height / 2 },
    };
  });
}
