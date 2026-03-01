import React from 'react';
import { X, Calendar, Activity, AlertTriangle, CheckCircle2, Moon, Shield, Plane, TrendingUp, Info, Utensils, Flame, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { DailyLog, FOOD_SCORES } from '../types';
import { format, isValid } from 'date-fns';

interface DaySummaryProps {
  onClose: () => void;
  log: DailyLog;
}

export default function DaySummary({ onClose, log }: DaySummaryProps) {
  const totalCalories = log.food_items.reduce((sum, item) => sum + (item.calories || 0), 0);
  
  const exportToCSV = () => {
    const headers = ['Date', 'Total SRS', 'Calories', 'Sleep Start', 'Sleep End', 'Late Sleep', 'Travel', 'Shampoo', 'Cream', 'Itch', 'Flakes', 'Redness'];
    const row = [
      log.date,
      log.total_srs,
      totalCalories,
      log.sleep_start || '',
      log.sleep_end || '',
      log.slept_after_1am ? 'Yes' : 'No',
      log.travel_day ? 'Yes' : 'No',
      log.shampoo_done ? 'Yes' : 'No',
      log.cream_applied ? 'Yes' : 'No',
      log.itch_level,
      log.flakes,
      log.redness
    ];

    const foodHeaders = ['Food Category', 'Flag', 'Score', 'Calories', 'Reason'];
    const foodRows = log.food_items.map(item => [
      item.category,
      item.flag,
      item.score,
      item.calories || 0,
      `"${item.reason.replace(/"/g, '""')}"`
    ]);

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.join(",") + "\n";
    csvContent += row.join(",") + "\n\n";
    csvContent += "FOOD LOG\n";
    csvContent += foodHeaders.join(",") + "\n";
    foodRows.forEach(r => {
      csvContent += r.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SeboTracker_${log.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFlareRisk = (srs: number) => {
    if (srs >= 8) return { level: 'High', color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' };
    if (srs >= 4) return { level: 'Medium', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' };
    return { level: 'Low', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' };
  };

  const risk = getFlareRisk(log.total_srs);

  const getRecommendations = (log: DailyLog) => {
    const recs = [];
    if (log.total_srs >= 6) {
      recs.push("Apply preventive medicated shampoo tomorrow morning.");
      recs.push("Strictly avoid all 'Red Flag' foods for the next 48 hours.");
    }
    if (log.slept_after_1am) {
      recs.push("Prioritize an early bedtime tonight to offset biological stress.");
    }
    if (log.food_items.some(i => i.flag === 'Red')) {
      recs.push("Increase water intake to help flush metabolic byproducts.");
    }
    if (recs.length === 0) {
      recs.push("Maintain your current routine. Your metabolic load is stable.");
    }
    return recs;
  };

  const recommendations = getRecommendations(log);

  const srsBreakdown = [
    { label: 'Food Impact', value: log.food_score, color: log.food_score > 0 ? 'text-rose-500' : 'text-emerald-500' },
    { label: 'Sleep Stress', value: (log.sleep_penalty > 0 || log.slept_after_1am) ? 2 : 0, color: 'text-rose-500' },
    { label: 'Travel Stress', value: log.travel_day ? 2 : 0, color: 'text-rose-500' },
    { label: 'Care Mitigation', value: (log.shampoo_done || log.cream_applied || log.medication_mitigation > 0) ? -3 : 0, color: 'text-emerald-500' },
  ].filter(item => item.value !== 0);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 bg-zinc-900/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <header className="p-6 border-b border-zinc-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-6 h-6 text-zinc-900" />
              Day Summary
            </h2>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              {isValid(new Date(log.date)) ? format(new Date(log.date), 'EEEE, MMM d, yyyy') : log.date}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={exportToCSV}
              className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-900 transition-colors"
              title="Export to CSV"
            >
              <Download className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Risk Overview */}
          <section className={`p-6 rounded-3xl border-2 ${risk.bg} ${risk.border}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Flare Likelihood</p>
                <h3 className={`text-3xl font-black ${risk.color}`}>{risk.level}</h3>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">SRS Score</p>
                <p className="text-3xl font-black text-zinc-900">{log.total_srs ?? 0}<span className="text-sm opacity-30">/15</span></p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-white/50 rounded-2xl border border-white">
              <p className="text-sm font-medium text-zinc-700 leading-relaxed">
                <AlertTriangle className="w-4 h-4 inline mr-2 text-amber-500" />
                {log.total_srs >= 4 
                  ? "Inflammatory triggers detected. Biological delay model predicts a potential flare in 36-48 hours."
                  : "Metabolic load is within safe limits. Low probability of flare."}
              </p>
            </div>

            {/* Calculation Breakdown */}
            <div className="mt-6 pt-6 border-t border-zinc-200/50">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Calculation Breakdown</h4>
              <div className="space-y-2">
                {srsBreakdown.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-medium">{item.label}</span>
                    <span className={`font-mono font-bold ${item.color}`}>
                      {item.value > 0 ? '+' : ''}{item.value}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-zinc-200/30 text-xs font-bold">
                  <span className="text-zinc-900">Final SRS</span>
                  <span className="text-zinc-900">{log.total_srs ?? 0}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-bold uppercase text-zinc-400">Calories</span>
              </div>
              <p className="text-xl font-bold text-zinc-900">{totalCalories} <span className="text-xs font-medium opacity-40">kcal</span></p>
            </div>
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <div className="flex items-center gap-2 mb-1">
                <Moon className="w-4 h-4 text-indigo-500" />
                <span className="text-[10px] font-bold uppercase text-zinc-400">Sleep</span>
              </div>
              <p className="text-xl font-bold text-zinc-900">
                {log.slept_after_1am ? 'Late' : 'On-time'}
              </p>
            </div>
          </div>

          {/* Food Intake */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <Utensils className="w-4 h-4" /> Food Intake
            </h3>
            <div className="space-y-2">
              {log.food_items.length === 0 ? (
                <p className="text-sm text-zinc-400 italic">No food logged for this day.</p>
              ) : (
                log.food_items.map((item, i) => (
                  <div key={i} className="p-3 bg-white border border-zinc-100 rounded-xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        item.flag === 'Red' ? 'bg-rose-500' :
                        item.flag === 'Yellow' ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`} />
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{item.category}</p>
                        <p className="text-[10px] text-zinc-400">{item.calories || 0} kcal</p>
                      </div>
                    </div>
                    <span className={`text-xs font-mono font-bold ${item.score > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {item.score > 0 ? '+' : ''}{item.score}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Lifestyle & Care */}
          <section className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Triggers</h3>
              <div className="space-y-2">
                <StatusBadge active={log.slept_after_1am} label="Late Sleep" icon={<Moon className="w-3 h-3" />} />
                <StatusBadge active={log.travel_day} label="Travel" icon={<Plane className="w-3 h-3" />} />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Care</h3>
              <div className="space-y-2">
                <StatusBadge active={log.shampoo_done} label="Shampoo" icon={<Shield className="w-3 h-3" />} activeColor="bg-emerald-500" />
                <StatusBadge active={log.cream_applied} label="Cream" icon={<Shield className="w-3 h-3" />} activeColor="bg-emerald-500" />
              </div>
            </div>
          </section>

          {/* Preventive Guidance */}
          <section className="p-6 bg-zinc-900 rounded-3xl text-white space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Preventive Guidance
            </h3>
            <ul className="space-y-3">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ active, label, icon, activeColor = "bg-rose-500" }: { active: boolean, label: string, icon: React.ReactNode, activeColor?: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold transition-all ${
      active ? `${activeColor} text-white` : 'bg-zinc-100 text-zinc-400'
    }`}>
      {icon}
      {label}
    </div>
  );
}
