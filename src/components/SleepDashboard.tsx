import React, { useState, useMemo } from 'react';
import { X, Moon, Sun, Save, History, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { format, differenceInHours, parse, isValid } from 'date-fns';
import { DailyLog } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SleepDashboardProps {
  onClose: () => void;
  currentLog: DailyLog;
  logs: DailyLog[];
  onUpdateSleep: (start: string, end: string) => void;
}

export default function SleepDashboard({ onClose, currentLog, logs, onUpdateSleep }: SleepDashboardProps) {
  const [startTime, setStartTime] = useState(currentLog.sleep_start || "22:00");
  const [endTime, setEndTime] = useState(currentLog.sleep_end || "07:00");

  const handleSave = () => {
    onUpdateSleep(startTime, endTime);
    onClose();
  };

  const chartData = useMemo(() => {
    // Only process the last 7 logs for the weekly chart
    return [...logs]
      .slice(0, 7)
      .reverse()
      .filter(log => log.date && isValid(new Date(log.date)))
      .map(log => {
        let hours = 0;
        if (log.sleep_start && log.sleep_end) {
          const start = parse(log.sleep_start, 'HH:mm', new Date());
          let end = parse(log.sleep_end, 'HH:mm', new Date());
          if (isValid(start) && isValid(end)) {
            if (end < start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
            hours = differenceInHours(end, start);
          }
        }
        return {
          date: format(new Date(log.date), 'MMM d'),
          hours
        };
      });
  }, [logs]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 bg-zinc-900/90 backdrop-blur-xl flex items-center justify-center p-4"
    >
      <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl">
        <div className="p-6 flex justify-between items-center border-b border-zinc-100">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Moon className="w-6 h-6 text-indigo-500" />
            Sleep Tracker
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Time Inputs */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-400 flex items-center gap-1">
                <Moon className="w-3 h-3" /> Slept At
              </label>
              <input 
                type="time" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 font-bold text-lg focus:border-indigo-500 outline-none transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-400 flex items-center gap-1">
                <Sun className="w-3 h-3" /> Woke Up At
              </label>
              <input 
                type="time" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 font-bold text-lg focus:border-indigo-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Weekly Habit Chart */}
          <div className="space-y-4">
            <h3 className="font-bold text-zinc-500 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Weekly Sleep Habit
            </h3>
            <div className="h-40 w-full bg-zinc-50 rounded-2xl p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#999'}} />
                  <YAxis hide domain={[0, 12]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#6366f1' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <button 
            onClick={handleSave}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Save className="w-5 h-5" /> Save Sleep Data
          </button>
        </div>
      </div>
    </motion.div>
  );
}
