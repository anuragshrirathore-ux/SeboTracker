import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Moon, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  History,
  ChevronLeft,
  FileText,
  Download,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { DailyLog, FoodCategory, FOOD_SCORES, Prediction } from '../types';
import { format, subDays, isSameDay, isValid } from 'date-fns';

interface DashboardProps {
  key?: string;
  onOpenCamera: () => void;
  onOpenSleep: () => void;
  onOpenLogbook: () => void;
  onOpenSkinLog: () => void;
  onOpenSummary: () => void;
  logs: DailyLog[];
  currentLog: DailyLog;
  onUpdateLog: (updates: Partial<DailyLog>) => void;
  selectedDate: string;
  onNavigateDate: (days: number) => void;
  isSyncing?: boolean;
}

export default function Dashboard({ 
  onOpenCamera, 
  onOpenSleep, 
  onOpenLogbook, 
  onOpenSkinLog, 
  onOpenSummary,
  logs, 
  currentLog, 
  onUpdateLog,
  selectedDate,
  onNavigateDate,
  isSyncing
}: DashboardProps) {
  const [prediction, setPrediction] = useState<Prediction>({ risk: 'low', message: 'Clear skies ahead. Maintain your routine.', srs: 0 });

  const isToday = isSameDay(new Date(selectedDate), new Date());

  const exportAllToCSV = () => {
    if (logs.length === 0) return;

    const headers = ['Date', 'Total SRS', 'Food Score', 'Sleep Penalty', 'Stress Penalty', 'Mitigation', 'Sleep Start', 'Sleep End', 'Late Sleep', 'Travel', 'Shampoo', 'Cream', 'Itch', 'Flakes', 'Redness', 'Calories'];
    
    const rows = logs.map(log => [
      log.date,
      log.total_srs,
      log.food_score,
      log.sleep_penalty,
      log.stress_penalty,
      log.medication_mitigation,
      log.sleep_start || '',
      log.sleep_end || '',
      log.slept_after_1am ? 'Yes' : 'No',
      log.travel_day ? 'Yes' : 'No',
      log.shampoo_done ? 'Yes' : 'No',
      log.cream_applied ? 'Yes' : 'No',
      log.itch_level,
      log.flakes,
      log.redness,
      log.calories || 0
    ]);

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.join(",") + "\n";
    rows.forEach(r => {
      csvContent += r.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SeboTracker_Full_History_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const srs = currentLog.total_srs;
    if (srs >= 8) {
      setPrediction({
        risk: 'high',
        message: 'CRITICAL RISK: Flare highly likely in 36-48h. Implement strict mitigation immediately.',
        srs
      });
    } else if (srs >= 5) {
      setPrediction({
        risk: 'high',
        message: 'ELEVATED RISK: Triggers detected. Predictive model suggests flare potential. Use preventive care.',
        srs
      });
    } else if (srs >= 3) {
      setPrediction({
        risk: 'low',
        message: 'MODERATE LOAD: Stable for now, but monitor intake closely to avoid accumulation.',
        srs
      });
    } else {
      setPrediction({
        risk: 'low',
        message: 'OPTIMAL: Metabolic load is low. Maintain current routine.',
        srs
      });
    }
  }, [currentLog.total_srs]);

  const chartData = useMemo(() => {
    return [...logs]
      .slice(0, 7)
      .reverse()
      .filter(log => log.date && isValid(new Date(log.date)))
      .map(log => ({
        date: format(new Date(log.date), 'MMM d'),
        srs: log.total_srs
      }));
  }, [logs]);

  return (
    <div className="max-w-md mx-auto pb-24">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigateDate(-1)}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-zinc-400" />
          </button>
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
              {isToday ? "Today's Load" : "Past Record"}
            </p>
            <h1 className="text-2xl font-bold text-zinc-900">
              {format(new Date(selectedDate), 'MMM d')}
            </h1>
          </div>
          {!isToday && (
            <button 
              onClick={() => onNavigateDate(1)}
              className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-zinc-400" />
            </button>
          )}
        </div>
        <div className="text-right flex items-center gap-3">
          <button 
            onClick={exportAllToCSV}
            className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-900 transition-colors"
            title="Export All Data to CSV"
          >
            <Download className="w-5 h-5" />
          </button>
          <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
            {isSyncing && <Loader2 className="w-3 h-3 animate-spin" />}
            {isToday ? "Live Tracking" : "Historical View"}
          </div>
        </div>
      </header>

      <div className="px-6 space-y-6">
        {/* SRS Score Card */}
        <motion.div 
          layoutId="srs-card"
          className={`p-8 rounded-[32px] shadow-2xl relative overflow-hidden ${
            prediction.risk === 'high' ? 'bg-rose-500 text-white' : 'bg-zinc-900 text-white'
          }`}
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-70 font-medium">Current SRS Score</p>
                <div className="text-8xl font-bold mt-2 tracking-tighter flex items-baseline gap-2">
                  {currentLog.total_srs ?? 0}
                  <span className="text-2xl opacity-40 font-medium">/ 15</span>
                </div>
              </div>
              <div className={`p-3 rounded-2xl ${prediction.risk === 'high' ? 'bg-white/20' : 'bg-emerald-500/20'}`}>
                {prediction.risk === 'high' ? <AlertTriangle className="w-8 h-8 text-white" /> : <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-end">
              <div>
                <p className="text-lg font-medium leading-tight">{prediction.message}</p>
                <div className="mt-4 flex items-center gap-2 text-sm opacity-70">
                  <TrendingUp className="w-4 h-4" />
                  <span>36-48h Biological Delay Model Active</span>
                </div>
              </div>
              <button 
                onClick={onOpenSummary}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                View Breakdown
              </button>
            </div>
          </div>
          
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        </motion.div>

        {/* Quick Log Grid */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={onOpenSkinLog}
            className="col-span-2 p-6 rounded-[32px] bg-white border-2 border-zinc-100 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-500 rounded-2xl text-white">
                <Activity className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-zinc-900">Biological Tracking</p>
                <p className="text-xs text-zinc-500">Log symptoms & lifestyle flags</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-300" />
          </button>

          <button 
            onClick={onOpenSleep}
            className={`p-6 rounded-3xl transition-all flex flex-col items-start gap-3 ${
              currentLog.sleep_penalty > 0 || currentLog.slept_after_1am ? 'bg-indigo-50 border-2 border-indigo-200' : 'bg-white border-2 border-zinc-100'
            }`}
          >
            <div className={`p-3 rounded-xl ${currentLog.sleep_penalty > 0 || currentLog.slept_after_1am ? 'bg-indigo-500 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
              <Moon className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold uppercase text-zinc-400">Sleep</p>
              <p className="font-bold text-zinc-900">
                {currentLog.slept_after_1am ? 'Late (>1AM)' : (currentLog.sleep_start ? `${currentLog.sleep_start} - ${currentLog.sleep_end}` : 'Log Sleep')}
              </p>
            </div>
          </button>

          <button 
            onClick={onOpenSummary}
            className="p-6 rounded-3xl bg-white border-2 border-zinc-100 flex flex-col items-start gap-3 shadow-sm active:scale-95 transition-transform"
          >
            <div className="p-3 rounded-xl bg-zinc-100 text-zinc-500">
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold uppercase text-zinc-400">Report</p>
              <p className="font-bold text-zinc-900">Day Summary</p>
            </div>
          </button>

          <button 
            onClick={onOpenCamera}
            className="p-6 rounded-3xl bg-zinc-900 text-white flex flex-col items-start gap-3 shadow-xl shadow-zinc-900/20 active:scale-95 transition-transform"
          >
            <div className="p-3 rounded-xl bg-white/20">
              <Plus className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold uppercase opacity-60">Log Food</p>
              <p className="font-bold">Analyze Meal</p>
            </div>
          </button>
        </div>

        {/* Trend Chart */}
        <div className="p-6 bg-white rounded-[32px] border-2 border-zinc-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-500" />
              SRS Trend
            </h3>
            <span className="text-xs font-mono text-zinc-400">Last 7 Days</span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#999'}} />
                <YAxis hide domain={[0, 15]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold', color: '#18181b' }}
                />
                <ReferenceLine y={6} stroke="#f43f5e" strokeDasharray="3 3" />
                <Line 
                  type="monotone" 
                  dataKey="srs" 
                  stroke="#18181b" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#18181b', strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Food Logs */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500" />
              Today's Intake
            </h3>
            <button 
              onClick={onOpenLogbook}
              className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1"
            >
              View Logbook <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {currentLog.food_items.length === 0 ? (
            <div className="p-8 text-center bg-zinc-100 rounded-3xl border-2 border-dashed border-zinc-200">
              <p className="text-zinc-400 font-medium">No food logged yet</p>
            </div>
          ) : (
            currentLog.food_items.map((item, i) => (
              <div key={i} className="p-4 bg-white rounded-2xl border-2 border-zinc-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    item.flag === 'Red' ? 'bg-rose-500' :
                    item.flag === 'Yellow' ? 'bg-amber-500' :
                    'bg-emerald-500'
                  }`} />
                  <span className="font-semibold text-zinc-700">{item.category}</span>
                </div>
                <span className={`text-sm font-mono font-bold ${(item.score ?? 0) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {(item.score ?? 0) > 0 ? '+' : ''}{item.score ?? 0}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-zinc-100 flex justify-around items-center z-40">
        <button className="p-3 text-zinc-900"><Activity className="w-6 h-6" /></button>
        <button onClick={onOpenLogbook} className="p-3 text-zinc-300"><History className="w-6 h-6" /></button>
      </nav>
    </div>
  );
}
