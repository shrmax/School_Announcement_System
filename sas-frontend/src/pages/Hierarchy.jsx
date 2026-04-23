import { useState } from 'react';
import { 
  Building2, 
  Layers, 
  Monitor, 
  Plus, 
  Settings, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  Globe,
  Radio,
  Search
} from 'lucide-react';
import { clsx } from 'clsx';

const Hierarchy = () => {
  const [expanded, setExpanded] = useState({ 'b1': true });

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const hierarchy = [
    {
      id: 'b1',
      name: 'Main Building',
      floors: [
        {
          id: 'f1',
          name: 'Floor 1',
          multicast: '239.1.1.1:5004',
          classrooms: [
            { id: 'c101', name: 'Classroom 101', endpoint: '192.168.1.101:5004', active: true },
            { id: 'c102', name: 'Classroom 102', endpoint: '192.168.1.102:5004', active: true },
            { id: 'c103', name: 'Classroom 103', endpoint: '192.168.1.103:5004', active: false },
          ]
        },
        {
          id: 'f2',
          name: 'Floor 2',
          multicast: '239.1.1.2:5004',
          classrooms: [
            { id: 'c201', name: 'Chemistry Lab', endpoint: '192.168.1.201:5004', active: true },
          ]
        }
      ]
    },
    {
      id: 'b2',
      name: 'Science Wing',
      floors: []
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">School Hierarchy</h1>
          <p className="text-slate-500 mt-1">Organize your school structure and assign multicast groups.</p>
        </div>
        <div className="flex gap-4">
           <div className="card p-0 flex items-center bg-white shadow-sm border-slate-200">
             <div className="pl-4 text-slate-400"><Search size={18} /></div>
             <input type="text" placeholder="Search classrooms..." className="px-4 py-2 bg-transparent outline-none text-sm w-64" />
          </div>
          <button className="btn-primary flex items-center gap-2 shadow-lg">
            <Plus size={18} />
            Add Building
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Hierarchy Tree */}
        <div className="lg:col-span-2 space-y-4">
          {hierarchy.map(building => (
            <div key={building.id} className="card p-0 overflow-hidden border-slate-200">
               <div 
                 className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                 onClick={() => toggleExpand(building.id)}
               >
                 <div className="flex items-center gap-4">
                    <div className="text-slate-400">
                      {expanded[building.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                    <div className="bg-brand-50 p-2.5 rounded-xl text-brand-700">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{building.name}</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{building.floors.length} Floors</p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button className="p-2 hover:bg-brand-50 text-brand-600 rounded-lg transition-colors"><Plus size={18} /></button>
                    <button className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition-colors"><Settings size={18} /></button>
                 </div>
               </div>

               {expanded[building.id] && (
                 <div className="bg-slate-50/50 border-t border-slate-100 p-4 space-y-4">
                    {building.floors.map(floor => (
                      <div key={floor.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                           <div className="flex items-center gap-3">
                              <Layers size={18} className="text-brand-400" />
                              <span className="font-bold text-slate-700">{floor.name}</span>
                              <div className="flex items-center gap-1.5 ml-4 px-2 py-0.5 bg-brand-800/5 text-brand-800 rounded-md border border-brand-800/10">
                                 <Radio size={12} />
                                 <span className="text-[10px] font-black">{floor.multicast}</span>
                              </div>
                           </div>
                           <div className="flex gap-2">
                              <button className="text-xs font-bold text-brand-600 hover:underline">Add Classroom</button>
                              <button className="text-slate-300 hover:text-slate-500"><Settings size={14} /></button>
                           </div>
                        </div>
                        <div className="p-2 divide-y divide-slate-50">
                           {floor.classrooms.map(room => (
                             <div key={room.id} className="p-3 flex items-center justify-between group hover:bg-slate-50 transition-colors rounded-lg">
                                <div className="flex items-center gap-4">
                                   <div className={clsx(
                                     "w-2 h-2 rounded-full",
                                     room.active ? "bg-success" : "bg-slate-300"
                                   )}></div>
                                   <Monitor size={16} className="text-slate-300 group-hover:text-brand-400" />
                                   <span className="text-sm font-medium text-slate-600">{room.name}</span>
                                   <span className="text-[10px] text-slate-400 font-mono hidden md:block">{room.endpoint}</span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button className="p-1.5 hover:bg-brand-50 text-brand-600 rounded-md"><Settings size={14} /></button>
                                   <button className="p-1.5 hover:bg-emergency/10 text-emergency rounded-md"><Trash2 size={14} /></button>
                                </div>
                             </div>
                           ))}
                        </div>
                      </div>
                    ))}
                    {building.floors.length === 0 && (
                      <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                         <p className="text-sm text-slate-400 font-medium">No floors registered in this building.</p>
                         <button className="text-sm font-bold text-brand-700 mt-2">Add First Floor</button>
                      </div>
                    )}
                 </div>
               )}
            </div>
          ))}
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
           <div className="card bg-brand-900 text-white border-none">
              <div className="flex items-center gap-3 mb-4">
                 <Globe className="text-brand-400" size={24} />
                 <h3 className="font-bold">Multicast Groups</h3>
              </div>
              <p className="text-sm text-brand-200 mb-6 leading-relaxed">
                 The entire school is reachable via the root group 239.0.0.1. Ensure your network switches have IGMP snooping enabled.
              </p>
              <div className="space-y-2">
                 <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-xs font-medium text-brand-300 uppercase">School Wide</span>
                    <span className="text-xs font-black font-mono">239.0.0.1</span>
                 </div>
                 <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-xs font-medium text-brand-300 uppercase">Emergency</span>
                    <span className="text-xs font-black font-mono">239.9.9.9</span>
                 </div>
              </div>
           </div>

           <div className="card space-y-4">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-widest">Network Health</h3>
              <div className="space-y-3 pt-2">
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Online Endpoints</span>
                    <span className="text-sm font-bold text-success">118 / 124</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Packet Loss</span>
                    <span className="text-sm font-bold text-slate-900">0.02%</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">IGMP Status</span>
                    <span className="text-sm font-bold text-success">Active</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Hierarchy;
