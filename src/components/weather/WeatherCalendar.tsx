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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  0: Sun, // Clear sky
  1: Sun, // Mainly clear
  2: Cloud, // Partly cloudy
  3: Cloud, // Overcast
  45: CloudFog, // Foggy
  48: CloudFog, // Depositing rime fog
  51: CloudRain, // Light drizzle
  53: CloudRain, // Moderate drizzle
  55: CloudRain, // Dense drizzle
  61: CloudRain, // Slight rain
  63: CloudRain, // Moderate rain
  65: CloudRain, // Heavy rain
  71: CloudSnow, // Slight snow
  73: CloudSnow, // Moderate snow
  75: CloudSnow, // Heavy snow
  77: CloudSnow, // Snow grains
  80: CloudRain, // Slight rain showers
  81: CloudRain, // Moderate rain showers
  82: CloudRain, // Violent rain showers
  85: CloudSnow, // Slight snow showers
  86: CloudSnow, // Heavy snow showers
  95: CloudLightning, // Thunderstorm
  96: CloudLightning, // Thunderstorm with slight hail
  99: CloudLightning, // Thunderstorm with heavy hail
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

interface WeatherCalendarProps {
  collapsed?: boolean;
}

export function WeatherCalendar({ collapsed = false }: WeatherCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get location name
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
          // Default to New York if geolocation fails
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
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  if (collapsed) {
    const todayWeather = weatherData.find((w) => isToday(w.date));
    const WeatherIcon = todayWeather ? getWeatherIcon(todayWeather.weatherCode) : Sun;
    
    return (
      <div className="flex flex-col items-center gap-1 py-2">
        <WeatherIcon className={cn("w-5 h-5", todayWeather ? getWeatherColor(todayWeather.weatherCode) : "text-sun")} />
        {todayWeather && (
          <span className="text-xs font-medium">{todayWeather.tempMax}°</span>
        )}
      </div>
    );
  }

  return (
    <div className="p-3 bg-sidebar-accent/30 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium text-sm text-sidebar-foreground">
            {format(currentMonth, "MMMM yyyy")}
          </h3>
          {location && (
            <div className="flex items-center gap-1 text-xs text-sidebar-foreground/60">
              <MapPin className="w-3 h-3" />
              <span>{location.name}</span>
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={prevMonth}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={nextMonth}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
          <div
            key={i}
            className="text-center text-xs text-sidebar-foreground/50 font-medium"
          >
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
            className="flex items-center justify-center h-32"
          >
            <Loader2 className="w-5 h-5 animate-spin text-sidebar-foreground/50" />
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center h-32 text-xs text-sidebar-foreground/50"
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
            {/* Empty cells for days before the first of the month */}
            {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}

            {/* Calendar days */}
            {days.map((day) => {
              const weather = getWeatherForDay(day);
              const WeatherIcon = weather ? getWeatherIcon(weather.weatherCode) : null;
              const today = isToday(day);

              return (
                <motion.div
                  key={day.toISOString()}
                  whileHover={{ scale: 1.1 }}
                  className={cn(
                    "relative h-8 flex flex-col items-center justify-center rounded-lg cursor-default transition-colors",
                    today && "bg-leaf/20 ring-1 ring-leaf/50",
                    !today && "hover:bg-sidebar-accent/50"
                  )}
                  title={weather ? `${weather.tempMin}° - ${weather.tempMax}°` : undefined}
                >
                  <span
                    className={cn(
                      "text-xs",
                      today ? "font-bold text-leaf" : "text-sidebar-foreground/80"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {WeatherIcon && (
                    <WeatherIcon
                      className={cn(
                        "w-3 h-3 absolute -bottom-0.5",
                        getWeatherColor(weather!.weatherCode)
                      )}
                    />
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="mt-3 pt-2 border-t border-sidebar-border/50">
        <div className="flex items-center justify-center gap-3 text-xs text-sidebar-foreground/60">
          <div className="flex items-center gap-1">
            <Sun className="w-3 h-3 text-sun" />
            <span>Clear</span>
          </div>
          <div className="flex items-center gap-1">
            <CloudRain className="w-3 h-3 text-sky" />
            <span>Rain</span>
          </div>
          <div className="flex items-center gap-1">
            <Cloud className="w-3 h-3 text-muted-foreground" />
            <span>Cloudy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
