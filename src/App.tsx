import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import Dashboard from './components/Dashboard';
import CameraLog from './components/CameraLog';
import Logbook from './components/Logbook';
import SleepDashboard from './components/SleepDashboard';
import SkinLog from './components/SkinLog';
import DaySummary from './components/DaySummary';
import { DailyLog, FoodCategory, FOOD_SCORES, FoodLogEntry } from './types';
import { format, parse, differenceInHours, addDays, isSameDay } from 'date-fns';

const getInitialLog = (date: string): DailyLog => ({
  date,
  food_score: 0,
  sleep_penalty: 0,
  stress_penalty: 0,
  medication_mitigation: 0,
  total_srs: 0,
  food_items: [],
  slept_after_1am: false,
  travel_day: false,
  shampoo_done: false,
  cream_applied: false,
  itch_level: 0,
  flakes: 0,
  redness: 0,
  calories: 0,
});

export default function App() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentLog, setCurrentLog] = useState<DailyLog>(getInitialLog(selectedDate));
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isLogbookOpen, setIsLogbookOpen] = useState(false);
  const [isSleepOpen, setIsSleepOpen] = useState(false);
  const [isSkinLogOpen, setIsSkinLogOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const [isSyncing, setIsSyncing] = useState(true);

  const fetchLogs = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      
      // Parse food_items for all logs to ensure consistency across components
      const parsedLogs = data.map((log: any) => {
        let foodItems = [];
        try {
          foodItems = typeof log.food_items === 'string' ? JSON.parse(log.food_items || '[]') : (log.food_items || []);
        } catch (e) {
          console.error("Failed to parse food_items for log:", log.date, e);
        }
        
        const sanitizedLog = {
          ...getInitialLog(log.date),
          ...log,
          food_items: foodItems,
          // Ensure boolean conversion from SQLite integers
          slept_after_1am: !!log.slept_after_1am,
          travel_day: !!log.travel_day,
          shampoo_done: !!log.shampoo_done,
          cream_applied: !!log.cream_applied
        };
        
        // Re-calculate SRS to ensure it's accurate
        sanitizedLog.total_srs = calculateSRS(sanitizedLog);
        return sanitizedLog;
      });
      
      setLogs(parsedLogs);
      
      const logForSelectedDate = parsedLogs.find((l: any) => l.date === selectedDate);
      if (logForSelectedDate) {
        setCurrentLog(logForSelectedDate);
      } else {
        setCurrentLog(getInitialLog(selectedDate));
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [selectedDate]);

  // Midnight Auto-Refresh Logic
  useEffect(() => {
    const checkDateChange = () => {
      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');
      
      if (isSameDay(new Date(selectedDate), now) && selectedDate !== todayStr) {
        setSelectedDate(todayStr);
      }
    };

    const interval = setInterval(checkDateChange, 60000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const calculateSRS = (log: DailyLog) => {
    const foodScore = log.food_score || 0;
    const stressPenalty = log.stress_penalty || 0;
    const sleepPenalty = log.sleep_penalty || 0;
    const medicationMitigation = log.medication_mitigation || 0;

    let score = foodScore + stressPenalty;
    
    // Sleep penalty: based on duration OR biological flag
    if (sleepPenalty > 0 || log.slept_after_1am) {
      score += 2;
    }
    
    // Travel penalty
    if (log.travel_day) {
      score += 2;
    }
    
    // Medication mitigation
    if (log.shampoo_done || log.cream_applied || medicationMitigation > 0) {
      score -= 3;
    }
    
    return Math.max(0, score);
  };

  const updateLog = async (updates: Partial<DailyLog>) => {
    const newLog = { ...currentLog, ...updates };
    newLog.total_srs = calculateSRS(newLog);
    
    // Calculate total calories for the day
    newLog.calories = newLog.food_items.reduce((sum, item) => sum + (item.calories || 0), 0);
    
    setCurrentLog(newLog);
    
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog),
      });
      fetchLogs();
    } catch (err) {
      console.error("Failed to save log:", err);
    }
  };

  const handleLogMeal = (analysis: { category: FoodCategory; flag: "Red" | "Yellow" | "Green"; reason: string; regularity_warning?: string; image: string; calories: number }) => {
    const score = FOOD_SCORES[analysis.category] ?? 0;
    const newEntry: FoodLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      category: analysis.category,
      flag: analysis.flag,
      reason: analysis.reason,
      regularity_warning: analysis.regularity_warning,
      image: analysis.image,
      score: score,
      calories: analysis.calories
    };
    
    const newFoodItems = [...currentLog.food_items, newEntry];
    const newFoodScore = newFoodItems.reduce((sum, item) => sum + item.score, 0);
    
    updateLog({
      food_score: newFoodScore,
      food_items: newFoodItems
    });
    setIsCameraOpen(false);
  };

  const handleUpdateSleep = (start: string, end: string) => {
    const startTime = parse(start, 'HH:mm', new Date());
    let endTime = parse(end, 'HH:mm', new Date());
    if (endTime < startTime) endTime = new Date(endTime.getTime() + 24 * 60 * 60 * 1000);
    
    const hours = differenceInHours(endTime, startTime);
    const penalty = hours < 6 ? 2 : 0;
    
    updateLog({
      sleep_start: start,
      sleep_end: end,
      sleep_penalty: penalty
    });
  };

  const handleDeleteEntry = (id: string) => {
    const newFoodItems = currentLog.food_items.filter(item => item.id !== id);
    const foodScore = newFoodItems.reduce((sum, item) => sum + item.score, 0);
    
    updateLog({ 
      food_items: newFoodItems,
      food_score: foodScore
    });
  };

  const navigateDate = (days: number) => {
    const newDate = format(addDays(new Date(selectedDate), days), 'yyyy-MM-dd');
    setSelectedDate(newDate);
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <AnimatePresence mode="wait">
        {!isCameraOpen ? (
          <Dashboard 
            key={selectedDate}
            onOpenCamera={() => setIsCameraOpen(true)} 
            onOpenSleep={() => setIsSleepOpen(true)}
            onOpenLogbook={() => setIsLogbookOpen(true)}
            onOpenSkinLog={() => setIsSkinLogOpen(true)}
            onOpenSummary={() => setIsSummaryOpen(true)}
            logs={logs}
            currentLog={currentLog}
            onUpdateLog={updateLog}
            selectedDate={selectedDate}
            onNavigateDate={navigateDate}
            isSyncing={isSyncing}
          />
        ) : (
          <CameraLog 
            key="camera"
            onClose={() => setIsCameraOpen(false)} 
            onLogMeal={handleLogMeal}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLogbookOpen && (
          <Logbook 
            onClose={() => setIsLogbookOpen(false)} 
            foodItems={currentLog.food_items}
            onDeleteEntry={handleDeleteEntry}
          />
        )}
        {isSleepOpen && (
          <SleepDashboard 
            onClose={() => setIsSleepOpen(false)}
            currentLog={currentLog}
            logs={logs}
            onUpdateSleep={handleUpdateSleep}
          />
        )}
        {isSkinLogOpen && (
          <SkinLog 
            onClose={() => setIsSkinLogOpen(false)}
            currentLog={currentLog}
            onUpdateLog={updateLog}
          />
        )}
        {isSummaryOpen && (
          <DaySummary 
            onClose={() => setIsSummaryOpen(false)}
            log={currentLog}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
