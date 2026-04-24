import { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Bell, 
  Settings2, 
  Trash2, 
  CalendarOff,
  ChevronRight,
  ToggleLeft as Toggle,
  ToggleRight as ToggleActive
} from 'lucide-react';
import { clsx } from 'clsx';

type TabType = 'bells' | 'holidays';

interface BellSchedule {
  id: number;
  name: string;
  time: string;
  days: string;
  audio: string;
  active: boolean;
}

const Schedules = () => {
  const [activeTab, setActiveTab] = useState<TabType>('bells');

  const bellSchedules: BellSchedule[] = [
    { id: 1, name: 'Morning Entrance', time: '08:00 AM', days: 'Mon-Fri', audio: 'chime.ogg', active: true },
    { id: 2, name: 'Recess Start', time: '10:30 AM', days: 'Mon-Fri', audio: 'bell_loud.ogg', active: true },
    { id: 3, name: 'Lunch Period', time: '12:00 PM', days: 'Mon-Fri', audio: 'lunch_tone.ogg', active: false },
    { id: 4, name: 'School End', time: '03:30 PM', days: 'Mon-Fri', audio: 'chime.ogg', active: true },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Automated Schedules</h1>
          <p className="text-slate-500 mt-1">Configure bells, drills, and periodic announcements.</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Create Schedule
        </button>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-8">
        <button 
          onClick={() => setActiveTab('bells')}
          className={clsx(
            "px-6 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'bells' ? "bg-white text-brand-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Active Schedules
        </button>
        <button 
          onClick={() => setActiveTab('holidays')}
          className={clsx(
            "px-6 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'holidays' ? "bg-white text-brand-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Holiday Exceptions
        </button>
      </div>

      {activeTab === 'bells' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {bellSchedules.map(bell => (
            <div key={bell.id} className={clsx(
              "card border-l-4 transition-all hover:shadow-lg group",
              bell.active ? "border-success" : "border-slate-300 bg-slate-50"
            )}>
              <div className="flex justify-between items-start mb-6">
                <div className={clsx(
                  "p-3 rounded-xl",
                  bell.active ? "bg-success/10 text-success" : "bg-slate-200 text-slate-400"
                )}>
                  <Bell size={24} />
                </div>
                <button className={clsx(
                  "transition-colors",
                  bell.active ? "text-success" : "text-slate-300"
                )}>
                  {bell.active ? <ToggleActive size={40} /> : <Toggle size={40} />}
                </button>
              </div>
              
              <h3 className={clsx("text-lg font-bold mb-1", !bell.active && "text-slate-500")}>{bell.name}</h3>
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-6">
                <Clock size={14} />
                <span>{bell.time} • {bell.days}</span>
              </div>
              
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Settings2 size={12} />
                  {bell.audio}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="p-2 hover:bg-slate-100 text-slate-500 rounded-lg"><Plus size={16} /></button>
                   <button className="p-2 hover:bg-emergency/10 text-emergency rounded-lg"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
          
          <button className="card border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-600 transition-all group min-h-[220px]">
             <div className="w-12 h-12 rounded-full border-2 border-slate-200 flex items-center justify-center mb-3 group-hover:border-brand-300">
               <Plus size={24} />
             </div>
             <span className="font-bold text-sm">Add New Schedule</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 card p-0 overflow-hidden">
             <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">2024 Exception Dates</h3>
                <div className="flex gap-2">
                   <button className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 shadow-sm hover:bg-slate-50 transition-colors">
                     <ChevronRight className="rotate-180" size={18} />
                   </button>
                   <button className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 shadow-sm hover:bg-slate-50 transition-colors">
                     <ChevronRight size={18} />
                   </button>
                </div>
             </div>
             <div className="p-12 flex flex-col items-center justify-center text-center">
                <CalendarOff size={48} className="text-slate-200 mb-4" />
                <h3 className="font-bold text-slate-900">No exceptions configured</h3>
                <p className="text-sm text-slate-500 mt-1">Bells will fire normally on all scheduled days.</p>
                <button className="btn-primary mt-8">Add Holiday / Exception</button>
             </div>
          </div>
          
          <div className="card space-y-4 h-fit">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
               <Calendar size={18} className="text-brand-600" />
               Upcoming Holidays
            </h3>
            <p className="text-xs text-slate-500">Scheduled bells are automatically suppressed on these dates.</p>
            <div className="space-y-3 pt-4">
               {[
                 { date: 'May 27, 2024', name: 'Memorial Day' },
                 { date: 'Jun 19, 2024', name: 'Juneteenth' }
               ].map((h, i) => (
                 <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                   <div>
                     <p className="text-sm font-bold text-slate-900">{h.name}</p>
                     <p className="text-xs text-slate-500">{h.date}</p>
                   </div>
                   <button className="text-slate-300 hover:text-emergency transition-colors"><Trash2 size={16} /></button>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedules;
