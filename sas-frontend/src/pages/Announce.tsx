import { useState } from 'react';
import { 
  FileAudio, 
  AlertTriangle, 
  Bell,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Send
} from 'lucide-react';
import TargetSelector from '../components/TargetSelector';
import { clsx } from 'clsx';

type AnnouncementType = 'prerecorded' | 'emergency' | 'bell';

interface AnnouncementCategory {
  id: AnnouncementType;
  icon: React.ElementType;
  label: string;
  color: string;
  desc: string;
}

const Announce = () => {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<AnnouncementType | null>(null);

  const steps = [
    { id: 1, label: 'Type' },
    { id: 2, label: 'Source' },
    { id: 3, label: 'Targets' },
    { id: 4, label: 'Finalize' }
  ];

  const types: AnnouncementCategory[] = [
    { id: 'prerecorded', icon: FileAudio, label: 'Prerecorded', color: 'bg-brand-600', desc: 'Select an audio file from the library' },
    { id: 'emergency', icon: AlertTriangle, label: 'Emergency', color: 'bg-emergency', desc: 'Highest priority, interrupts all active streams' },
    { id: 'bell', icon: Bell, label: 'Bell / Tone', color: 'bg-warning', desc: 'Schedule a recurring school bell' }
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-slate-900">Create Announcement</h1>
        <p className="text-slate-500 mt-1">Broadcast to classrooms, floors, or the entire school.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-12 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
        {steps.map((s, i) => (
          <div key={s.id} className="relative z-10 flex flex-col items-center">
            <div className={clsx(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300",
              step === s.id ? "bg-brand-800 text-white ring-4 ring-brand-100" :
              step > s.id ? "bg-success text-white" : "bg-white border-2 border-slate-200 text-slate-400"
            )}>
              {step > s.id ? <CheckCircle2 size={20} /> : s.id}
            </div>
            <span className={clsx(
              "mt-2 text-xs font-bold uppercase tracking-wider",
              step === s.id ? "text-brand-800" : "text-slate-400"
            )}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="card min-h-[400px] flex flex-col">
        <div className="flex-1">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6">What type of announcement?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {types.map(t => (
                  <div 
                    key={t.id}
                    onClick={() => { setType(t.id as AnnouncementType); setStep(2); }}
                    className={clsx(
                      "p-6 rounded-xl border-2 transition-all cursor-pointer group hover:shadow-lg",
                      type === t.id ? "border-brand-600 bg-brand-50/50" : "border-slate-100 hover:border-brand-200"
                    )}
                  >
                    <div className={clsx("w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4 shadow-md group-hover:scale-110 transition-transform", t.color)}>
                      <t.icon size={24} />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">{t.label}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Select Audio Source</h2>
              <div className="space-y-4">
                 <div className="p-4 border border-brand-200 bg-brand-50 rounded-xl flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <FileAudio className="text-brand-600" />
                     <div>
                       <p className="font-bold text-slate-900">morning_bell.ogg</p>
                       <p className="text-xs text-slate-500">0:04 • 32kbps</p>
                     </div>
                   </div>
                   <button className="text-sm font-bold text-brand-700">Change</button>
                 </div>
                 <button className="btn-secondary w-full border-dashed py-8">+ Upload New or Pick from Library</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Select Targets</h2>
              <TargetSelector />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Final Review</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Type</p>
                    <p className="font-bold text-brand-800 uppercase">{type}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Priority</p>
                    <p className="font-bold text-brand-800">Normal (3)</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Targets</p>
                  <p className="font-medium text-slate-700">Main Building (All Floors), Science Wing (Floor 1)</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between">
          <button 
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="btn-secondary flex items-center gap-2"
          >
            <ChevronLeft size={18} />
            Back
          </button>
          
          {step < 4 ? (
            <button 
              onClick={() => setStep(s => Math.min(4, s + 1))}
              disabled={step === 1 && !type}
              className="btn-primary flex items-center gap-2"
            >
              Next Step
              <ChevronRight size={18} />
            </button>
          ) : (
            <button className="btn bg-success text-white flex items-center gap-2 hover:bg-green-700 shadow-lg px-8">
              <Send size={18} />
              Confirm & Dispatch
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Announce;
