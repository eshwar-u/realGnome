import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import GardenBuilder from "@/pages/GardenBuilder";
import CalendarPage from "@/pages/Calendar";
import Goals from "@/pages/Goals";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import { GoalsProvider } from "@/contexts/GoalsContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GoalsProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/garden" element={<GardenBuilder />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/goals" element={<Goals />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </GoalsProvider>
  </QueryClientProvider>
);

export default App;
