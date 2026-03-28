// ── Sensor Data ──────────────────────────────────────────
// GET /api/sensors/readings?period=24h
export interface SensorReading {
  time: string;    // e.g. "6AM", or ISO timestamp
  value: number;
}

export interface SensorSummary {
  type: "moisture" | "temperature" | "light" | "humidity" | "ph" | "camera";
  currentValue: number;
  unit: string;          // "%", "°C", "lux"
  trend: string;         // "+5% from yesterday"
  trendDirection: "up" | "down" | "stable";
  readings: SensorReading[];
}

// GET /api/sensors/summary  → SensorSummary[]

// ── Plant Health ─────────────────────────────────────────
// GET /api/plants/health
export interface PlantHealth {
  id: string;
  name: string;
  health: number;        // 0-100
  status: "excellent" | "good" | "needs attention" | "critical";
}

// ── Alerts ───────────────────────────────────────────────
// GET /api/alerts?limit=10
export interface Alert {
  id: string;
  type: "warning" | "info" | "critical";
  plant: string;
  message: string;
  time: string;          // relative or ISO
  read: boolean;
}

// ── Goals ────────────────────────────────────────────────
// GET    /api/goals
// POST   /api/goals         body: CreateGoalPayload
// PATCH  /api/goals/:id     body: Partial<GoalPayload>
// DELETE /api/goals/:id
export type GoalType = "long-term" | "short-term" | "plant";

export interface GoalPayload {
  id: string;
  title: string;
  description: string;
  type: GoalType;
  progress: number;
  dueDate?: string;       // ISO date string
  completed: boolean;
  plant?: string;
}

export interface CreateGoalPayload {
  title: string;
  description: string;
  type: GoalType;
  dueDate?: string;
  plant?: string;
}

// ── Garden Layout ────────────────────────────────────────
// GET  /api/garden/layout
// PUT  /api/garden/layout   body: GardenLayout
export interface GardenNodeData {
  label: string;
  [key: string]: unknown;  // variety, health, type, value, plants, etc.
}

export interface GardenNode {
  id: string;
  type: "plant" | "sensor" | "group";
  position: { x: number; y: number };
  data: GardenNodeData;
}

export interface GardenEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  markerEnd?: { type: string };
  style?: Record<string, string>;
}

export interface GardenLayout {
  nodes: GardenNode[];
  edges: GardenEdge[];
}
