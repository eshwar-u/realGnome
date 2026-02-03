import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Loader2,
  Thermometer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WeatherData {
  date: Date;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
}

interface Location {
  latitude: number;
  longitude: number;
  name: string;
}

const weatherCodeToIcon: Record<number, React.ComponentType<{ className?: string }>> = {
  0: Sun,
  1: Sun,
  2: Cloud,
  3: Cloud,
  45: CloudFog,
  48: CloudFog,
  51: CloudRain,
  53: CloudRain,
  55: CloudRain,
  61: CloudRain,
  63: CloudRain,
  65: CloudRain,
  71: CloudSnow,
  73: CloudSnow,
  75: CloudSnow,
  77: CloudSnow,
  80: CloudRain,
  81: CloudRain,
  82: CloudRain,
  85: CloudSnow,
  86: CloudSnow,
  95: CloudLightning,
  96: CloudLightning,
  99: CloudLightning,
};

const weatherCodeToLabel: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Moderate showers",
  82: "Violent showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm",
};

const getWeatherIcon = (code: number) => {
  return weatherCodeToIcon[code] || Cloud;
};

const getWeatherColor = (code: number): string => {
  if (code === 0 || code === 1) return "text-sun";
  if (code === 2 || code === 3) return "text-muted-foreground";
  if (code >= 45 && code <= 48) return "text-muted-foreground/70";
  if ((code >= 51 && code <= 65) || (code >= 80 && code <= 82)) return "text-sky";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "text-sky/70";
  if (code >= 95) return "text-destructive";
  return "text-muted-foreground";
};

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const geoResponse = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=auto`
            );
            const geoData = await geoResponse.json();
            setLocation({
              latitude,
              longitude,
              name: geoData.timezone?.split("/").pop()?.replace(/_/g, " ") || "Your Location",
            });
          } catch {
            setLocation({ latitude, longitude, name: "Your Location" });
          }
        },
        () => {
          setLocation({ latitude: 40.7128, longitude: -74.006, name: "New York" });
        }
      );
    } else {
      setLocation({ latitude: 40.7128, longitude: -74.006, name: "New York" });
    }
  }, []);

  useEffect(() => {
    if (!location) return;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);

      try {
        const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
        const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");

        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&start_date=${start}&end_date=${end}&timezone=auto`
        );

        if (!response.ok) throw new Error("Failed to fetch weather");

        const data = await response.json();

        const weatherDays: WeatherData[] = data.daily.time.map((date: string, index: number) => ({
          date: new Date(date),
          weatherCode: data.daily.weather_code[index],
          tempMax: Math.round(data.daily.temperature_2m_max[index]),
          tempMin: Math.round(data.daily.temperature_2m_min[index]),
        }));

        setWeatherData(weatherDays);
      } catch (err) {
        setError("Unable to load weather");
        console.error("Weather fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [location, currentMonth]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getWeatherForDay = (date: Date) => {
    return weatherData.find((w) => isSameDay(w.date, date));
  };

  const prevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const selectedWeather = selectedDay ? getWeatherForDay(selectedDay) : null;
  const todayWeather = weatherData.find((w) => isToday(w.date));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Weather Calendar</h1>
          {location && (
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <MapPin className="w-4 h-4" />
              <span>{location.name}</span>
            </div>
          )}
        </div>

        {/* Today's Weather Card */}
        {todayWeather && (
          <Card className="bg-gradient-to-br from-leaf/10 to-leaf/5 border-leaf/20">
            <CardContent className="flex items-center gap-4 p-4">
              {(() => {
                const WeatherIcon = getWeatherIcon(todayWeather.weatherCode);
                return <WeatherIcon className={cn("w-10 h-10", getWeatherColor(todayWeather.weatherCode))} />;
              })()}
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{todayWeather.tempMax}°</p>
                <p className="text-xs text-muted-foreground">{todayWeather.tempMin}° low</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl">{format(currentMonth, "MMMM yyyy")}</CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center h-64"
                >
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center h-64 text-muted-foreground"
                >
                  {error}
                </motion.div>
              ) : (
                <motion.div
                  key={format(currentMonth, "yyyy-MM")}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="grid grid-cols-7 gap-1"
                >
                  {/* Empty cells */}
                  {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-16" />
                  ))}

                  {/* Calendar days */}
                  {days.map((day) => {
                    const weather = getWeatherForDay(day);
                    const WeatherIcon = weather ? getWeatherIcon(weather.weatherCode) : null;
                    const today = isToday(day);
                    const isSelected = selectedDay && isSameDay(day, selectedDay);

                    return (
                      <motion.button
                        key={day.toISOString()}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedDay(day)}
                        className={cn(
                          "relative h-16 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer",
                          today && "ring-2 ring-leaf ring-offset-2 ring-offset-background",
                          isSelected && "bg-accent",
                          !isSelected && !today && "hover:bg-accent/50"
                        )}
                      >
                        <span
                          className={cn(
                            "text-sm font-medium",
                            today ? "text-leaf" : "text-foreground"
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        {WeatherIcon && (
                          <WeatherIcon className={cn("w-5 h-5 mt-1", getWeatherColor(weather!.weatherCode))} />
                        )}
                        {weather && (
                          <span className="text-xs text-muted-foreground">{weather.tempMax}°</span>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDay ? format(selectedDay, "EEEE, MMMM d") : "Select a day"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedWeather ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {(() => {
                    const WeatherIcon = getWeatherIcon(selectedWeather.weatherCode);
                    return <WeatherIcon className={cn("w-16 h-16", getWeatherColor(selectedWeather.weatherCode))} />;
                  })()}
                  <div>
                    <p className="text-4xl font-bold">{selectedWeather.tempMax}°</p>
                    <p className="text-muted-foreground">{weatherCodeToLabel[selectedWeather.weatherCode] || "Unknown"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-lg">
                  <Thermometer className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Temperature Range</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedWeather.tempMin}° - {selectedWeather.tempMax}°
                    </p>
                  </div>
                </div>

                {/* Gardening tips based on weather */}
                <div className="p-3 bg-leaf/10 rounded-lg border border-leaf/20">
                  <p className="text-sm font-medium text-leaf mb-1">Gardening Tip</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedWeather.weatherCode >= 61 && selectedWeather.weatherCode <= 82
                      ? "Rain expected - skip watering your plants today!"
                      : selectedWeather.tempMax > 30
                      ? "Hot day ahead - water plants in early morning or evening."
                      : selectedWeather.tempMin < 5
                      ? "Cold night expected - protect frost-sensitive plants."
                      : "Great conditions for general garden maintenance!"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Click on a day to see detailed weather information
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-center gap-6 py-4">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-sun" />
            <span className="text-sm">Clear</span>
          </div>
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm">Cloudy</span>
          </div>
          <div className="flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-sky" />
            <span className="text-sm">Rain</span>
          </div>
          <div className="flex items-center gap-2">
            <CloudSnow className="w-5 h-5 text-sky/70" />
            <span className="text-sm">Snow</span>
          </div>
          <div className="flex items-center gap-2">
            <CloudLightning className="w-5 h-5 text-destructive" />
            <span className="text-sm">Storm</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
