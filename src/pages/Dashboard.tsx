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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const sensorIcons = { moisture: Droplets, temperature: Thermometer, light: Sun };
const sensorCardVariants: Record<string, string> = {
  moisture: "sensor",
  temperature: "default",
  light: "default",
};
const sensorIconBg: Record<string, string> = {
  moisture: "bg-sky/20",
  temperature: "bg-warning/20",
  light: "bg-sun/20",
};
const sensorIconColor: Record<string, string> = {
  moisture: "text-sky",
  temperature: "text-warning",
  light: "text-sun",
};

export default function Dashboard() {
  const { data: sensors, isLoading: sensorsLoading } = useSensorData();
  const { data: plants, isLoading: plantsLoading } = usePlantHealth();
  const { average: avgHealth, count: plantCount } = useAveragePlantHealth();
  const { data: alerts, isLoading: alertsLoading } = useAlerts();

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
            : sensors?.map((sensor) => {
                const Icon = sensorIcons[sensor.type] ?? Sun;
                const TrendIcon = sensor.trendDirection === "up" ? TrendingUp : sensor.trendDirection === "down" ? TrendingDown : TrendingUp;
                return (
                  <Card key={sensor.type} variant={sensorCardVariants[sensor.type] as any} className="relative overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${sensorIconBg[sensor.type]} flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 ${sensorIconColor[sensor.type]}`} />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground capitalize">{sensor.type}</p>
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

        {/* Charts */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SensorChart
            title="Soil Moisture"
            description="24-hour moisture levels across all sensors"
            icon={<Droplets className="w-5 h-5 text-sky" />}
            data={sensors?.find((s) => s.type === "moisture")?.readings ?? []}
            color="hsl(195, 80%, 50%)"
            unit="%"
            loading={sensorsLoading}
          />
          <SensorChart
            title="Temperature"
            description="Ambient temperature readings throughout the day"
            icon={<Thermometer className="w-5 h-5 text-warning" />}
            data={sensors?.find((s) => s.type === "temperature")?.readings ?? []}
            color="hsl(35, 95%, 55%)"
            unit="°C"
            loading={sensorsLoading}
            chartType="line"
          />
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
