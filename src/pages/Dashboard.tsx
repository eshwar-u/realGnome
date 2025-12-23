import { motion } from "framer-motion";
import {
  Droplets,
  Thermometer,
  Sun,
  Leaf,
  AlertTriangle,
  TrendingUp,
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

// Mock sensor data
const moistureData = [
  { time: "6AM", value: 65 },
  { time: "9AM", value: 58 },
  { time: "12PM", value: 45 },
  { time: "3PM", value: 40 },
  { time: "6PM", value: 55 },
  { time: "9PM", value: 62 },
];

const temperatureData = [
  { time: "6AM", value: 18 },
  { time: "9AM", value: 22 },
  { time: "12PM", value: 28 },
  { time: "3PM", value: 30 },
  { time: "6PM", value: 25 },
  { time: "9PM", value: 20 },
];

const lightData = [
  { time: "6AM", value: 200 },
  { time: "9AM", value: 600 },
  { time: "12PM", value: 900 },
  { time: "3PM", value: 850 },
  { time: "6PM", value: 400 },
  { time: "9PM", value: 50 },
];

const plantHealthData = [
  { name: "Tomatoes", health: 92, status: "excellent" },
  { name: "Basil", health: 78, status: "good" },
  { name: "Peppers", health: 65, status: "needs attention" },
  { name: "Lettuce", health: 88, status: "excellent" },
  { name: "Carrots", health: 71, status: "good" },
];

const alerts = [
  {
    id: 1,
    type: "warning",
    plant: "Peppers",
    message: "Moisture below threshold (35%)",
    time: "2 hours ago",
  },
  {
    id: 2,
    type: "info",
    plant: "Tomatoes",
    message: "Optimal growth conditions detected",
    time: "4 hours ago",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Dashboard() {
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
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card variant="sensor" className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-sky/20 flex items-center justify-center">
                  <Droplets className="w-6 h-6 text-sky" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Moisture</p>
                  <p className="text-2xl font-display font-bold text-foreground">
                    54%
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center text-sm text-leaf">
                <TrendingUp className="w-4 h-4 mr-1" />
                +5% from yesterday
              </div>
            </CardContent>
          </Card>

          <Card variant="default" className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                  <Thermometer className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Temperature</p>
                  <p className="text-2xl font-display font-bold text-foreground">
                    24°C
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center text-sm text-muted-foreground">
                Optimal range: 20-28°C
              </div>
            </CardContent>
          </Card>

          <Card variant="default" className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-sun/20 flex items-center justify-center">
                  <Sun className="w-6 h-6 text-sun" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Light Level</p>
                  <p className="text-2xl font-display font-bold text-foreground">
                    720 lux
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center text-sm text-leaf">
                <TrendingUp className="w-4 h-4 mr-1" />
                Good sunlight today
              </div>
            </CardContent>
          </Card>

          <Card variant="plant" className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-leaf/20 flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-leaf" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plant Health</p>
                  <p className="text-2xl font-display font-bold text-foreground">
                    79%
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center text-sm text-muted-foreground">
                5 plants monitored
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Moisture Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Droplets className="w-5 h-5 text-sky" />
                Soil Moisture
              </CardTitle>
              <CardDescription>
                24-hour moisture levels across all sensors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={moistureData}>
                    <defs>
                      <linearGradient
                        id="moistureGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(195, 80%, 50%)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(195, 80%, 50%)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="time"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      unit="%"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(195, 80%, 50%)"
                      strokeWidth={2}
                      fill="url(#moistureGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Temperature Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Thermometer className="w-5 h-5 text-warning" />
                Temperature
              </CardTitle>
              <CardDescription>
                Ambient temperature readings throughout the day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={temperatureData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="time"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      unit="°C"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(35, 95%, 55%)"
                      strokeWidth={2}
                      dot={{ fill: "hsl(35, 95%, 55%)", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Plant Health & Alerts */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Plant Health */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Leaf className="w-5 h-5 text-leaf" />
                Plant Health Overview
              </CardTitle>
              <CardDescription>
                Individual plant health scores based on sensor data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plantHealthData.map((plant, index) => (
                  <motion.div
                    key={plant.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <div className="w-24 text-sm font-medium text-foreground">
                      {plant.name}
                    </div>
                    <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${plant.health}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className={`h-full rounded-full ${
                          plant.health >= 80
                            ? "bg-leaf"
                            : plant.health >= 60
                            ? "bg-sun"
                            : "bg-warning"
                        }`}
                      />
                    </div>
                    <div className="w-12 text-sm font-medium text-foreground">
                      {plant.health}%
                    </div>
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
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card variant="alert">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Recent Alerts
              </CardTitle>
              <CardDescription>
                Plant health notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
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
                          alert.type === "warning"
                            ? "text-warning"
                            : "text-leaf"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {alert.plant}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {alert.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {alert.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  View All Alerts
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
