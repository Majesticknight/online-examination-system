import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BookOpenCheck, BarChart3, ClipboardCheck, ClipboardList, FileClock, LayoutDashboard, LogOut, Menu, Users, X } from 'lucide-react';
import { useAuth } from '../services/AuthContext';

const studentLinks = [
  { to: '/student/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/student/exams', label: 'Available exams', icon: ClipboardList },
  { to: '/student/results', label: 'My results', icon: BarChart3 },
];
const adminLinks = [
  { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/exams', label: 'Manage exams', icon: ClipboardCheck },
  { to: '/admin/results', label: 'Results & reports', icon: FileClock },
  { to: '/admin/students', label: 'Students', icon: Users },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = user?.role === 'admin' ? adminLinks : studentLinks;
  const home = user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
        <div className="rounded-xl bg-brand-600 p-2 text-white"><BookOpenCheck size={23} /></div>
        <div><p className="text-lg font-extrabold tracking-tight text-slate-900">Examly</p><p className="text-[11px] font-medium uppercase tracking-[.18em] text-slate-400">Examination portal</p></div>
        <button className="ml-auto text-slate-500 md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={20} /></button>
      </div>
      <div className="px-4 pt-6"><p className="px-3 pb-3 text-[11px] font-bold uppercase tracking-[.15em] text-slate-400">Workspace</p><nav className="space-y-1">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><Icon size={19} strokeWidth={1.9} /><span>{label}</span></NavLink>)}</nav></div>
      <div className="mt-auto p-4"><div className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">{user?.name?.slice(0, 1).toUpperCase() || 'U'}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{user?.name}</p><p className="text-xs capitalize text-slate-500">{user?.role}</p></div></div><button onClick={handleLogout} className="mt-4 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-500 hover:bg-white hover:text-red-600"><LogOut size={16} />Sign out</button></div></div>
    </div>
  );

  return <div className="min-h-screen bg-slate-50 md:flex">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 md:block">{sidebar}</aside>
    {mobileOpen && <div className="fixed inset-0 z-40 md:hidden"><button className="absolute inset-0 bg-slate-950/40" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" /><aside className="absolute inset-y-0 left-0 w-72 shadow-xl">{sidebar}</aside></div>}
    <div className="min-w-0 flex-1 md:pl-64"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur sm:px-7"><div className="flex items-center gap-3"><button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={21} /></button><div><p className="text-xs font-medium text-slate-400">Workspace / <span className="text-slate-600">{user?.role === 'admin' ? 'Administration' : 'Student portal'}</span></p></div></div><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold text-slate-800">{user?.name}</p><p className="text-xs capitalize text-slate-500">{user?.role}</p></div><button onClick={() => navigate(home)} className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 font-bold text-brand-700" title="Go to dashboard">{user?.name?.slice(0, 1).toUpperCase() || 'U'}</button></div></header><main className="mx-auto w-full max-w-[1500px] p-4 sm:p-7"><Outlet /></main><footer className="px-6 pb-6 text-center text-xs text-slate-400">Examly · Online Examination System mini project</footer></div>
  </div>;
}
