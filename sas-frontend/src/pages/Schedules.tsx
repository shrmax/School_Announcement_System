import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Bell, 
  Trash2, 
  X,
  Volume2,
  Check,
  ChevronDown,
  Repeat
} from 'lucide-react';
import { clsx } from 'clsx';
import { scheduleService, Schedule } from '../api/services/schedules';
import { libraryService, AudioFile } from '../api/services/library';
import { hierarchyService, Building, Floor, Classroom } from '../api/services/hierarchy';
import TargetSelector, { SelectedTarget } from '../components/TargetSelector';

const DAYS = [
  { label: 'Sun', value: '0' },
  { label: 'Mon', value: '1' },
  { label: 'Tue', value: '2' },
  { label: 'Wed', value: '3' },
  { label: 'Thu', value: '4' },
  { label: 'Fri', value: '5' },
  { label: 'Sat', value: '6' },
];

const Schedules = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [library, setLibrary] = useState<AudioFile[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Hierarchy Data
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Record<number, Floor[]>>({});
  const [classrooms, setClassrooms] = useState<Record<number, Classroom[]>>({});

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    audioFileId: 0,
    startTime: '08:00',
    endTime: '',
    intervalMinutes: '',
    daysOfWeek: ['1', '2', '3', '4', '5'], // Default Mon-Fri
  });
  const [selectedTargets, setSelectedTargets] = useState<SelectedTarget[]>([]);

  useEffect(() => {
    loadData();
    loadHierarchy();
  }, []);

  const loadData = async () => {
    try {
      const [sRes, lRes] = await Promise.all([
        scheduleService.getSchedules(),
        libraryService.getFiles()
      ]);
      setSchedules(sRes.data);
      setLibrary(lRes.data);
    } catch (err) {
      console.error('Failed to load data', err);
    }
  };

  const loadHierarchy = async () => {
    try {
      const res = await hierarchyService.getBuildings();
      setBuildings(res.data);
    } catch (err) {
      console.error('Failed to load buildings', err);
    }
  };

  const handleExpandBuilding = async (id: number) => {
    if (floors[id]) return;
    const res = await hierarchyService.getFloors(id);
    setFloors(prev => ({ ...prev, [id]: res.data }));
  };

  const handleExpandFloor = async (id: number) => {
    if (classrooms[id]) return;
    const res = await hierarchyService.getClassrooms(id);
    setClassrooms(prev => ({ ...prev, [id]: res.data }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.audioFileId || selectedTargets.length === 0) {
      alert('Please select audio and at least one target.');
      return;
    }

    setIsLoading(true);
    try {
      await scheduleService.createSchedule({
        name: formData.name,
        audioFileId: formData.audioFileId,
        daysOfWeek: formData.daysOfWeek.join(','),
        startTime: formData.startTime + ':00',
        endTime: formData.endTime ? formData.endTime + ':00' : null,
        intervalMinutes: formData.intervalMinutes ? parseInt(formData.intervalMinutes) : null,
        targets: selectedTargets.map(t => ({ type: t.type, id: t.id }))
      });
      setShowModal(false);
      loadData();
      // Reset form
      setFormData({
        name: '',
        audioFileId: 0,
        startTime: '08:00',
        endTime: '',
        intervalMinutes: '',
        daysOfWeek: ['1', '2', '3', '4', '5'],
      });
      setSelectedTargets([]);
    } catch (err) {
      console.error('Failed to create schedule', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      await scheduleService.deleteSchedule(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete schedule', err);
    }
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Automated Schedules</h1>
          <p className="text-slate-500 mt-1">Configure bells, drills, and periodic announcements.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Create Schedule
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schedules.map(schedule => (
          <div key={schedule.id} className="card border-l-4 border-brand-500 group relative">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                <Bell size={20} />
              </div>
              <button 
                onClick={() => handleDelete(schedule.id)}
                className="p-2 text-slate-300 hover:text-emergency transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <h3 className="font-bold text-slate-900 text-lg">{schedule.name}</h3>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Clock size={14} className="text-slate-400" />
                <span className="font-medium text-slate-700">{schedule.startTime.substring(0, 5)}</span>
                {schedule.intervalMinutes && (
                  <>
                    <Repeat size={14} className="text-slate-400 ml-2" />
                    <span>Every {schedule.intervalMinutes}m</span>
                  </>
                )}
              </div>
              
              <div className="flex gap-1">
                {DAYS.map(d => (
                  <div 
                    key={d.value}
                    className={clsx(
                      "w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold border",
                      schedule.daysOfWeek.split(',').includes(d.value)
                        ? "bg-brand-500 text-white border-brand-600"
                        : "bg-slate-50 text-slate-400 border-slate-100"
                    )}
                  >
                    {d.label[0]}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Volume2 size={12} />
                  {library.find(a => a.id === schedule.audioFileId)?.name || 'Unknown Audio'}
               </div>
               <div className={clsx(
                 "px-2 py-1 rounded-full text-[10px] font-black uppercase",
                 schedule.enabled ? "bg-success/10 text-success" : "bg-slate-100 text-slate-400"
               )}>
                 {schedule.enabled ? 'Enabled' : 'Disabled'}
               </div>
            </div>
          </div>
        ))}
        
        {schedules.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
             <Calendar size={48} className="mb-4 opacity-20" />
             <p className="font-bold">No schedules configured yet.</p>
             <button 
               onClick={() => setShowModal(true)}
               className="text-brand-600 text-sm font-bold mt-2 hover:underline"
             >
               Create your first automated bell
             </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">New Automated Schedule</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="overflow-y-auto flex-1">
              <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Schedule Name</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g., Morning Bell, Lunch Start"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                      value={formData.name}
                      onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>

                  {/* Days Selection */}
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Active Days</label>
                    <div className="flex gap-2">
                      {DAYS.map(day => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={clsx(
                            "flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all",
                            formData.daysOfWeek.includes(day.value)
                              ? "bg-brand-600 border-brand-700 text-white shadow-lg shadow-brand-600/20"
                              : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                          )}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timing */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Start Time</label>
                      <input 
                        type="time"
                        required
                        className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-bold text-slate-700 text-lg"
                        value={formData.startTime}
                        onChange={e => setFormData(p => ({ ...p, startTime: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">End Time</label>
                      <input 
                        type="time"
                        className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-bold text-slate-700 text-lg"
                        value={formData.endTime}
                        onChange={e => setFormData(p => ({ ...p, endTime: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Interval (Min)</label>
                      <div className="relative group">
                        <input 
                          type="number"
                          placeholder="None"
                          className="w-full pl-4 pr-12 py-3.5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-bold text-slate-700 text-lg placeholder:text-slate-300"
                          value={formData.intervalMinutes}
                          onChange={e => setFormData(p => ({ ...p, intervalMinutes: e.target.value }))}
                        />
                        <Repeat size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-500 transition-colors" />
                      </div>
                    </div>
                  </div>

                  {/* Audio Selection */}
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Audio Tone</label>
                    <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-100 custom-scrollbar">
                      {library.length > 0 ? library.map(audio => (
                        <button
                          key={audio.id}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, audioFileId: audio.id }))}
                          className={clsx(
                            "flex items-center justify-between p-3 rounded-xl transition-all",
                            formData.audioFileId === audio.id
                              ? "bg-white shadow-md border-l-4 border-brand-500"
                              : "hover:bg-white/50 text-slate-600"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Volume2 size={16} className={formData.audioFileId === audio.id ? "text-brand-500" : "text-slate-400"} />
                            <span className="text-sm font-bold">{audio.name}</span>
                          </div>
                          {formData.audioFileId === audio.id && <Check size={16} className="text-brand-500" />}
                        </button>
                      )) : (
                        <div className="p-4 text-center text-slate-400 text-sm">No audio files found</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Target Selection */}
                <div className="space-y-4 flex flex-col">
                  <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Target Destinations</label>
                  <div className="flex-1 bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-4 bg-white/50 border-b border-slate-100 flex justify-between items-center">
                       <span className="text-xs font-bold text-slate-400 uppercase">Zone Selection</span>
                       <span className="text-[10px] bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full font-bold">
                         {selectedTargets.length} selected
                       </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                      {buildings.length > 0 ? (
                        <TargetSelector 
                          buildings={buildings}
                          floors={floors}
                          classrooms={classrooms}
                          onExpandBuilding={handleExpandBuilding}
                          onExpandFloor={handleExpandFloor}
                          onSelectionChange={setSelectedTargets}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white/50 rounded-2xl border border-dashed border-slate-200">
                           <X size={24} className="text-slate-300 mb-2" />
                           <p className="text-xs font-bold text-slate-500">No Hierarchy Configured</p>
                           <p className="text-[10px] text-slate-400 mt-1">Please add buildings and classrooms in the Hierarchy page first.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-8 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="px-12 py-3 rounded-xl bg-brand-800 text-white font-bold hover:bg-brand-900 shadow-lg shadow-brand-800/20 transition-all flex items-center gap-2"
                >
                  {isLoading ? 'Creating...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedules;
