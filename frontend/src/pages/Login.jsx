import { useState } from 'react';
import { ArrowRight, BookOpenCheck, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../services/AuthContext';
import { errorMessage } from '../services/api';

export default function Login() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const loggedIn = await login(form);
      toast.success(`Welcome back, ${loggedIn.name.split(' ')[0]}!`);
      const fallback = loggedIn.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
      navigate(location.state?.from?.pathname || fallback, { replace: true });
    } catch (error) { toast.error(errorMessage(error, 'Unable to log in.')); }
    finally { setBusy(false); }
  };

  return <div className="grid min-h-screen bg-white lg:grid-cols-2">
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-12 text-white lg:flex lg:flex-col lg:justify-between"><div className="absolute -right-24 -top-24 h-96 w-96 rounded-full border-[60px] border-white/10" /><div className="absolute -bottom-40 -left-20 h-[500px] w-[500px] rounded-full border-[80px] border-white/10" /><Link to="/login" className="relative flex items-center gap-3"><div className="rounded-xl bg-white/15 p-2.5"><BookOpenCheck size={25} /></div><span className="text-xl font-extrabold tracking-tight">Examly</span></Link><div className="relative max-w-xl"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold"><ShieldCheck size={15} /> A simpler way to assess learning</div><h1 className="text-5xl font-bold leading-tight tracking-tight">Every exam.<br />One clear picture.</h1><p className="mt-6 max-w-md text-lg leading-8 text-blue-100">A focused place to take assessments, review results, and understand progress.</p><div className="mt-10 grid max-w-md grid-cols-3 gap-3">{[['01', 'Take exams'], ['02', 'Get results'], ['03', 'Track progress']].map(([num, label]) => <div key={num} className="rounded-2xl border border-white/15 bg-white/10 p-4"><p className="text-sm font-bold text-blue-100">{num}</p><p className="mt-2 text-sm font-semibold">{label}</p></div>)}</div></div><p className="relative text-xs text-blue-100/80">Online Examination System · College mini project</p></div>
    <div className="flex items-center justify-center px-5 py-12 sm:px-10"><div className="w-full max-w-md"><div className="mb-10 flex items-center gap-3 lg:hidden"><div className="rounded-xl bg-brand-600 p-2 text-white"><BookOpenCheck size={23} /></div><span className="text-xl font-extrabold">Examly</span></div><p className="text-sm font-semibold text-brand-600">WELCOME BACK</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Sign in to your account</h2><p className="mt-2 text-sm leading-6 text-slate-500">Enter your details to continue to your workspace.</p>
      <form onSubmit={submit} className="mt-8 space-y-5"><div><label className="field-label" htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" required className="field-input" placeholder="you@example.com" value={form.email} onChange={change} /></div><div><label className="field-label" htmlFor="password">Password</label><div className="relative"><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required className="field-input pr-12" placeholder="Enter your password" value={form.password} onChange={change} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div><button className="btn-primary w-full py-3" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} {!busy && <ArrowRight size={17} />}</button></form>
      <p className="mt-6 text-center text-sm text-slate-500">New to Examly? <Link className="font-semibold text-brand-600 hover:text-brand-700" to="/register">Create a student account</Link></p><div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs leading-5 text-slate-500">Admin access is created by the project administrator. Students can create an account using the registration page.</p></div>
    </div></div>
  </div>;
}
