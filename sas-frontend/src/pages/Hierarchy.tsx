import { useState, useEffect } from 'react';
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
  Search,
  Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import { hierarchyService, Building, Floor, Classroom } from '../api/services/hierarchy';

const Hierarchy = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Record<number, Floor[]>>({});
  const [classrooms, setClassrooms] = useState<Record<number, Classroom[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'building' | 'floor' | 'classroom'>('building');
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [parentId, setParentId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    multicastAddress: '',
    ipAddress: '',
    port: 8000
  });

  useEffect(() => {
    loadBuildings();
  }, []);

  const loadBuildings = async () => {
    try {
      const response = await hierarchyService.getBuildings();
      setBuildings(response.data);
    } catch (err) {
      console.error('Failed to load buildings', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshBuilding = async (buildingId: number) => {
    try {
      const response = await hierarchyService.getFloors(buildingId);
      setFloors(prev => ({ ...prev, [buildingId]: response.data }));
    } catch (err) {
      console.error('Failed to refresh floors', err);
    }
  };

  const refreshFloor = async (floorId: number) => {
    try {
      const response = await hierarchyService.getClassrooms(floorId);
      setClassrooms(prev => ({ ...prev, [floorId]: response.data }));
    } catch (err) {
      console.error('Failed to refresh classrooms', err);
    }
  };

  const toggleExpandBuilding = async (buildingId: number) => {
    const id = `b${buildingId}`;
    const isExpanding = !expanded[id];
    setExpanded(prev => ({ ...prev, [id]: isExpanding }));

    if (isExpanding && !floors[buildingId]) {
      refreshBuilding(buildingId);
    }
  };

  const toggleExpandFloor = async (floorId: number) => {
    const id = `f${floorId}`;
    const isExpanding = !expanded[id];
    setExpanded(prev => ({ ...prev, [id]: isExpanding }));

    if (isExpanding && !classrooms[floorId]) {
      refreshFloor(floorId);
    }
  };

  const handleToggleClassroom = async (classroomId: number, floorId: number) => {
    try {
      const response = await hierarchyService.toggleEnabled(classroomId);
      setClassrooms(prev => ({
        ...prev,
        [floorId]: prev[floorId].map(c => c.id === classroomId ? response.data : c)
      }));
    } catch (err) {
      console.error('Failed to toggle classroom', err);
    }
  };

  const openModal = (type: any, mode: 'add' | 'edit', item?: any, pId?: number) => {
    setModalType(type);
    setModalMode(mode);
    setCurrentItem(item);
    setParentId(pId || null);
    setFormData({
      name: item?.name || '',
      multicastAddress: item?.multicastAddress || '',
      ipAddress: item?.ipAddress || '',
      port: item?.port || 8000
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (modalType === 'building') {
        if (modalMode === 'add') {
          await hierarchyService.createBuilding(formData.name);
          loadBuildings();
        } else {
          await hierarchyService.updateBuilding(currentItem.id, formData.name);
          loadBuildings();
        }
      } else if (modalType === 'floor') {
        if (modalMode === 'add') {
          await hierarchyService.createFloor(parentId!, formData.name, formData.multicastAddress);
          refreshBuilding(parentId!);
        } else {
          await hierarchyService.updateFloor(currentItem.id, { name: formData.name, multicastAddress: formData.multicastAddress });
          refreshBuilding(currentItem.buildingId);
        }
      } else if (modalType === 'classroom') {
        if (modalMode === 'add') {
          await hierarchyService.createClassroom(parentId!, formData.name, formData.ipAddress, formData.port);
          refreshFloor(parentId!);
        } else {
          await hierarchyService.updateClassroom(currentItem.id, { name: formData.name, ipAddress: formData.ipAddress, port: formData.port });
          refreshFloor(currentItem.floorId);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save', err);
      alert('Failed to save item. Check console for details.');
    }
  };

  const handleDelete = async (type: string, item: any) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}? All children will be disconnected.`)) return;
    try {
      if (type === 'building') {
        await hierarchyService.deleteBuilding(item.id);
        loadBuildings();
      } else if (type === 'floor') {
        await hierarchyService.deleteFloor(item.id);
        refreshBuilding(item.buildingId);
      } else if (type === 'classroom') {
        await hierarchyService.deleteClassroom(item.id);
        refreshFloor(item.floorId);
      }
    } catch (err) {
      console.error('Delete failed', err);
      alert('Delete failed.');
    }
  };


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
          <button 
            onClick={() => openModal('building', 'add')}
            className="btn-primary flex items-center gap-2 shadow-lg"
          >
            <Plus size={18} />
            Add Building
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Hierarchy Tree */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 card border-dashed">
              <Loader2 className="animate-spin text-brand-500 mb-4" size={32} />
              <p className="text-slate-500 font-medium">Loading school structure...</p>
            </div>
          ) : buildings.map(building => (
            <div key={building.id} className="card p-0 overflow-hidden border-slate-200">
               <div className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                 <div 
                   className="flex items-center gap-4 cursor-pointer flex-1"
                   onClick={() => toggleExpandBuilding(building.id)}
                 >
                    <div className="text-slate-400">
                      {expanded[`b${building.id}`] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                    <div className="bg-brand-50 p-2.5 rounded-xl text-brand-700">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{building.name}</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Building ID: {building.id}</p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => openModal('floor', 'add', null, building.id)}
                      className="p-2 hover:bg-brand-50 text-brand-600 rounded-lg transition-colors"
                      title="Add Floor"
                    >
                      <Plus size={18} />
                    </button>
                    <button 
                      onClick={() => openModal('building', 'edit', building)}
                      className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition-colors"
                    >
                      <Settings size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete('building', building)}
                      className="p-2 hover:bg-emergency/10 text-emergency rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                 </div>
               </div>

               {expanded[`b${building.id}`] && (
                 <div className="bg-slate-50/50 border-t border-slate-100 p-4 space-y-4">
                    {floors[building.id]?.map(floor => (
                      <div key={floor.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                           <div 
                             className="flex items-center gap-3 cursor-pointer flex-1"
                             onClick={() => toggleExpandFloor(floor.id)}
                           >
                              <div className="text-slate-400">
                                {expanded[`f${floor.id}`] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </div>
                              <Layers size={18} className="text-brand-400" />
                              <span className="font-bold text-slate-700">{floor.name}</span>
                              <div className="flex items-center gap-1.5 ml-4 px-2 py-0.5 bg-brand-800/5 text-brand-800 rounded-md border border-brand-800/10">
                                 <Radio size={12} />
                                 <span className="text-[10px] font-black">{floor.multicastAddress}</span>
                              </div>
                           </div>
                           <div className="flex gap-3">
                              <button 
                                onClick={() => openModal('classroom', 'add', null, floor.id)}
                                className="text-xs font-bold text-brand-600 hover:underline"
                              >
                                Add Classroom
                              </button>
                              <button 
                                onClick={() => openModal('floor', 'edit', floor)}
                                className="text-slate-300 hover:text-brand-600"
                              >
                                <Settings size={14} />
                              </button>
                              <button 
                                onClick={() => handleDelete('floor', floor)}
                                className="text-slate-300 hover:text-emergency"
                              >
                                <Trash2 size={14} />
                              </button>
                           </div>
                        </div>
                        
                        {expanded[`f${floor.id}`] && (
                          <div className="p-2 divide-y divide-slate-50">
                             {classrooms[floor.id]?.map(room => (
                               <div key={room.id} className="p-3 flex items-center justify-between group hover:bg-slate-50 transition-colors rounded-lg">
                                  <div className="flex items-center gap-4">
                                     <button 
                                       onClick={() => handleToggleClassroom(room.id, floor.id)}
                                       className={clsx(
                                         "w-3 h-3 rounded-full transition-all border-2",
                                         room.enabled ? "bg-success border-success shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-200 border-slate-300"
                                       )}
                                     ></button>
                                     <Monitor size={16} className="text-slate-300 group-hover:text-brand-400" />
                                     <span className={clsx(
                                       "text-sm font-medium",
                                       room.enabled ? "text-slate-700" : "text-slate-400"
                                     )}>{room.name}</span>
                                     <span className="text-[10px] text-slate-400 font-mono hidden md:block">
                                       {room.ipAddress || 'No IP'}:{room.port}
                                     </span>
                                  </div>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button 
                                       onClick={() => openModal('classroom', 'edit', room)}
                                       className="p-1.5 hover:bg-brand-50 text-brand-600 rounded-md"
                                     >
                                       <Settings size={14} />
                                     </button>
                                     <button 
                                       onClick={() => handleDelete('classroom', room)}
                                       className="p-1.5 hover:bg-emergency/10 text-emergency rounded-md"
                                     >
                                       <Trash2 size={14} />
                                     </button>
                                  </div>
                               </div>
                             ))}
                             {(!classrooms[floor.id] || classrooms[floor.id].length === 0) && (
                               <div className="p-4 text-center text-xs text-slate-400 italic">
                                 No classrooms on this floor.
                               </div>
                             )}
                          </div>
                        )}
                      </div>
                    ))}
                    {(!floors[building.id] || floors[building.id].length === 0) && (
                      <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                         <p className="text-sm text-slate-400 font-medium">No floors registered in this building.</p>
                         <button 
                           onClick={() => openModal('floor', 'add', null, building.id)}
                           className="text-sm font-bold text-brand-700 mt-2"
                         >
                           Add First Floor
                         </button>
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

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 text-lg capitalize">
                {modalMode} {modalType}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Name</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder={`Enter ${modalType} name...`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>

              {modalType === 'floor' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Multicast Address</label>
                  <input 
                    type="text"
                    value={formData.multicastAddress}
                    onChange={e => setFormData({ ...formData, multicastAddress: e.target.value })}
                    placeholder="e.g. 239.0.0.1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                  />
                </div>
              )}

              {modalType === 'classroom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase">IP Address</label>
                    <input 
                      type="text"
                      value={formData.ipAddress}
                      onChange={e => setFormData({ ...formData, ipAddress: e.target.value })}
                      placeholder="Optional"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-brand-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase">Port</label>
                    <input 
                      type="number"
                      value={formData.port || ''}
                      onChange={e => setFormData({ ...formData, port: e.target.value ? parseInt(e.target.value) : 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-brand-500 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
               <button 
                 onClick={() => setIsModalOpen(false)}
                 className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleSave}
                 className="flex-1 px-4 py-2.5 bg-brand-800 text-white rounded-lg text-sm font-bold hover:bg-brand-900 transition-colors shadow-lg shadow-brand-900/20"
               >
                 Save Changes
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hierarchy;
