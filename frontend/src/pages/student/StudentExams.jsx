import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Clock3, FileCheck2, Search, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errorMessage } from '../../services/api';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';

export default function StudentExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  useEffect(() => { api.get('/student/exams').then(({ data }) => setExams(data.exams)).catch((error) => toast.error(errorMessage(error))).finally(() => setLoading(false)); }, []);
  const filtered = useMemo(() => exams.filter((exam) => `${exam.title} ${exam.description}`.toLowerCase().includes(search.toLowerCase())), [exams, search]);
  const start = async (exam) => {
    if (exam.attempt_status === 'in_progress') { navigate(`/student/attempts/${exam.attempt_id}`); return; }
    if (exam.attempt_id) { navigate(`/student/results/${exam.attempt_id}`); return; }
    if (!window.confirm(`Start “${exam.title}”? The ${exam.duration_minutes}-minute timer begins immediately, and this exam allows one attempt.`)) return;
    try { const { data } = await api.post(`/student/exams/${exam.id}/start`); toast.success('Your exam has started. Good luck!'); navigate(`/student/attempts/${data.attempt.id}`); }
    catch (error) { toast.error(errorMessage(error)); if (error.response?.data?.attempt_id) navigate(`/student/attempts/${error.response.data.attempt_id}`); }
  };
  return <div className="space-y-7"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-brand-600">EXAM LIBRARY</p><h1 className="page-title mt-1">Available examinations</h1><p className="page-subtitle">Review the details and start when you're ready.</p></div><div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input className="field-input pl-9" placeholder="Search examinations…" value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
    {!loading && <div className="flex flex-wrap gap-2 text-xs text-slate-500"><span className="rounded-lg bg-white px-3 py-2 shadow-sm">{exams.length} published exam{exams.length === 1 ? '' : 's'}</span><span className="rounded-lg bg-white px-3 py-2 shadow-sm">One attempt per exam</span><span className="rounded-lg bg-white px-3 py-2 shadow-sm">Automatic result calculation</span></div>}
    {loading ? <LoadingState label="Loading examinations…" /> : filtered.length ? <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">{filtered.map((exam, index) => {
      const inProgress = exam.attempt_status === 'in_progress';
      const completed = Boolean(exam.attempt_id && exam.attempt_status !== 'in_progress');
      return <article key={exam.id} className="card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg"><div className={`h-1.5 ${index % 3 === 0 ? 'bg-brand-500' : index % 3 === 1 ? 'bg-violet-500' : 'bg-teal-500'}`} /><div className="flex flex-1 flex-col p-5"><div className="flex items-start justify-between gap-3"><div className="rounded-xl bg-slate-100 p-3 text-slate-600"><BookOpen size={22} /></div>{inProgress ? <span className="badge bg-amber-50 text-amber-700">In progress</span> : completed ? <span className="badge bg-emerald-50 text-emerald-700">Completed</span> : <span className="badge bg-blue-50 text-blue-700"><Sparkles size={12} className="mr-1" /> Available</span>}</div><h2 className="mt-4 text-lg font-bold text-slate-900">{exam.title}</h2><p className="mt-2 line-clamp-3 min-h-[60px] text-sm leading-6 text-slate-500">{exam.description || 'No description provided for this examination.'}</p><div className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3"><div><p className="text-xs text-slate-400">Questions</p><p className="mt-1 font-semibold text-slate-800">{exam.question_count}</p></div><div><p className="text-xs text-slate-400">Duration</p><p className="mt-1 flex items-center gap-1 font-semibold text-slate-800"><Clock3 size={14} />{exam.duration_minutes}m</p></div><div><p className="text-xs text-slate-400">Total marks</p><p className="mt-1 font-semibold text-slate-800">{exam.total_marks}</p></div></div>{completed && exam.result && <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5"><div><p className="text-xs text-slate-500">Your score</p><p className="text-sm font-bold text-slate-800">{exam.result.marks_obtained} / {exam.result.total_marks} · {exam.result.percentage}%</p></div><span className={`badge ${exam.result.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{exam.result.passed ? 'Passed' : 'Not passed'}</span></div>}<button onClick={() => start(exam)} className="btn-primary mt-5 w-full">{inProgress ? 'Continue exam' : completed ? <><FileCheck2 size={16} /> Review result</> : <>Start examination <ArrowRight size={16} /></>}</button></div></article>;
    })}</div> : <div className="card"><EmptyState title={search ? 'No matching examinations' : 'No exams available right now'} description={search ? 'Try a different search term.' : 'Published examinations will appear here when the administrator makes them available.'} /></div>}
  </div>;
}
