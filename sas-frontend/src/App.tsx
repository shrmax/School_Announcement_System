import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Mic2, 
  Megaphone, 
  Library as LibraryIcon, 
  Calendar, 
  Network, 
  HardDrive, 
  History, 
  Activity,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import React from 'react';

// Page Imports
import Dashboard from './pages/Dashboard';
import Announce from './pages/Announce';
import LiveBroadcast from './pages/LiveBroadcast';
import Library from './pages/Library';
import Schedules from './pages/Schedules';
import Hierarchy from './pages/Hierarchy';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Remaining Placeholder Pages
const Endpoints = () => <div className="p-8"><h1 className="text-3xl font-bold">RTP Endpoints</h1></div>;
const JobMonitor = () => <div className="p-8"><h1 className="text-3xl font-bold">Job Monitor</h1></div>;
const Logs = () => <div className="p-8"><h1 className="text-3xl font-bold">Logs</h1></div>;

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
}

const NavItem = ({ to, icon: Icon, label }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
        isActive 
          ? "bg-brand-800 text-white shadow-lg translate-x-1" 
          : "text-slate-500 hover:bg-brand-50 hover:text-brand-800"
      )}
    >
      <Icon size={20} className={cn("transition-transform group-hover:scale-110", isActive ? "text-white" : "text-brand-400")} />
      <span className="font-medium">{label}</span>
      {isActive && <ChevronRight size={16} className="ml-auto opacity-70" />}
    </Link>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="bg-brand-800 p-2 rounded-lg text-white">
            <Megaphone size={24} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 leading-tight">SAS Admin</h2>
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">School System</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/announce" icon={Megaphone} label="Announce" />
          <NavItem to="/live" icon={Mic2} label="Go Live" />
          <NavItem to="/library" icon={LibraryIcon} label="Library" />
          <NavItem to="/schedules" icon={Calendar} label="Schedules" />
          
          <div className="pt-4 pb-2 px-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Management</span>
          </div>
          
          <NavItem to="/hierarchy" icon={Network} label="Hierarchy" />
          <NavItem to="/jobs" icon={Activity} label="Job Monitor" />
          <NavItem to="/logs" icon={History} label="Logs" />
        </nav>
        
        <div className="p-4 border-t border-slate-100">
          <button className="btn-emergency w-full flex items-center justify-center gap-2">
            <AlertTriangle size={18} />
            Emergency
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Global Header / Banner */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-success/10 text-success text-xs font-bold rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              SYSTEM ONLINE
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="text-sm font-medium text-slate-500">
               {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/announce" element={<Announce />} />
          <Route path="/live" element={<LiveBroadcast />} />
          <Route path="/library" element={<Library />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/hierarchy" element={<Hierarchy />} />
          <Route path="/jobs" element={<JobMonitor />} />
          <Route path="/logs" element={<Logs />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
