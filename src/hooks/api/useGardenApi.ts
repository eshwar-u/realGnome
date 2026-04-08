import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MarkerType } from "@xyflow/react";
import type { Node, Edge } from "@xyflow/react";

const GARDEN_API_URL = "https://hotrs7nexh.execute-api.us-east-2.amazonaws.com/test/garden";
const QUERY_KEY = ["garden", "db"] as const;

const EDGE_GROUP_PLANT = "hsl(142, 45%, 38%)";
const EDGE_SENSOR = "hsl(200, 75%, 55%)";

// ── DB shapes (raw API response) ─────────────────────────

export interface DbPlant {
  user_plant_ID: number;
  plantID: number;
  description: string;
}

export interface DbSensor {
  user_sensor_id: number;
  sensor_type: string;
  latest_value: number | null;
  latest_time: string | null;
}

export interface DbGroup {
  plant_group_ID: number;
  description: string;
  plants: DbPlant[];
  sensors: DbSensor[];
}

// Cache shape — raw DB groups + standalone items + converted ReactFlow state
interface GardenCache {
  dbGroups: Record<string, DbGroup>;
  dbStandalonePlants: DbPlant[];
  dbStandaloneSensors: DbSensor[];
  nodes: Node[];
  edges: Edge[];
}

// ── Fetch helper ─────────────────────────────────────────

async function gardenFetch(body: object): Promise<{ statusCode: number; body: string }> {
  const res = await fetch(GARDEN_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { statusCode: number; body: string };
  if (data.statusCode !== 200) {
    throw new Error(
      (JSON.parse(data.body) as { error?: string }).error ?? "Garden API error"
    );
  }
  return data;
}

// ── Converter: raw DB groups → ReactFlow nodes + edges ───

function gardenToFlow(
  dbGroups: Record<string, DbGroup>,
  standalonePlants: DbPlant[],
  standaloneSensors: DbSensor[]
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let x = 100;

  for (const group of Object.values(dbGroups)) {
    const groupId = `group-${group.plant_group_ID}`;

    nodes.push({
      id: groupId,
      type: "group",
      position: { x, y: 80 },
      data: {
        label: group.description,
        plants: group.plants.length,
        plant_group_ID: group.plant_group_ID,
      },
    });

    group.plants.forEach((plant, i) => {
      const plantId = `plant-${plant.user_plant_ID}`;
      nodes.push({
        id: plantId,
        type: "plant",
        position: { x: x + i * 160 - 80 * Math.max(0, group.plants.length - 1), y: 280 },
        data: {
          label: plant.description,
          variety: "",
          health: 100,
          user_plant_ID: plant.user_plant_ID,
          plantID: plant.plantID,
        },
      });
      edges.push({
        id: `e-${groupId}-${plantId}`,
        source: groupId,
        target: plantId,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: EDGE_GROUP_PLANT },
      });
    });

    group.sensors.forEach((sensor, i) => {
      const sensorId = `sensor-${sensor.user_sensor_id}`;
      const label =
        sensor.sensor_type.charAt(0).toUpperCase() + sensor.sensor_type.slice(1) + " Sensor";
      nodes.push({
        id: sensorId,
        type: "sensor",
        position: { x: x + 220 + i * 180, y: 80 },
        data: {
          label,
          type: sensor.sensor_type,
          value: sensor.latest_value ?? 0,
          user_sensor_id: sensor.user_sensor_id,
        },
      });
      edges.push({
        id: `e-${groupId}-${sensorId}`,
        source: groupId,
        target: sensorId,
        type: "smoothstep",
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: EDGE_SENSOR },
      });
    });

    x += 520;
  }

  // Standalone plants (not in any group)
  standalonePlants.forEach((plant, i) => {
    const plantId = `plant-${plant.user_plant_ID}`;
    nodes.push({
      id: plantId,
      type: "plant",
      position: { x: x + i * 200, y: 180 },
      data: {
        label: plant.description,
        variety: "",
        health: 100,
        user_plant_ID: plant.user_plant_ID,
        plantID: plant.plantID,
      },
    });
  });
  if (standalonePlants.length) x += standalonePlants.length * 200 + 60;

  // Standalone sensors (not attached to any group or plant in a group)
  standaloneSensors.forEach((sensor, i) => {
    const sensorId = `sensor-${sensor.user_sensor_id}`;
    const label =
      sensor.sensor_type.charAt(0).toUpperCase() + sensor.sensor_type.slice(1) + " Sensor";
    nodes.push({
      id: sensorId,
      type: "sensor",
      position: { x: x + i * 200, y: 80 },
      data: {
        label,
        type: sensor.sensor_type,
        value: sensor.latest_value ?? 0,
        user_sensor_id: sensor.user_sensor_id,
      },
    });
  });

  return { nodes, edges };
}

// ── Helpers ───────────────────────────────────────────────

// Find the group node connected to a given node (directly, or via plant for sensors)
function findConnectedGroup(
  nodeId: string,
  currentNodes: Node[],
  currentEdges: Edge[]
): Node | undefined {
  // Direct: group → this node
  const directEdge = currentEdges.find(
    (e) =>
      e.target === nodeId &&
      currentNodes.find((n) => n.id === e.source)?.type === "group"
  );
  if (directEdge) return currentNodes.find((n) => n.id === directEdge.source);

  // Via plant: plant → this node, group → plant
  const plantEdge = currentEdges.find(
    (e) =>
      e.target === nodeId &&
      currentNodes.find((n) => n.id === e.source)?.type === "plant"
  );
  if (plantEdge) {
    return findConnectedGroup(plantEdge.source, currentNodes, currentEdges);
  }

  return undefined;
}

// ── Build update payload ──────────────────────────────────
// Diffs canvas state against the raw DB groups from get_garden.

function buildUpdatePayload(
  userID: number,
  currentNodes: Node[],
  currentEdges: Edge[],
  dbGroups: Record<string, DbGroup>,
  dbStandalonePlants: DbPlant[],
  dbStandaloneSensors: DbSensor[]
) {
  const allDbGroups = Object.values(dbGroups);

  // IDs that exist in the DB (groups + their children + standalones)
  const dbGroupIds = new Set(allDbGroups.map((g) => g.plant_group_ID));
  const dbPlantIds = new Set([
    ...allDbGroups.flatMap((g) => g.plants.map((p) => p.user_plant_ID)),
    ...dbStandalonePlants.map((p) => p.user_plant_ID),
  ]);
  const dbSensorIds = new Set([
    ...allDbGroups.flatMap((g) => g.sensors.map((s) => s.user_sensor_id)),
    ...dbStandaloneSensors.map((s) => s.user_sensor_id),
  ]);

  // IDs that are still present on the canvas
  const canvasGroupDbIds = new Set(
    currentNodes
      .filter((n) => n.type === "group" && n.data.plant_group_ID)
      .map((n) => n.data.plant_group_ID as number)
  );
  const canvasPlantDbIds = new Set(
    currentNodes
      .filter((n) => n.type === "plant" && n.data.user_plant_ID)
      .map((n) => n.data.user_plant_ID as number)
  );
  const canvasSensorDbIds = new Set(
    currentNodes
      .filter((n) => n.type === "sensor" && n.data.user_sensor_id)
      .map((n) => n.data.user_sensor_id as number)
  );

  // Groups to remove: in DB but not on canvas
  const removeGroups = [...dbGroupIds].filter((id) => !canvasGroupDbIds.has(id));

  // Plants/sensors inside removed groups will be cascade-deleted by the DB —
  // read directly from the raw DbGroup data (no edge traversal needed)
  const cascadedPlantIds = new Set<number>();
  const cascadedSensorIds = new Set<number>();
  removeGroups.forEach((groupId) => {
    const group = allDbGroups.find((g) => g.plant_group_ID === groupId);
    group?.plants.forEach((p) => cascadedPlantIds.add(p.user_plant_ID));
    group?.sensors.forEach((s) => cascadedSensorIds.add(s.user_sensor_id));
  });

  // Plants to remove: in DB, not on canvas, not already cascaded
  const removePlants = [...dbPlantIds].filter(
    (id) => !canvasPlantDbIds.has(id) && !cascadedPlantIds.has(id)
  );

  // Sensors to remove: in DB, not on canvas, not already cascaded
  const removeSensors = [...dbSensorIds].filter(
    (id) => !canvasSensorDbIds.has(id) && !cascadedSensorIds.has(id)
  );

  // New groups: on canvas with no plant_group_ID
  const addGroups = currentNodes
    .filter((n) => n.type === "group" && !n.data.plant_group_ID)
    .map((groupNode) => {
      // Sensor connected to this new group (direct edge: group → sensor)
      const connectedSensor = currentEdges
        .filter((e) => e.source === groupNode.id)
        .map((e) => currentNodes.find((n) => n.id === e.target))
        .find((n) => n?.type === "sensor");

      // Plants connected to this new group that have a catalog plantID
      const connectedPlantIds = currentEdges
        .filter((e) => e.source === groupNode.id)
        .map((e) => currentNodes.find((n) => n.id === e.target))
        .filter((n): n is Node => !!n && n.type === "plant" && !!n.data.plantID)
        .map((n) => n.data.plantID as number);

      return {
        description: groupNode.data.label as string,
        plants: connectedPlantIds,
        ...(connectedSensor ? { sensor_type: connectedSensor.data.type as string } : {}),
      };
    });

  // New plants: on canvas, no user_plant_ID but has plantID
  // — if connected to an existing DB group, include plant_group_ID
  // — if standalone (no group connection), omit plant_group_ID
  const addPlants = currentNodes
    .filter((n) => n.type === "plant" && !n.data.user_plant_ID && n.data.plantID)
    .map((plantNode) => {
      const groupNode = findConnectedGroup(plantNode.id, currentNodes, currentEdges);
      const entry: { plantID: number; plant_group_ID?: number } = {
        plantID: plantNode.data.plantID as number,
      };
      if (groupNode?.data.plant_group_ID) {
        entry.plant_group_ID = groupNode.data.plant_group_ID as number;
      }
      return entry;
    });

  // New sensors: on canvas, no user_sensor_id
  // — if connected to a DB group (directly or via group's plant), use plant_group_ID
  // — if connected to a standalone DB plant, use user_plant_ID
  // — new groups bundle the sensor in add_groups, so skip sensors whose parent is a new group
  type AddSensorEntry = { sensor_type: string; plant_group_ID?: number; user_plant_ID?: number };
  const addSensors = currentNodes
    .filter((n) => n.type === "sensor" && !n.data.user_sensor_id)
    .flatMap((sensorNode): AddSensorEntry[] => {
      // Check direct parent edge
      const parentEdge = currentEdges.find((e) => e.target === sensorNode.id);
      if (!parentEdge) return [];
      const parentNode = currentNodes.find((n) => n.id === parentEdge.source);

      if (parentNode?.type === "group") {
        // Sensor directly on a new (unsaved) group — bundled in add_groups, skip here
        if (!parentNode.data.plant_group_ID) return [];
        return [{ plant_group_ID: parentNode.data.plant_group_ID as number, sensor_type: sensorNode.data.type as string }];
      }

      if (parentNode?.type === "plant") {
        if (parentNode.data.user_plant_ID) {
          // Sensor on a standalone DB plant — use user_plant_ID
          return [{ user_plant_ID: parentNode.data.user_plant_ID as number, sensor_type: sensorNode.data.type as string }];
        }
        // Plant is in a group — find that group
        const groupNode = findConnectedGroup(parentNode.id, currentNodes, currentEdges);
        if (!groupNode?.data.plant_group_ID) return []; // new group, bundled
        return [{ plant_group_ID: groupNode.data.plant_group_ID as number, sensor_type: sensorNode.data.type as string }];
      }

      return [];
    });

  return {
    api_type: "update",
    userID,
    remove_sensors: removeSensors,
    remove_plants: removePlants,
    remove_groups: removeGroups,
    add_groups: addGroups,
    add_plants: addPlants,
    add_sensors: addSensors,
  };
}

// ── Hook ─────────────────────────────────────────────────

export function useGardenApi() {
  const qc = useQueryClient();
  const userID = Number(localStorage.getItem("user_id"));
  const queryKey = [...QUERY_KEY, userID];

  const parseAndCache = (body: string): GardenCache => {
    const parsed = JSON.parse(body) as Record<string, unknown>;

    // Separate groups from standalone plants/sensors (API may return them as top-level keys)
    const dbGroups: Record<string, DbGroup> = {};
    const dbStandalonePlants: DbPlant[] = (parsed.standalone_plants as DbPlant[] | undefined) ?? [];
    const dbStandaloneSensors: DbSensor[] = (parsed.standalone_sensors as DbSensor[] | undefined) ?? [];

    for (const [key, val] of Object.entries(parsed)) {
      if (key === "standalone_plants" || key === "standalone_sensors") continue;
      const g = val as DbGroup;
      if (g && typeof g.plant_group_ID === "number") {
        dbGroups[key] = g;
      }
    }

    return {
      dbGroups,
      dbStandalonePlants,
      dbStandaloneSensors,
      ...gardenToFlow(dbGroups, dbStandalonePlants, dbStandaloneSensors),
    };
  };

  const query = useQuery<GardenCache>({
    queryKey,
    queryFn: async () => {
      const data = await gardenFetch({ api_type: "get_garden", userID });
      return parseAndCache(data.body);
    },
    staleTime: 0,
    refetchOnMount: true,
    retry: false,
  });

  const saveGarden = useMutation({
    mutationFn: ({
      currentNodes,
      currentEdges,
    }: {
      currentNodes: Node[];
      currentEdges: Edge[];
    }) => {
      // Use raw DB groups from cache — the authoritative source of what's in the DB
      const cached = qc.getQueryData<GardenCache>(queryKey);
      const payload = buildUpdatePayload(
        userID,
        currentNodes,
        currentEdges,
        cached?.dbGroups ?? {},
        cached?.dbStandalonePlants ?? [],
        cached?.dbStandaloneSensors ?? []
      );
      return gardenFetch(payload);
    },
    onSuccess: (data) => {
      // update returns the fresh get_garden result — update cache directly
      qc.setQueryData(queryKey, parseAndCache(data.body));
    },
  });

  return { ...query, saveGarden };
}
