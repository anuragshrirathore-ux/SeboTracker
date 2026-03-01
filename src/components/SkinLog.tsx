import React, { useState } from 'react';
import { X, Save, Activity, Thermometer, Droplets, AlertCircle, Plane, Moon, Shield, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { DailyLog } from '../types';

interface SkinLogProps {
  onClose: () => void;
  currentLog: DailyLog;
  onUpdateLog: (updates: Partial<DailyLog>) => void;
}

export default function SkinLog({ onClose, currentLog, onUpdateLog }: SkinLogProps) {
  const [itch, setItch] = useState(currentLog.itch_level || 0);
  const [flakes, setFlakes] = useState(currentLog.flakes || 0);
  const [redness, setRedness] = useState(currentLog.redness || 0);
  
  const [sleptLate, setSleptLate] = useState(currentLog.slept_after_1am || false);
  const [travel, setTravel] = useState(currentLog.travel_day || false);
  
  const [shampoo, setShampoo] = useState(currentLog.shampoo_done || false);
  const [cream, setCream] = useState(currentLog.cream_applied || false);

  const handleSave = () => {
    onUpdateLog({
      itch_level: itch,
      flakes: flakes,
      redness: redness,
      slept_after_1am: sleptLate,
      travel_day: travel,
      shampoo_done: shampoo,
      cream_applied: cream
    });
    onClose();
  };

  // Live SRS Preview Calculation
  const calculateLiveSRS = () => {
    let score = currentLog.food_score + currentLog.stress_penalty;
    if (currentLog.sleep_penalty > 0 || sleptLate) score += 2;
    if (travel) score += 2;
    if (shampoo || cream || currentLog.medication_mitigation > 0) score -= 3;
    return Math.max(0, score);
  };

  const liveSRS = calculateLiveSRS();

  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      className="fixed inset-0 z-50 bg-zinc-50 flex flex-col"
    >
      <header className="p-6 bg-white border-b border-zinc-100 flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="w-7 h-7 text-rose-500" />
          Biological Tracking
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full">
          <X className="w-6 h-6" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
        {/* Skin Symptoms - ML Labels */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Skin Status (Outcome Labels)</h3>
          </div>
          
          <div className="space-y-6">
            <SliderField 
              label="Itch Level" 
              value={itch} 
              onChange={setItch} 
              icon={<AlertCircle className="w-5 h-5 text-rose-500" />} 
            />
            <SliderField 
              label="Flakes" 
              value={flakes} 
              onChange={setFlakes} 
              icon={<Droplets className="w-5 h-5 text-blue-500" />} 
            />
            <SliderField 
              label="Redness" 
              value={redness} 
              onChange={setRedness} 
              icon={<Thermometer className="w-5 h-5 text-orange-500" />} 
            />
          </div>
        </section>

        {/* Biological Triggers */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Moon className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Biological Triggers (SRS Features)</h3>
          </div>
          
          <div className="grid gap-3">
            <ToggleButton 
              label="Slept after 1 AM?" 
              active={sleptLate} 
              onClick={() => setSleptLate(!sleptLate)}
              icon={<Moon className="w-5 h-5" />}
              activeColor="bg-indigo-500"
            />
            <ToggleButton 
              label="Travel Day?" 
              active={travel} 
              onClick={() => setTravel(!travel)}
              icon={<Plane className="w-5 h-5" />}
              activeColor="bg-blue-500"
            />
          </div>
        </section>

        {/* Care Actions */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Care Actions (Mitigation)</h3>
          </div>
          
          <div className="grid gap-3">
            <ToggleButton 
              label="Medicated Shampoo?" 
              active={shampoo} 
              onClick={() => setShampoo(!shampoo)}
              icon={<Shield className="w-5 h-5" />}
              activeColor="bg-emerald-500"
            />
            <ToggleButton 
              label="Treatment Cream?" 
              active={cream} 
              onClick={() => setCream(!cream)}
              icon={<Droplets className="w-5 h-5" />}
              activeColor="bg-emerald-500"
            />
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-zinc-100 flex items-center gap-4">
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase text-zinc-400">Predicted SRS</p>
          <p className="text-2xl font-black text-zinc-900">{liveSRS}<span className="text-xs opacity-30">/15</span></p>
        </div>
        <button 
          onClick={handleSave}
          className="flex-[2] py-4 bg-zinc-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-zinc-900/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" /> Save Log
        </button>
      </div>
    </motion.div>
  );
}

function SliderField({ label, value, onChange, icon }: { label: string, value: number, onChange: (v: number) => void, icon: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-bold text-zinc-700">{label}</span>
        </div>
        <span className="text-2xl font-black text-zinc-900">{value}</span>
      </div>
      <input 
        type="range" 
        min="0" 
        max="5" 
        step="1" 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-3 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
      />
      <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
        <span>None</span>
        <span>Mild</span>
        <span>Moderate</span>
        <span>Severe</span>
      </div>
    </div>
  );
}

function ToggleButton({ label, active, onClick, icon, activeColor }: { label: string, active: boolean, onClick: () => void, icon: React.ReactNode, activeColor: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
        active ? `${activeColor} border-transparent text-white shadow-lg` : 'bg-white border-zinc-100 text-zinc-600'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${active ? 'bg-white/20' : 'bg-zinc-50'}`}>
          {icon}
        </div>
        <span className="font-bold">{label}</span>
      </div>
      <div className={`w-12 h-6 rounded-full relative transition-colors ${active ? 'bg-white/30' : 'bg-zinc-200'}`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${active ? 'left-7' : 'left-1'}`} />
      </div>
    </button>
  );
}
