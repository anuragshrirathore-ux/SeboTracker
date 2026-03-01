import React from 'react';
import { X, BookOpen, AlertCircle, CheckCircle, HelpCircle, Calendar, TrendingUp, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { FoodLogEntry } from '../types';
import { format, isValid } from 'date-fns';

interface LogbookProps {
  onClose: () => void;
  foodItems: FoodLogEntry[];
  onDeleteEntry?: (id: string) => void;
}

export default function Logbook({ onClose, foodItems, onDeleteEntry }: LogbookProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      className="fixed inset-0 z-50 bg-zinc-50 flex flex-col"
    >
      <header className="p-6 bg-white border-b border-zinc-100 flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-indigo-600" />
          Food Logbook
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full">
          <X className="w-6 h-6" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {foodItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-4">
            <BookOpen className="w-16 h-16 opacity-20" />
            <p className="font-medium text-lg">Your metabolic history is empty</p>
          </div>
        ) : (
          foodItems.map((item, index) => (
            <motion.div 
              key={item.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl overflow-hidden border-2 border-zinc-100 shadow-sm"
            >
              {item.image && (
                <div className="h-48 w-full overflow-hidden relative group">
                  <img src={item.image} className="w-full h-full object-cover" alt="Logged food" />
                  {onDeleteEntry && (
                    <button 
                      onClick={() => onDeleteEntry(item.id)}
                      className="absolute top-4 right-4 p-3 bg-rose-500 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      <span className="text-xs font-mono text-zinc-400">
                        {item.timestamp && isValid(new Date(item.timestamp)) 
                          ? format(new Date(item.timestamp), 'MMM d, h:mm a')
                          : 'Unknown Date'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold">{item.category}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 ${
                      item.flag === 'Red' ? 'bg-rose-100 text-rose-600' :
                      item.flag === 'Yellow' ? 'bg-amber-100 text-amber-600' :
                      'bg-emerald-100 text-emerald-600'
                    }`}>
                      {item.flag === 'Red' ? <AlertCircle className="w-4 h-4" /> :
                       item.flag === 'Yellow' ? <HelpCircle className="w-4 h-4" /> :
                       <CheckCircle className="w-4 h-4" />}
                      {item.flag} Flag
                    </div>
                    {!item.image && onDeleteEntry && (
                      <button 
                        onClick={() => onDeleteEntry(item.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 rounded-2xl">
                  <p className="text-zinc-700 leading-relaxed font-medium">{item.reason}</p>
                </div>

                {item.flag === 'Yellow' && item.regularity_warning && (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-amber-800 text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Regularity Warning:
                    </p>
                    <p className="text-amber-700 text-sm mt-1">{item.regularity_warning}</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase text-zinc-400">Calories</span>
                    <span className="text-sm font-bold text-zinc-600">{item.calories || 0} kcal</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold uppercase text-zinc-400">SRS Impact</span>
                    <span className={`font-mono font-bold text-lg ${(item.score ?? 0) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {(item.score ?? 0) > 0 ? '+' : ''}{item.score ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
