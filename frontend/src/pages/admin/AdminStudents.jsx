import { useEffect, useState } from 'react';
import { GraduationCap, Search, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errorMessage } from '../../services/api';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import StatCard from '../../components/StatCard';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  useEffect(() => { api.get('/admin/students').then(({ data }) => setStudents(data.students)).catch((error) => toast.error(errorMessage(error))).finally(() => setLoading(false)); }, []);
  const filtered = students.filter((student) => `${student.name} ${student.email}`.toLowerCase().includes(search.toLowerCase()));
  const active = students.filter((student) => student.attempt_count > 0).length;
  const averages = students.filter((student) => student.attempt_count > 0);
  const average = averages.length ? (averages.reduce((sum, student) => sum + Number(student.average_percentage), 0) / averages.length).toFixed(1) : '0.0';
  return <div className="space-y-7"><div><p className="text-sm font-semibold text-brand-600">USER MANAGEMENT</p><h1 className="page-title mt-1">Students</h1><p className="page-subtitle">Browse registered students and their examination activity.</p></div><div className="grid gap-4 sm:grid-cols-3"><StatCard label="Registered students" value={students.length} icon={Users} tint="blue" /><StatCard label="Started an exam" value={active} icon={GraduationCap} tint="green" /><StatCard label="Average student score" value={`${average}%`} icon={GraduationCap} tint="violet" /></div>
    <section className="card overflow-hidden"><div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:px-5"><div><h2 className="font-semibold text-slate-900">Student directory</h2><p className="mt-1 text-xs text-slate-500">{filtered.length} student{filtered.length === 1 ? '' : 's'}</p></div><div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input className="field-input pl-9" placeholder="Search students…" value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>{loading ? <LoadingState /> : filtered.length ? <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Student</th><th className="px-5 py-3 font-semibold">Registered</th><th className="px-5 py-3 font-semibold">Attempts</th><th className="px-5 py-3 font-semibold">Average score</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((student) => <tr key={student.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 font-bold text-brand-700">{student.name.slice(0, 1).toUpperCase()}</div><div><p className="font-semibold text-slate-800">{student.name}</p><p className="mt-0.5 text-xs text-slate-500">{student.email}</p></div></div></td><td className="px-5 py-4 text-slate-500">{new Date(student.created_at).toLocaleDateString()}</td><td className="px-5 py-4 text-slate-600">{student.attempt_count}</td><td className="px-5 py-4 font-semibold text-slate-700">{student.average_percentage}%</td></tr>)}</tbody></table></div> : <EmptyState title="No students found" description="Students who register will appear here." />}</section>
  </div>;
}
