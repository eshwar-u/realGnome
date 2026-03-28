import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Droplets,
  Thermometer,
  Sun,
  Leaf,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Bell,
  Wind,
  FlaskConical,
  Camera,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useSensorData } from "@/hooks/api/useSensorData";
import { usePlantHealth, useAlerts, useAveragePlantHealth } from "@/hooks/api/usePlantHealth";
import { useGardenLayout } from "@/hooks/api/useGardenLayout";
import type { SensorSummary } from "@/types/api";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

type SensorType = SensorSummary["type"];

interface SensorConfig {
  icon: React.ElementType;
  color: string;
  unit: string;
  chartType: "area" | "line";
  title: string;
  description: string;
  iconBg: string;
  iconColor: string;
  cardVariant: string;
}

const sensorConfig: Record<SensorType, SensorConfig> = {
  moisture: {
    icon: Droplets,
    color: "hsl(195, 80%, 50%)",
    unit: "%",
    chartType: "area",
    title: "Soil Moisture",
    description: "24-hour moisture levels across all sensors",
    iconBg: "bg-sky/20",
    iconColor: "text-sky",
    cardVariant: "sensor",
  },
  temperature: {
    icon: Thermometer,
    color: "hsl(35, 95%, 55%)",
    unit: "°C",
    chartType: "line",
    title: "Temperature",
    description: "Ambient temperature readings throughout the day",
    iconBg: "bg-warning/20",
    iconColor: "text-warning",
    cardVariant: "default",
  },
  light: {
    icon: Sun,
    color: "hsl(50, 95%, 55%)",
    unit: " lux",
    chartType: "area",
    title: "Light Intensity",
    description: "Sunlight exposure throughout the day",
    iconBg: "bg-sun/20",
    iconColor: "text-sun",
    cardVariant: "default",
  },
  humidity: {
    icon: Wind,
    color: "hsl(220, 80%, 60%)",
    unit: "%",
    chartType: "area",
    title: "Humidity",
    description: "Air humidity levels over the last 24 hours",
    iconBg: "bg-sky/10",
    iconColor: "text-sky",
    cardVariant: "default",
  },
  ph: {
    icon: FlaskConical,
    color: "hsl(280, 80%, 60%)",
    unit: " pH",
    chartType: "line",
    title: "Soil pH",
    description: "Soil acidity and alkalinity levels",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-500",
    cardVariant: "default",
  },
  camera: {
    icon: Camera,
    color: "hsl(0, 0%, 50%)",
    unit: "",
    chartType: "line",
    title: "Camera",
    description: "Visual monitoring",
    iconBg: "bg-muted/50",
    iconColor: "text-muted-foreground",
    cardVariant: "default",
  },
};

export default function Dashboard() {
  const { data: sensors, isLoading: sensorsLoading } = useSensorData();
  const { data: plants, isLoading: plantsLoading } = usePlantHealth();
  const { average: avgHealth, count: plantCount } = useAveragePlantHealth();
  const { data: alerts, isLoading: alertsLoading } = useAlerts();
  const { data: gardenLayout, isLoading: layoutLoading } = useGardenLayout();

  // Derive sensor types from garden builder nodes
  const gardenSensorTypes = useMemo<SensorType[] | null>(() => {
    if (!gardenLayout?.nodes) return null;
    const sensorNodes = gardenLayout.nodes.filter((n) => n.type === "sensor");
    const types = [
      ...new Set(
        sensorNodes
          .map((n) => n.data.type as SensorType)
          .filter((t): t is SensorType => Boolean(t) && t in sensorConfig)
      ),
    ];
    return types.length > 0 ? types : null;
  }, [gardenLayout]);

  // Types to show in stat cards (from garden if available, else all from API)
  const activeTypes: SensorType[] = gardenSensorTypes ?? (sensors?.map((s) => s.type) ?? []);

  // Types to show charts for (exclude camera — no numerical time-series)
  const chartTypes = activeTypes.filter((t) => t !== "camera");

  const chartsLoading = sensorsLoading || layoutLoading;

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Garden Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor your garden's health in real-time
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Bell className="w-4 h-4" />
              Set Alerts
            </Button>
            <Button variant="nature" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Sensor
            </Button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sensorsLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))
            : activeTypes.map((type) => {
                const cfg = sensorConfig[type];
                if (!cfg) return null;
                const sensor = sensors?.find((s) => s.type === type);
                if (!sensor) return null;
                const Icon = cfg.icon;
                const TrendIcon =
                  sensor.trendDirection === "up"
                    ? TrendingUp
                    : sensor.trendDirection === "down"
                    ? TrendingDown
                    : TrendingUp;
                return (
                  <Card key={type} variant={cfg.cardVariant as any} className="relative overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${cfg.iconBg} flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 ${cfg.iconColor}`} />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground capitalize">{type}</p>
                          <p className="text-2xl font-display font-bold text-foreground">
                            {sensor.currentValue}{sensor.unit}
                          </p>
                        </div>
                      </div>
                      <div className={`mt-3 flex items-center text-sm ${sensor.trendDirection === "up" ? "text-leaf" : "text-muted-foreground"}`}>
                        <TrendIcon className="w-4 h-4 mr-1" />
                        {sensor.trend}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

          {/* Plant Health Summary Card */}
          <Card variant="plant" className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-leaf/20 flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-leaf" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plant Health</p>
                  <p className="text-2xl font-display font-bold text-foreground">
                    {plantsLoading ? "—" : `${avgHealth}%`}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center text-sm text-muted-foreground">
                {plantCount} plants monitored
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sensor Charts — one per sensor type in the garden */}
        <motion.div variants={itemVariants}>
          {chartsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
              <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
            </div>
          ) : chartTypes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <p className="text-sm">No sensors found in your garden layout.</p>
                <p className="text-xs mt-1">Add sensors in the Garden Builder to see charts here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {chartTypes.map((type) => {
                const cfg = sensorConfig[type];
                const sensorData = sensors?.find((s) => s.type === type);
                const Icon = cfg.icon;
                return (
                  <SensorChart
                    key={type}
                    title={cfg.title}
                    description={cfg.description}
                    icon={<Icon className={`w-5 h-5 ${cfg.iconColor}`} />}
                    data={sensorData?.readings ?? []}
                    color={cfg.color}
                    unit={cfg.unit}
                    loading={false}
                    chartType={cfg.chartType}
                  />
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Plant Health & Alerts */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Leaf className="w-5 h-5 text-leaf" />
                Plant Health Overview
              </CardTitle>
              <CardDescription>Individual plant health scores based on sensor data</CardDescription>
            </CardHeader>
            <CardContent>
              {plantsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {plants?.map((plant, index) => (
                    <motion.div
                      key={plant.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4"
                    >
                      <div className="w-24 text-sm font-medium text-foreground">{plant.name}</div>
                      <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${plant.health}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                          className={`h-full rounded-full ${
                            plant.health >= 80 ? "bg-leaf" : plant.health >= 60 ? "bg-sun" : "bg-warning"
                          }`}
                        />
                      </div>
                      <div className="w-12 text-sm font-medium text-foreground">{plant.health}%</div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full ${
                          plant.status === "excellent"
                            ? "bg-leaf/20 text-leaf"
                            : plant.status === "good"
                            ? "bg-sun/20 text-sun"
                            : "bg-warning/20 text-warning"
                        }`}
                      >
                        {plant.status}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card variant="alert">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Recent Alerts
              </CardTitle>
              <CardDescription>Plant health notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts?.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border ${
                        alert.type === "warning"
                          ? "bg-warning/10 border-warning/30"
                          : "bg-leaf/10 border-leaf/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          className={`w-4 h-4 mt-0.5 ${
                            alert.type === "warning" ? "text-warning" : "text-leaf"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">{alert.plant}</p>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">View All Alerts</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── Reusable chart component ─────────────────────────────
interface SensorChartProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  data: { time: string; value: number }[];
  color: string;
  unit: string;
  loading?: boolean;
  chartType?: "area" | "line";
}

function SensorChart({ title, description, icon, data, color, unit, loading, chartType = "area" }: SensorChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">{icon}{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : chartType === "area" ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} unit={unit} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#grad-${title})`} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} unit={unit} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ fill: color, strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
