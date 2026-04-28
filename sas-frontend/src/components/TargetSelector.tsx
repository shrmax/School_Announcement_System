import { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Check, 
  Minus,
  Building2,
  Layers,
  Monitor
} from 'lucide-react';
import { clsx } from 'clsx';
import { Building, Floor, Classroom } from '../api/services/hierarchy';

export type TargetType = 'school' | 'building' | 'floor' | 'classroom';
export type SelectionStatus = 'all' | 'some' | 'none';

export interface SelectedTarget {
  type: 'classroom' | 'floor' | 'building' | 'school';
  id: number;
}

interface TargetSelectorProps {
  buildings: Building[];
  floors: Record<number, Floor[]>;
  classrooms: Record<number, Classroom[]>;
  onSelectionChange?: (targets: SelectedTarget[]) => void;
  onExpandBuilding: (id: number) => void;
  onExpandFloor: (id: number) => void;
}

const TargetSelector = ({ 
  buildings, 
  floors, 
  classrooms, 
  onSelectionChange,
  onExpandBuilding,
  onExpandFloor 
}: TargetSelectorProps) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<string, SelectionStatus>>({});

  // Notify parent of selection changes
  useEffect(() => {
    const targets: SelectedTarget[] = [];
    
    // Logic to resolve minimal set of targets
    // If a building is 'all', just send the building ID
    buildings.forEach(b => {
      if (selected[`b${b.id}`] === 'all') {
        targets.push({ type: 'building', id: b.id });
      } else if (selected[`b${b.id}`] === 'some') {
        floors[b.id]?.forEach(f => {
          if (selected[`f${f.id}`] === 'all') {
            targets.push({ type: 'floor', id: f.id });
          } else if (selected[`f${f.id}`] === 'some') {
            classrooms[f.id]?.forEach(c => {
              if (selected[`c${c.id}`] === 'all') {
                targets.push({ type: 'classroom', id: c.id });
              }
            });
          }
        });
      }
    });

    onSelectionChange?.(targets);
  }, [selected, buildings, floors, classrooms, onSelectionChange]);

  const toggleExpand = (id: string, realId: number, type: 'building' | 'floor') => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    if (type === 'building') onExpandBuilding(realId);
    else onExpandFloor(realId);
  };

  const handleSelect = (id: string, type: TargetType, realId: number) => {
    const newStatus: SelectionStatus = selected[id] === 'all' ? 'none' : 'all';
    const newSelected = { ...selected, [id]: newStatus };

    // Cascade down
    if (type === 'building') {
      floors[realId]?.forEach(f => {
        newSelected[`f${f.id}`] = newStatus;
        classrooms[f.id]?.forEach(c => {
          newSelected[`c${c.id}`] = newStatus;
        });
      });
    } else if (type === 'floor') {
      classrooms[realId]?.forEach(c => {
        newSelected[`c${c.id}`] = newStatus;
      });
    }

    // Cascade up
    const updateParents = (currentSelected: Record<string, SelectionStatus>) => {
      buildings.forEach(b => {
        const floorList = floors[b.id] || [];
        
        floorList.forEach(f => {
          const roomList = classrooms[f.id] || [];
          if (roomList.length > 0) {
            const someRoomsSelected = roomList.some(r => currentSelected[`c${r.id}`] === 'all');
            const allRoomsSelected = roomList.every(r => currentSelected[`c${r.id}`] === 'all');
            
            // Only set to 'all' if it was already 'all' (manual click) 
            // or if we want to force it. Let's stick to 'some' for automatic
            // to keep the Unicast vs Multicast distinction.
            if (currentSelected[`f${f.id}`] !== 'all') {
              currentSelected[`f${f.id}`] = someRoomsSelected ? 'some' : 'none';
            }
          }
        });

        const someFloorsSelected = floorList.some(f => currentSelected[`f${f.id}`] !== 'none');
        if (currentSelected[`b${b.id}`] !== 'all') {
          currentSelected[`b${b.id}`] = someFloorsSelected ? 'some' : 'none';
        }
      });
    };

    updateParents(newSelected);
    setSelected(newSelected);
  };


  const SelectionBox = ({ status, onClick }: { status: SelectionStatus; onClick: () => void }) => (
    <div 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={clsx(
        "w-5 h-5 rounded border transition-all flex items-center justify-center cursor-pointer",
        status === 'all' ? "bg-brand-800 border-brand-800 text-white" : 
        status === 'some' ? "bg-brand-200 border-brand-800 text-brand-800" :
        "bg-white border-slate-300 hover:border-brand-500"
      )}
    >
      {status === 'all' && <Check size={14} strokeWidth={3} />}
      {status === 'some' && <Minus size={14} strokeWidth={3} />}
    </div>
  );

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-700">Target Selection</span>
        <button 
          onClick={() => {
            const allSelected = buildings.every(b => selected[`b${b.id}`] === 'all');
            const newStatus = allSelected ? 'none' : 'all';
            const newSelected: Record<string, SelectionStatus> = {};
            buildings.forEach(b => {
              newSelected[`b${b.id}`] = newStatus;
              floors[b.id]?.forEach(f => {
                newSelected[`f${f.id}`] = newStatus;
                classrooms[f.id]?.forEach(c => {
                  newSelected[`c${c.id}`] = newStatus;
                });
              });
            });
            setSelected(newSelected);
          }}
          className="text-xs font-bold text-brand-700 hover:underline"
        >
          {buildings.every(b => selected[`b${b.id}`] === 'all') ? 'Deselect All' : 'Select Entire School'}
        </button>
      </div>
      
      <div className="p-2 max-h-[400px] overflow-y-auto">
        {buildings.map(building => (
          <div key={building.id} className="mb-1">
            <div 
              className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer group"
              onClick={() => toggleExpand(`b${building.id}`, building.id, 'building')}
            >
              <div className="text-slate-400 group-hover:text-brand-600">
                {expanded[`b${building.id}`] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </div>
              <SelectionBox 
                status={selected[`b${building.id}`] || 'none'} 
                onClick={() => handleSelect(`b${building.id}`, 'building', building.id)} 
              />
              <Building2 size={18} className="text-brand-400" />
              <span className="font-semibold text-slate-700">{building.name}</span>
            </div>
            
            {expanded[`b${building.id}`] && (
              <div className="ml-9 border-l border-slate-100 pl-2 mt-1 space-y-1">
                {floors[building.id]?.map(floor => (
                  <div key={floor.id}>
                    <div 
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer group"
                      onClick={() => toggleExpand(`f${floor.id}`, floor.id, 'floor')}
                    >
                      <div className="text-slate-400 group-hover:text-brand-600">
                        {expanded[`f${floor.id}`] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                      <SelectionBox 
                        status={selected[`f${floor.id}`] || 'none'} 
                        onClick={() => handleSelect(`f${floor.id}`, 'floor', floor.id)} 
                      />
                      <Layers size={16} className="text-brand-300" />
                      <span className="text-sm font-medium text-slate-600">{floor.name}</span>
                    </div>
                    
                    {expanded[`f${floor.id}`] && (
                      <div className="ml-8 border-l border-slate-100 pl-2 mt-1 space-y-1">
                        {classrooms[floor.id]?.map(room => (
                          <div 
                            key={room.id}
                            className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer group"
                            onClick={() => handleSelect(`c${room.id}`, 'classroom', room.id)}
                          >
                            <SelectionBox 
                              status={selected[`c${room.id}`] || 'none'} 
                              onClick={() => handleSelect(`c${room.id}`, 'classroom', room.id)} 
                            />
                            <Monitor size={14} className="text-slate-300 group-hover:text-brand-400" />
                            <span className="text-sm text-slate-500 group-hover:text-slate-700">{room.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {(!floors[building.id] || floors[building.id].length === 0) && (
                  <div className="p-2 text-xs text-slate-400 italic">No floors registered</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TargetSelector;
