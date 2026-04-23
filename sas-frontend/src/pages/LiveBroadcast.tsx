import { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Activity, 
  Wifi, 
  WifiOff, 
  Users, 
  AlertCircle,
  Volume2
} from 'lucide-react';
import TargetSelector from '../components/TargetSelector';
import { clsx } from 'clsx';

const LiveBroadcast = () => {
  const [isLive, setIsLive] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isLive) {
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
        // Simulate volume meter
        setVolume(Math.floor(Math.random() * 60) + 20);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setDuration(0);
      setVolume(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLive]);

  const formatDuration = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Live Broadcast</h1>
          <p className="text-slate-500 mt-1">Speak directly to selected zones in real-time.</p>
        </div>

        {/* Status Panel */}
        <div className={clsx(
          "card overflow-hidden border-none relative transition-all duration-500",
          isLive ? "bg-brand-900 shadow-2xl scale-[1.02]" : "bg-white"
        )}>
          {isLive && (
            <div className="absolute top-0 left-0 w-full h-1 bg-emergency animate-pulse"></div>
          )}
          
          <div className="p-8 flex flex-col items-center text-center">
             <div className={clsx(
               "w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-500 relative",
               isLive ? "bg-emergency text-white scale-110 shadow-[0_0_40px_rgba(229,62,62,0.4)]" : "bg-slate-50 text-slate-400"
             )}>
               {isLive ? <Activity size={40} className="animate-pulse" /> : <Mic size={40} />}
               {isLive && (
                  <div className="absolute inset-0 rounded-full border-4 border-emergency animate-ping opacity-20"></div>
               )}
             </div>

             <div className={clsx(
               "text-4xl font-black mb-2 font-mono tabular-nums",
               isLive ? "text-white" : "text-slate-300"
             )}>
               {formatDuration(duration)}
             </div>

             <div className={clsx(
               "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-8",
               isLive ? "bg-emergency/20 text-emergency animate-pulse" : "bg-slate-100 text-slate-400"
             )}>
               {isLive ? "On Air" : "Ready to Broadcast"}
             </div>

             {/* Volume Meter */}
             <div className="w-full max-w-md h-4 bg-slate-100 rounded-full overflow-hidden mb-12 flex gap-1 p-0.5">
               {Array.from({ length: 40 }).map((_, i) => (
                 <div 
                   key={i}
                   className={clsx(
                     "flex-1 rounded-sm transition-all duration-200",
                     i < (volume / 2.5) 
                       ? (isLive ? "bg-brand-400" : "bg-slate-300") 
                       : "bg-slate-200"
                   )}
                 ></div>
               ))}
             </div>

             <button 
               onClick={() => setIsLive(!isLive)}
               className={clsx(
                 "btn px-12 py-4 rounded-2xl text-xl font-black uppercase tracking-widest flex items-center gap-3 transition-all",
                 isLive 
                   ? "bg-white text-brand-900 hover:bg-slate-100 shadow-xl" 
                   : "bg-brand-800 text-white hover:bg-brand-900 shadow-lg"
               )}
             >
               {isLive ? (
                 <>
                   <Square fill="currentColor" size={24} />
                   End Broadcast
                 </>
               ) : (
                 <>
                   <Mic size={24} />
                   Go Live
                 </>
               )}
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="card border-l-4 border-brand-400">
             <div className="flex items-center gap-3 text-slate-400 mb-2">
               <Wifi size={18} />
               <span className="text-xs font-bold uppercase">Connection</span>
             </div>
             <p className="font-bold text-slate-900">Optimal (12ms latency)</p>
           </div>
           <div className="card border-l-4 border-brand-400">
             <div className="flex items-center gap-3 text-slate-400 mb-2">
               <Users size={18} />
               <span className="text-xs font-bold uppercase">Targets Reached</span>
             </div>
             <p className="font-bold text-slate-900">42 Endpoints</p>
           </div>
        </div>
      </div>

      {/* Sidebar for Targets */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Targeting</h2>
          {isLive && (
            <div className="flex items-center gap-2 text-emergency text-xs font-bold animate-pulse">
              <div className="w-1.5 h-1.5 bg-emergency rounded-full"></div>
              LOCKED
            </div>
          )}
        </div>
        <div className={clsx("transition-opacity", isLive && "opacity-50 pointer-events-none")}>
          <TargetSelector />
        </div>
        
        <div className="card bg-blue-50 border-blue-100">
          <div className="flex gap-3">
            <Volume2 className="text-blue-500 shrink-0" size={20} />
            <div>
              <p className="text-sm font-bold text-blue-900">Audio Optimization</p>
              <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                Opus codec active at 32kbps. Echo cancellation and noise suppression enabled for classroom speakers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveBroadcast;
