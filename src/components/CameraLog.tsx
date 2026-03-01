import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, Loader2, RefreshCw, Upload, Image as ImageIcon, Search, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeFoodImage, searchFoodByName } from '../services/gemini';
import { FoodCategory, FOOD_SCORES } from '../types';

interface CameraLogProps {
  key?: string;
  onClose: () => void;
  onLogMeal: (analysis: { category: FoodCategory; flag: "Red" | "Yellow" | "Green"; reason: string; regularity_warning?: string; image: string }) => void;
}

type LogMode = 'camera' | 'search';

export default function CameraLog({ onClose, onLogMeal }: CameraLogProps) {
  const [mode, setMode] = useState<LogMode>('camera');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [analysis, setAnalysis] = useState<{ category: FoodCategory; flag: "Red" | "Yellow" | "Green"; reason: string; regularity_warning?: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'camera') {
      async function startCamera() {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        } catch (err) {
          console.error("Camera error:", err);
        }
      }
      startCamera();
    } else {
      stream?.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [mode]);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const data = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(data);
        analyze(data);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCapturedImage(base64String);
        analyze(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const result = await searchFoodByName(searchQuery);
      setCapturedImage(result.image);
      setAnalysis({
        category: result.category,
        flag: result.flag,
        reason: result.reason,
        regularity_warning: result.regularity_warning
      });
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyze = async (image: string) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeFoodImage(image);
      setAnalysis(result);
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      <div className="p-4 flex justify-between items-center text-white">
        <div className="flex bg-white/10 rounded-xl p-1">
          <button 
            onClick={() => { setMode('camera'); setCapturedImage(null); setAnalysis(null); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${mode === 'camera' ? 'bg-white text-black' : 'text-white/60'}`}
          >
            Camera
          </button>
          <button 
            onClick={() => { setMode('search'); setCapturedImage(null); setAnalysis(null); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${mode === 'search' ? 'bg-white text-black' : 'text-white/60'}`}
          >
            Search
          </button>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden bg-zinc-900">
        {!capturedImage ? (
          mode === 'camera' ? (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-2 border-white/20 pointer-events-none m-8 rounded-3xl" />
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
                <Search className="w-10 h-10 text-white/20" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Food Search</h3>
                <p className="text-white/40 text-sm">Type the name of your meal and AI will find the metabolic impact and a visual reference.</p>
              </div>
              <form onSubmit={handleSearch} className="w-full max-w-sm relative">
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Pepperoni Pizza"
                  className="w-full bg-white/10 border-2 border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-white/20 focus:border-emerald-500 outline-none transition-all"
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-2 bottom-2 px-4 bg-emerald-500 rounded-xl text-white active:scale-95 transition-transform"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>
          )
        ) : (
          <img src={capturedImage} className="w-full h-full object-cover" />
        )}

        <AnimatePresence>
          {isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white"
            >
              <Loader2 className="w-12 h-12 animate-spin mb-4 text-emerald-400" />
              <p className="text-lg font-medium">Analyzing metabolic impact...</p>
              <p className="text-sm opacity-60 mt-2 italic">Mapping to SRS categories</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 bg-zinc-900 text-white">
        {!capturedImage ? (
          mode === 'camera' ? (
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center justify-center gap-8">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-transform"
                  title="Upload Image"
                >
                  <ImageIcon className="w-6 h-6 text-white" />
                </button>

                <button 
                  onClick={capture}
                  className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
                >
                  <div className="w-16 h-16 rounded-full bg-white" />
                </button>

                <div className="w-14 h-14" /> {/* Spacer for symmetry */}
              </div>
              
              <p className="text-sm font-medium opacity-50 uppercase tracking-widest">Capture or Upload</p>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          ) : null
        ) : analysis ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-start gap-4 p-4 bg-white/10 rounded-2xl">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-xl">{analysis.category}</h3>
                <p className="text-sm opacity-70 leading-relaxed">{analysis.reason}</p>
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-sm font-mono">
                  Impact: {FOOD_SCORES[analysis.category] > 0 ? '+' : ''}{FOOD_SCORES[analysis.category]} SRS
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => { setCapturedImage(null); setAnalysis(null); setSearchQuery(''); }}
                className="flex-1 py-4 rounded-2xl bg-white/10 font-semibold flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" /> Retake
              </button>
              <button 
                onClick={() => onLogMeal({ ...analysis, image: capturedImage! })}
                className="flex-[2] py-4 rounded-2xl bg-emerald-500 text-white font-bold text-lg shadow-lg shadow-emerald-500/20"
              >
                Confirm Log
              </button>
            </div>
          </motion.div>
        ) : null}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
}
