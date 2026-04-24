import { useState, useEffect } from 'react';
import { 
  FileAudio, 
  AlertTriangle, 
  Bell,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Send,
  Loader2
} from 'lucide-react';
import TargetSelector, { SelectedTarget } from '../components/TargetSelector';
import { clsx } from 'clsx';
import { hierarchyService, Building, Floor, Classroom } from '../api/services/hierarchy';
import { libraryService, AudioFile } from '../api/services/library';
import { announcementService } from '../api/services/announcements';

type AnnouncementType = 'prerecorded' | 'emergency' | 'bell';

const Announce = () => {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<AnnouncementType | null>(null);
  
  // Data State
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Record<number, Floor[]>>({});
  const [classrooms, setClassrooms] = useState<Record<number, Classroom[]>>({});
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  
  // Selection State
  const [selectedAudio, setSelectedAudio] = useState<AudioFile | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<SelectedTarget[]>([]);
  const [title, setTitle] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [bRes, lRes] = await Promise.all([
        hierarchyService.getBuildings(),
        libraryService.getFiles()
      ]);
      setBuildings(bRes.data);
      setAudioFiles(lRes.data.filter(f => f.durationSec !== null)); // Only ready files
    } catch (err) {
      console.error('Failed to load initial data', err);
    }
  };

  const handleExpandBuilding = async (id: number) => {
    if (floors[id]) return;
    try {
      const res = await hierarchyService.getFloors(id);
      setFloors(prev => ({ ...prev, [id]: res.data }));
    } catch (err) {
      console.error('Failed to load floors', err);
    }
  };

  const handleExpandFloor = async (id: number) => {
    if (classrooms[id]) return;
    try {
      const res = await hierarchyService.getClassrooms(id);
      setClassrooms(prev => ({ ...prev, [id]: res.data }));
    } catch (err) {
      console.error('Failed to load classrooms', err);
    }
  };

  const handleDispatch = async () => {
    if (!type || !selectedAudio || selectedTargets.length === 0) return;
    
    setIsDispatching(true);
    try {
      await announcementService.create({
        title: title || `${type.toUpperCase()} Announcement`,
        type: type,
        priority: type === 'emergency' ? 5 : type === 'bell' ? 4 : 3,
        audioFileId: selectedAudio.id,
        targets: selectedTargets
      });
      alert('Announcement dispatched successfully!');
      setStep(1);
      setType(null);
      setSelectedAudio(null);
      setSelectedTargets([]);
    } catch (err) {
      console.error('Dispatch failed', err);
      alert('Failed to dispatch announcement.');
    } finally {
      setIsDispatching(false);
    }
  };


  const steps = [
    { id: 1, label: 'Type' },
    { id: 2, label: 'Source' },
    { id: 3, label: 'Targets' },
    { id: 4, label: 'Finalize' }
  ];

  const types = [
    { id: 'prerecorded', icon: FileAudio, label: 'Prerecorded', color: 'bg-brand-600', desc: 'Select an audio file from the library' },
    { id: 'emergency', icon: AlertTriangle, label: 'Emergency', color: 'bg-emergency', desc: 'Highest priority, interrupts all active streams' },
    { id: 'bell', icon: Bell, label: 'School Bell', color: 'bg-warning', desc: 'Schedule or trigger a school bell' }
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
        {steps.map((s) => (
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
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                 {audioFiles.map(file => (
                    <div 
                      key={file.id}
                      onClick={() => setSelectedAudio(file)}
                      className={clsx(
                        "p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all",
                        selectedAudio?.id === file.id ? "border-brand-500 bg-brand-50" : "border-slate-100 hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-brand-600">
                           <FileAudio size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{file.name}</p>
                          <p className="text-xs text-slate-500">{file.durationSec}s • {file.filename}</p>
                        </div>
                      </div>
                      {selectedAudio?.id === file.id && <CheckCircle2 className="text-brand-600" size={20} />}
                    </div>
                 ))}
                 {audioFiles.length === 0 && (
                   <div className="p-8 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                      <p className="text-sm text-slate-400">No ready audio files found in library.</p>
                      <button className="text-sm font-bold text-brand-700 mt-2">Go to Library</button>
                   </div>
                 )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Select Targets</h2>
              <TargetSelector 
                buildings={buildings}
                floors={floors}
                classrooms={classrooms}
                onExpandBuilding={handleExpandBuilding}
                onExpandFloor={handleExpandFloor}
                onSelectionChange={setSelectedTargets}
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Final Review</h2>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                   <p className="text-xs font-bold text-slate-400 uppercase mb-2">Announcement Title</p>
                   <input 
                     type="text" 
                     value={title} 
                     onChange={(e) => setTitle(e.target.value)}
                     placeholder="Enter a title for this broadcast..."
                     className="w-full bg-white border border-slate-200 rounded-md p-2 text-sm outline-none focus:border-brand-500"
                   />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Type</p>
                    <p className="font-bold text-brand-800 uppercase">{type}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Audio Source</p>
                    <p className="font-bold text-slate-700 truncate">{selectedAudio?.name}</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Targets</p>
                  <p className="font-medium text-slate-700 text-sm">
                    {selectedTargets.length} locations selected
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between">
          <button 
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1 || isDispatching}
            className="btn-secondary flex items-center gap-2"
          >
            <ChevronLeft size={18} />
            Back
          </button>
          
          {step < 4 ? (
            <button 
              onClick={() => setStep(s => Math.min(4, s + 1))}
              disabled={
                (step === 1 && !type) || 
                (step === 2 && !selectedAudio) || 
                (step === 3 && selectedTargets.length === 0)
              }
              className="btn-primary flex items-center gap-2"
            >
              Next Step
              <ChevronRight size={18} />
            </button>
          ) : (
            <button 
              onClick={handleDispatch}
              disabled={isDispatching}
              className="btn bg-success text-white flex items-center gap-2 hover:bg-green-700 shadow-lg px-8 disabled:opacity-50"
            >
              {isDispatching ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {isDispatching ? 'Dispatching...' : 'Confirm & Dispatch'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Announce;
