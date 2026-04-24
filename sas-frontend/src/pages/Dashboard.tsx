import { 
  Play, 
  Mic, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Users,
  ShieldAlert,
  Activity,
  Megaphone,
  HardDrive as HardDriveIcon,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { statsService, SystemStats } from '../api/services/stats';
import { announcementService } from '../api/services/announcements';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color: string;
}

const StatCard = ({ label, value, icon: Icon, trend, color }: StatCardProps) => (
  <div className="card hover:shadow-lg transition-shadow border-t-4" style={{ borderColor: color }}>
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 rounded-lg bg-slate-50 text-slate-600">
        <Icon size={24} />
      </div>
      {trend && (
        <span className="text-xs font-bold text-success flex items-center gap-1">
          <TrendingUp size={12} />
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-3xl font-bold text-slate-900 mb-1">{value}</h3>
    <p className="text-sm font-medium text-slate-500">{label}</p>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmergencyTriggering, setIsEmergencyTriggering] = useState(false);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await statsService.getSystemStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickEmergency = async () => {
    if (!window.confirm('CRITICAL: Are you sure you want to trigger a school-wide emergency broadcast?')) return;
    
    setIsEmergencyTriggering(true);
    try {
      // Find a suitable emergency audio file or just use the first one for now
      // In a real system, there would be a dedicated emergency_audio_id
      await announcementService.create({
        title: 'EMERGENCY BROADCAST',
        type: 'emergency',
        priority: 5,
        audioFileId: 1, // Defaulting to 1 for prototype
        targets: [{ type: 'school' }]
      });
      alert('Emergency broadcast initiated!');
      loadStats();
    } catch (err) {
      console.error('Emergency trigger failed', err);
      alert('Emergency trigger failed. Please check system logs.');
    } finally {
      setIsEmergencyTriggering(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Dashboard</h1>
          <p className="text-slate-500 mt-1">Monitor and manage school-wide announcements.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/announce" className="btn-primary flex items-center gap-2">
            <Play size={18} fill="currentColor" />
            New Announcement
          </Link>
          <Link to="/live" className="btn-secondary flex items-center gap-2">
            <Mic size={18} />
            Go Live
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Endpoints" 
          value={stats?.classrooms.total || 0} 
          icon={Users} 
          color="#243b53" 
        />
        <StatCard 
          label="Announcements (Recent)" 
          value={stats?.recentAnnouncements.length || 0} 
          icon={MegaphoneIcon} 
          trend={stats?.recentAnnouncements.length ? "+100%" : undefined} 
          color="#38a169" 
        />
        <StatCard 
          label="Audio Clips" 
          value={stats?.audioFiles || 0} 
          icon={HardDriveIcon} 
          color="#d69e2e" 
        />
        <StatCard 
          label="Online Rate" 
          value={stats ? `${Math.round((stats.classrooms.online / stats.classrooms.total) * 100)}%` : '--'} 
          icon={CheckCircle2} 
          color="#3182ce" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Stream Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
            <Link to="/announce" className="text-brand-600 text-sm font-bold hover:underline">Create New</Link>
          </div>
          
          <div className="space-y-4">
            {stats?.recentAnnouncements.map((ann, i) => (
              <div key={ann.id} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-xl hover:border-brand-200 transition-colors cursor-pointer group">
                <div className={clsx(
                  "w-12 h-12 flex-shrink-0 rounded-lg flex flex-col items-center justify-center",
                  ann.type === 'emergency' ? "bg-emergency/10 text-emergency" : "bg-brand-50 text-brand-600"
                )}>
                  {ann.type === 'emergency' ? <AlertCircle size={20} /> : <MegaphoneIcon size={20} />}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">{ann.title}</h4>
                  <p className="text-sm text-slate-500">
                    {new Date(ann.createdAt).toLocaleTimeString()} • {ann.type.toUpperCase()} • Status: {ann.status}
                  </p>
                </div>
                <div className={clsx(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                  ann.status === 'completed' ? "bg-success/10 text-success" : "bg-brand-100 text-brand-700"
                )}>
                  {ann.status}
                </div>
              </div>
            ))}
            {(!stats || stats.recentAnnouncements.length === 0) && (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                 <p className="text-slate-400 font-medium">No recent activity found.</p>
              </div>
            )}
          </div>
        </div>

        {/* System Health / Sidebar */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">System Status</h2>
          
          <div className="card space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/10">
              <div className="flex items-center gap-3">
                <div className="text-success"><ShieldAlert size={20} /></div>
                <span className="text-sm font-bold text-slate-700">Database Connection</span>
              </div>
              <span className="text-[10px] font-black text-success uppercase">Optimal</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/10">
              <div className="flex items-center gap-3">
                <div className="text-success"><HardDriveIcon size={20} /></div>
                <span className="text-sm font-bold text-slate-700">Queue Worker</span>
              </div>
              <span className="text-[10px] font-black text-success uppercase">Active</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/10">
              <div className="flex items-center gap-3">
                <div className="text-success"><Activity size={20} /></div>
                <span className="text-sm font-bold text-slate-700">Network Latency</span>
              </div>
              <span className="text-[10px] font-black text-success uppercase">Healthy</span>
            </div>
          </div>

          <div className="card bg-emergency/5 border-emergency/20 border-dashed">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-emergency" size={24} />
              <h3 className="font-bold text-emergency-dark">Emergency Protocol</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Triggering the emergency protocol will bypass all queues and broadcast to the entire school immediately.
            </p>
            <button 
              className="btn-emergency w-full flex items-center justify-center gap-2 disabled:opacity-50"
              onClick={handleQuickEmergency}
              disabled={isEmergencyTriggering}
            >
              {isEmergencyTriggering ? <Loader2 size={18} className="animate-spin" /> : <AlertCircle size={18} />}
              {isEmergencyTriggering ? 'Triggering...' : 'Quick Emergency Trigger'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MegaphoneIcon = ({ size }: { size?: number }) => <Megaphone size={size} />;

export default Dashboard;
