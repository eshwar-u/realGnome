import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { SensorSummary } from "@/types/api";

// Fallback mock data used when API is not configured
const mockSummaries: SensorSummary[] = [
  {
    type: "moisture",
    currentValue: 54,
    unit: "%",
    trend: "+5% from yesterday",
    trendDirection: "up",
    readings: [
      { time: "6AM", value: 65 },
      { time: "9AM", value: 58 },
      { time: "12PM", value: 45 },
      { time: "3PM", value: 40 },
      { time: "6PM", value: 55 },
      { time: "9PM", value: 62 },
    ],
  },
  {
    type: "temperature",
    currentValue: 24,
    unit: "°C",
    trend: "Optimal range: 20-28°C",
    trendDirection: "stable",
    readings: [
      { time: "6AM", value: 18 },
      { time: "9AM", value: 22 },
      { time: "12PM", value: 28 },
      { time: "3PM", value: 30 },
      { time: "6PM", value: 25 },
      { time: "9PM", value: 20 },
    ],
  },
  {
    type: "light",
    currentValue: 720,
    unit: "lux",
    trend: "Good sunlight today",
    trendDirection: "up",
    readings: [
      { time: "6AM", value: 200 },
      { time: "9AM", value: 600 },
      { time: "12PM", value: 900 },
      { time: "3PM", value: 850 },
      { time: "6PM", value: 400 },
      { time: "9PM", value: 50 },
    ],
  },
  {
    type: "humidity",
    currentValue: 68,
    unit: "%",
    trend: "-3% from yesterday",
    trendDirection: "down",
    readings: [
      { time: "6AM", value: 72 },
      { time: "9AM", value: 70 },
      { time: "12PM", value: 65 },
      { time: "3PM", value: 62 },
      { time: "6PM", value: 66 },
      { time: "9PM", value: 71 },
    ],
  },
  {
    type: "ph",
    currentValue: 6.5,
    unit: " pH",
    trend: "Optimal range: 6.0-7.0",
    trendDirection: "stable",
    readings: [
      { time: "6AM", value: 6.4 },
      { time: "9AM", value: 6.5 },
      { time: "12PM", value: 6.6 },
      { time: "3PM", value: 6.5 },
      { time: "6PM", value: 6.4 },
      { time: "9PM", value: 6.5 },
    ],
  },
  {
    type: "camera",
    currentValue: 0,
    unit: "",
    trend: "Live feed active",
    trendDirection: "stable",
    readings: [],
  },
];

export function useSensorData() {
  return useQuery<SensorSummary[]>({
    queryKey: ["sensors", "summary"],
    queryFn: () => apiFetch<SensorSummary[]>("/api/sensors/summary"),
    retry: false,
    // Fall back to mock data when API is unavailable
    placeholderData: mockSummaries,
    meta: { fallback: mockSummaries },
  });
}

// Helper to get a specific sensor by type
export function useSensorByType(type: SensorSummary["type"]) {
  const query = useSensorData();
  const sensor = (query.data ?? mockSummaries).find((s) => s.type === type);
  return { ...query, data: sensor };
}
