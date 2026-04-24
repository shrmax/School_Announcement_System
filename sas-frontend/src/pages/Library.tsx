import { useState, useEffect, useRef } from 'react';
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
  AlertCircle,
  Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import { libraryService, AudioFile } from '../api/services/library';

const Library = () => {
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  // Poll for status updates only if there are transcoding files
  useEffect(() => {
    const hasTranscoding = files.some(f => f.durationSec === null);
    if (!hasTranscoding) return;

    const interval = setInterval(loadFiles, 3000);
    return () => clearInterval(interval);
  }, [files]);

  const loadFiles = async () => {
    try {
      const response = await libraryService.getFiles();
      setFiles(response.data);
    } catch (err) {
      console.error('Failed to load files', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await libraryService.uploadFile(file);
      await loadFiles();
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this audio file?')) return;
    try {
      await libraryService.deleteFile(id);
      setFiles(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '--';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDuration = (sec: number | null) => {
    if (!sec) return '--';
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const getStatus = (file: AudioFile): 'ready' | 'transcoding' | 'failed' => {
    if (file.status === 'ready') return 'ready';
    if (file.status === 'failed') return 'failed';
    return 'transcoding';
  };

  const getStatusIcon = (status: 'ready' | 'transcoding' | 'failed') => {
    switch(status) {
      case 'ready': return <CheckCircle2 size={16} className="text-success" />;
      case 'transcoding': return <RefreshCw size={16} className="text-brand-500 animate-spin" />;
      case 'failed': return <AlertCircle size={16} className="text-emergency" />;
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
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="audio/*"
          />
          <button 
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
            onClick={handleUploadClick}
            disabled={uploading}
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            {uploading ? 'Uploading...' : 'Upload New'}
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
                <div className="w-[5%] h-full bg-brand-600"></div>
              </div>
              <div className="flex justify-between text-xs font-medium text-brand-700">
                <span>Calculated dynamically</span>
                <span>500 MB limit</span>
              </div>
            </div>
          </div>
          
          <div className="card space-y-4">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-widest">Library Stats</h3>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-sm text-slate-500 font-medium">Total Files</span>
              <span className="font-bold text-slate-900">{files.length}</span>
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
                {loading ? (
                   <tr>
                     <td colSpan={6} className="px-6 py-12 text-center">
                        <Loader2 className="animate-spin text-brand-500 mx-auto mb-2" size={24} />
                        <p className="text-sm text-slate-500 font-medium">Loading library...</p>
                     </td>
                   </tr>
                ) : files.map(file => {
                  const status = getStatus(file);
                  return (
                    <tr key={file.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={clsx(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            status === 'ready' ? "bg-brand-50 text-brand-600" : "bg-slate-100 text-slate-400"
                          )}>
                            <FileAudio size={20} />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{file.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{file.filename}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatDuration(file.durationSec)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status)}
                          <span className={clsx(
                            "text-xs font-bold capitalize",
                            status === 'ready' ? "text-success" : 
                            status === 'transcoding' ? "text-brand-500" : "text-emergency"
                          )}>{status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatSize(file.sizeBytes)}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {status === 'ready' && (
                            <button className="p-2 hover:bg-brand-100 text-brand-600 rounded-lg transition-colors" title="Preview">
                              <Play size={18} fill="currentColor" />
                            </button>
                          )}
                          <button 
                            className="p-2 hover:bg-emergency/10 text-emergency rounded-lg transition-colors" 
                            title="Delete"
                            onClick={() => handleDelete(file.id)}
                          >
                            <Trash2 size={18} />
                          </button>
                          <button className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition-colors">
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Empty State */}
            {!loading && files.length === 0 && (
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
