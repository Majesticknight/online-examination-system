import { useState } from 'react';
import { ArrowRight, BookOpenCheck, Eye, EyeOff } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../services/AuthContext';
import { errorMessage } from '../services/api';

export default function Register() {
  const { user, register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!loading && user) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match.'); return; }
    setBusy(true);
    try {
      const newUser = await register({ name: form.name, email: form.email, password: form.password });
      toast.success('Your account is ready.');
      navigate(newUser.role === 'admin' ? '/admin/dashboard' : '/student/dashboard', { replace: true });
    } catch (error) { toast.error(errorMessage(error, 'Unable to create account.')); }
    finally { setBusy(false); }
  };

  return <div className="grid min-h-screen bg-white lg:grid-cols-2"><div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-700 via-blue-700 to-sky-600 p-12 text-white lg:flex lg:flex-col lg:justify-between"><Link to="/login" className="flex items-center gap-3"><div className="rounded-xl bg-white/15 p-2.5"><BookOpenCheck size={25} /></div><span className="text-xl font-extrabold">Examly</span></Link><div className="max-w-xl"><h1 className="text-5xl font-bold leading-tight tracking-tight">Your next step<br />starts here.</h1><p className="mt-6 max-w-md text-lg leading-8 text-blue-100">Create a student account to explore assessments and keep all your results in one place.</p></div><p className="text-xs text-blue-100/80">Online Examination System · College mini project</p></div>
    <div className="flex items-center justify-center px-5 py-12 sm:px-10"><div className="w-full max-w-md"><div className="mb-10 flex items-center gap-3 lg:hidden"><div className="rounded-xl bg-brand-600 p-2 text-white"><BookOpenCheck size={23} /></div><span className="text-xl font-extrabold">Examly</span></div><p className="text-sm font-semibold text-brand-600">GET STARTED</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Create your account</h2><p className="mt-2 text-sm leading-6 text-slate-500">Registration is open for student accounts.</p>
      <form onSubmit={submit} className="mt-8 space-y-4"><div><label className="field-label" htmlFor="name">Full name</label><input id="name" name="name" autoComplete="name" required maxLength={120} className="field-input" placeholder="Your full name" value={form.name} onChange={change} /></div><div><label className="field-label" htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" required className="field-input" placeholder="you@example.com" value={form.email} onChange={change} /></div><div><label className="field-label" htmlFor="password">Password</label><div className="relative"><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} required className="field-input pr-12" placeholder="At least 8 characters" value={form.password} onChange={change} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Toggle password visibility">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div><div><label className="field-label" htmlFor="confirmPassword">Confirm password</label><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required className="field-input" placeholder="Enter password again" value={form.confirmPassword} onChange={change} /></div><button className="btn-primary mt-2 w-full py-3" disabled={busy}>{busy ? 'Creating account…' : 'Create account'} {!busy && <ArrowRight size={17} />}</button></form>
      <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link className="font-semibold text-brand-600 hover:text-brand-700" to="/login">Sign in</Link></p>
    </div></div></div>;
}
