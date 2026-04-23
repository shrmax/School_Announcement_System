import { useState } from 'react';
import { 
  Upload, 
  Search, 
  MoreVertical, 
  Play, 
  Trash2, 
  FileAudio, 
  Clock, 
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';

const Library = () => {
  const [isUploading, setIsUploading] = useState(false);
  
  const files = [
    { id: 1, name: 'Morning Bell', duration: '0:04', size: '12KB', status: 'ready', date: '2024-04-20' },
    { id: 2, name: 'Emergency Drill Instruction', duration: '1:45', size: '420KB', status: 'ready', date: '2024-04-18' },
    { id: 3, name: 'Lunch Transition', duration: '0:12', size: '24KB', status: 'transcoding', date: '2024-04-23' },
    { id: 4, name: 'Holiday Announcement', duration: '0:30', size: '80KB', status: 'ready', date: '2024-04-15' },
    { id: 5, name: 'Test Audio Large', duration: '--', size: '1.2MB', status: 'failed', date: '2024-04-22' }
  ];

  const getStatusIcon = (status) => {
    switch(status) {
      case 'ready': return <CheckCircle2 size={16} className="text-success" />;
      case 'transcoding': return <RefreshCw size={16} className="text-brand-500 animate-spin" />;
      case 'failed': return <AlertCircle size={16} className="text-emergency" />;
      default: return null;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Audio Library</h1>
          <p className="text-slate-500 mt-1">Manage and preview prerecorded announcement clips.</p>
        </div>
        <div className="flex gap-4">
          <div className="card p-0 flex items-center bg-white shadow-sm border-slate-200">
             <div className="pl-4 text-slate-400"><Search size={18} /></div>
             <input 
               type="text" 
               placeholder="Search library..." 
               className="px-4 py-2 bg-transparent outline-none text-sm w-64"
             />
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Upload size={18} />
            Upload New
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Stats / Storage info */}
        <div className="space-y-6">
          <div className="card bg-brand-50 border-brand-100">
            <div className="flex items-center gap-3 mb-4">
              <HardDrive className="text-brand-600" size={24} />
              <h3 className="font-bold text-brand-900">Storage Usage</h3>
            </div>
            <div className="space-y-2">
              <div className="w-full h-2 bg-brand-200 rounded-full overflow-hidden">
                <div className="w-[15%] h-full bg-brand-600"></div>
              </div>
              <div className="flex justify-between text-xs font-medium text-brand-700">
                <span>12.4 MB used</span>
                <span>500 MB limit</span>
              </div>
            </div>
          </div>
          
          <div className="card space-y-4">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-widest">Library Stats</h3>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-sm text-slate-500 font-medium">Total Files</span>
              <span className="font-bold text-slate-900">42</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-sm text-slate-500 font-medium">Ready</span>
              <span className="font-bold text-success">38</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-500 font-medium">Failed</span>
              <span className="font-bold text-emergency">1</span>
            </div>
          </div>
        </div>

        {/* File List */}
        <div className="lg:col-span-3">
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">File Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Duration</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Size</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Added</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {files.map(file => (
                  <tr key={file.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          file.status === 'ready' ? "bg-brand-50 text-brand-600" : "bg-slate-100 text-slate-400"
                        )}>
                          <FileAudio size={20} />
                        </div>
                        <span className="font-bold text-slate-900">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{file.duration}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(file.status)}
                        <span className={clsx(
                          "text-xs font-bold capitalize",
                          file.status === 'ready' ? "text-success" : 
                          file.status === 'transcoding' ? "text-brand-500" : "text-emergency"
                        )}>{file.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{file.size}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{file.date}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-brand-100 text-brand-600 rounded-lg transition-colors" title="Preview">
                          <Play size={18} fill="currentColor" />
                        </button>
                        <button className="p-2 hover:bg-emergency/10 text-emergency rounded-lg transition-colors" title="Delete">
                          <Trash2 size={18} />
                        </button>
                        <button className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition-colors">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Empty State Mockup */}
            {files.length === 0 && (
              <div className="p-20 flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                   <FileAudio size={32} />
                 </div>
                 <h3 className="font-bold text-slate-900">No audio files found</h3>
                 <p className="text-sm text-slate-500 mt-1">Upload your first audio clip to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Library;
