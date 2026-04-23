import { useState } from 'react';
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

const TargetSelector = ({ data, onSelectionChange }) => {
  const [expanded, setExpanded] = useState({});
  const [selected, setSelected] = useState({});

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelect = (id, type) => {
    // Hierarchical selection logic would go here
    // For now, simple toggle
    setSelected(prev => ({
      ...prev,
      [id]: prev[id] === 'all' ? 'none' : 'all'
    }));
  };

  // Mock hierarchy based on SRS
  const mockData = [
    {
      id: 'b1',
      name: 'Main Building',
      type: 'building',
      floors: [
        {
          id: 'f1',
          name: 'Floor 1',
          type: 'floor',
          classrooms: [
            { id: 'c101', name: 'Classroom 101', type: 'classroom' },
            { id: 'c102', name: 'Classroom 102', type: 'classroom' },
          ]
        },
        {
          id: 'f2',
          name: 'Floor 2',
          type: 'floor',
          classrooms: [
            { id: 'c201', name: 'Classroom 201', type: 'classroom' },
          ]
        }
      ]
    },
    {
      id: 'b2',
      name: 'Science Wing',
      type: 'building',
      floors: []
    }
  ];

  const SelectionBox = ({ status, onClick }) => (
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
        <button className="text-xs font-bold text-brand-700 hover:underline">Select Entire School</button>
      </div>
      
      <div className="p-2 max-h-[400px] overflow-y-auto">
        {mockData.map(building => (
          <div key={building.id} className="mb-1">
            <div 
              className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer group"
              onClick={() => toggleExpand(building.id)}
            >
              <div className="text-slate-400 group-hover:text-brand-600">
                {expanded[building.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </div>
              <SelectionBox 
                status={selected[building.id] || 'none'} 
                onClick={() => handleSelect(building.id, 'building')} 
              />
              <Building2 size={18} className="text-brand-400" />
              <span className="font-semibold text-slate-700">{building.name}</span>
            </div>
            
            {expanded[building.id] && (
              <div className="ml-9 border-l border-slate-100 pl-2 mt-1 space-y-1">
                {building.floors.map(floor => (
                  <div key={floor.id}>
                    <div 
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer group"
                      onClick={() => toggleExpand(floor.id)}
                    >
                      <div className="text-slate-400 group-hover:text-brand-600">
                        {expanded[floor.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                      <SelectionBox 
                        status={selected[floor.id] || 'none'} 
                        onClick={() => handleSelect(floor.id, 'floor')} 
                      />
                      <Layers size={16} className="text-brand-300" />
                      <span className="text-sm font-medium text-slate-600">{floor.name}</span>
                    </div>
                    
                    {expanded[floor.id] && (
                      <div className="ml-8 border-l border-slate-100 pl-2 mt-1 space-y-1">
                        {floor.classrooms.map(room => (
                          <div 
                            key={room.id}
                            className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer group"
                            onClick={() => handleSelect(room.id, 'classroom')}
                          >
                            <SelectionBox 
                              status={selected[room.id] || 'none'} 
                              onClick={() => handleSelect(room.id, 'classroom')} 
                            />
                            <Monitor size={14} className="text-slate-300 group-hover:text-brand-400" />
                            <span className="text-sm text-slate-500 group-hover:text-slate-700">{room.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {building.floors.length === 0 && (
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
