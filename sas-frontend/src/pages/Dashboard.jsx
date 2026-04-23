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
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ label, value, icon: Icon, trend, color }) => (
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
          value="124" 
          icon={Users} 
          color="#243b53" 
        />
        <StatCard 
          label="Announcements (Today)" 
          value="18" 
          icon={MegaphoneIcon} 
          trend="+12%" 
          color="#38a169" 
        />
        <StatCard 
          label="Pending Jobs" 
          value="3" 
          icon={Clock} 
          color="#d69e2e" 
        />
        <StatCard 
          label="System Uptime" 
          value="99.9%" 
          icon={CheckCircle2} 
          color="#3182ce" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Stream Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Current Activity</h2>
            <button className="text-brand-600 text-sm font-bold hover:underline">View All</button>
          </div>
          
          <div className="card bg-brand-900 text-white border-none overflow-hidden relative">
            <div className="absolute right-0 top-0 w-32 h-32 bg-brand-800 rounded-full -mr-16 -mt-16 opacity-50 blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="px-2 py-1 bg-brand-700 rounded text-[10px] font-bold uppercase tracking-wider">Active Stream</div>
                <div className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-bold mb-1">Morning Assembly Notice</h3>
                  <p className="text-brand-300 text-sm flex items-center gap-2">
                    <Clock size={14} />
                    Started 2:45 ago • Priority: Normal (3)
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors">Stop Stream</button>
                  <button className="px-4 py-2 bg-emergency hover:bg-emergency-dark rounded-lg text-sm font-bold transition-colors">Emergency Cut</button>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-3">Broadcasting to</p>
                <div className="flex flex-wrap gap-2">
                  {['Main Building', 'Floor 2', 'Cafeteria', 'Library'].map(target => (
                    <span key={target} className="px-3 py-1 bg-white/5 rounded-full text-xs font-medium border border-white/10">{target}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-800">Upcoming Scheduled</h3>
            {[
              { time: '09:00 AM', title: 'First Bell', type: 'Bell' },
              { time: '11:30 AM', title: 'Lunch Break Announcement', type: 'Prerecorded' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-xl hover:border-brand-200 transition-colors cursor-pointer group">
                <div className="w-12 h-12 flex-shrink-0 bg-slate-50 rounded-lg flex flex-col items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600">
                  <Clock size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">{item.title}</h4>
                  <p className="text-sm text-slate-500">{item.time} • {item.type}</p>
                </div>
                <ArrowRight size={20} className="text-slate-300 group-hover:text-brand-600 transition-transform group-hover:translate-x-1" />
              </div>
            ))}
          </div>
        </div>

        {/* System Health / Sidebar */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">System Status</h2>
          
          <div className="card space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/10">
              <div className="flex items-center gap-3">
                <div className="text-success"><ShieldAlert size={20} /></div>
                <span className="text-sm font-bold text-slate-700">RTP Relay Service</span>
              </div>
              <span className="text-[10px] font-black text-success uppercase">Optimal</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/10">
              <div className="flex items-center gap-3">
                <div className="text-success"><HardDriveIcon size={20} /></div>
                <span className="text-sm font-bold text-slate-700">Storage (82% free)</span>
              </div>
              <span className="text-[10px] font-black text-success uppercase">Healthy</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/10">
              <div className="flex items-center gap-3">
                <div className="text-warning"><Activity size={20} /></div>
                <span className="text-sm font-bold text-slate-700">Network Latency</span>
              </div>
              <span className="text-[10px] font-black text-warning uppercase">12ms</span>
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
            <button className="btn-emergency w-full">Quick Emergency Trigger</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MegaphoneIcon = (props) => <Megaphone size={props.size} />;
import { Megaphone, HardDrive as HardDriveIcon } from 'lucide-react';

export default Dashboard;
