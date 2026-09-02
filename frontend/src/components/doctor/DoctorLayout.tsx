import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  FolderOpen,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Bell,
  HeartPulse,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../store/useAuth';

interface DoctorLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Patients', icon: Users, active: false },
  { label: 'Appointments', icon: Calendar, active: false },
  { label: 'Case Records', icon: ClipboardList, active: false },
  { label: 'Documents', icon: FolderOpen, active: false },
  { label: 'Analytics', icon: BarChart3, active: false },
  { label: 'Settings', icon: Settings, active: false },
];

export default function DoctorLayout({ title, subtitle, children }: DoctorLayoutProps) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const displayName = user?.displayName ?? 'Dr. Arnav Roy';
  const specialty = user?.specialty ?? 'General Physician';
  const initials = displayName
    .replace(/^Dr\.\s*/i, '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  const handleLogout = () => {
    logout();
    navigate('/doctor/login');
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="lg:hidden fixed top-0 inset-x-0 z-50 h-16 bg-navy-900 flex items-center justify-between px-4 shadow-lg">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-white bg-white/10 hover:bg-white/20 rounded-lg p-2"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <button onClick={() => navigate('/doctor/dashboard')} className="flex items-center gap-2">
          <div className="bg-emerald-500 p-1.5 rounded-lg">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">MediCase AI</span>
        </button>
        <button className="text-white/70 relative p-2" aria-label="Notifications">
          <Bell className="w-6 h-6" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
        </button>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-navy-900 text-white flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/30">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-lg tracking-tight">MediCase AI</p>
              <p className="text-[11px] text-slate-400 uppercase tracking-widest">Clinical Suite</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-300 hover:text-white p-1"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          <p className="px-3 pb-2 text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
            Menu
          </p>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate('/doctor/dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                item.active
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
              {item.active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-1 shrink-0">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{displayName}</p>
              <p className="text-xs text-slate-400 truncate">{specialty}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-rose-500/15 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="h-16 sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200 flex items-center justify-between px-4 sm:px-8">
          <div className="hidden lg:block">
            <h2 className="text-lg font-bold text-slate-800 leading-tight">{title}</h2>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 flex-1 lg:flex-none justify-end">
            <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 w-72 border border-transparent focus-within:border-emerald-400">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                className="bg-transparent outline-none text-sm text-slate-700 w-full placeholder:text-slate-400"
                placeholder="Search cases, patients..."
              />
            </div>
            <button className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Notifications">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white" />
            </button>
            <button
              onClick={() => navigate('/doctor/dashboard')}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-bold flex items-center justify-center shadow-sm"
              aria-label="Doctor profile"
            >
              {initials}
            </button>
          </div>
        </header>

        <main className="px-4 sm:px-8 py-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
