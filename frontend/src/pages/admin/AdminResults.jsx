import { useEffect, useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errorMessage } from '../../services/api';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';

export default function AdminResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  useEffect(() => {
    api.get('/admin/results').then(({ data }) => setResults(data.results)).catch((error) => toast.error(errorMessage(error))).finally(() => setLoading(false));
  }, []);
  const filtered = useMemo(() => results.filter((result) => `${result.student_name} ${result.student_email} ${result.exam_title}`.toLowerCase().includes(search.toLowerCase())), [results, search]);
  const exportCsv = () => {
    const columns = ['Student', 'Email', 'Exam', 'Marks obtained', 'Total marks', 'Percentage', 'Status', 'Submitted at'];
    const rows = filtered.map((r) => [r.student_name, r.student_email, r.exam_title, r.marks_obtained, r.total_marks, r.percentage, r.passed ? 'Passed' : 'Not passed', r.submitted_at]);
    const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [columns, ...rows].map((row) => row.map(quote).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'exam-results.csv'; anchor.click(); URL.revokeObjectURL(url);
  };
  return <div className="space-y-7"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-brand-600">REPORTING</p><h1 className="page-title mt-1">Results & reports</h1><p className="page-subtitle">Review exam performance across all student submissions.</p></div><button className="btn-secondary w-fit" onClick={exportCsv} disabled={!filtered.length}><Download size={17} /> Export CSV</button></div>
    <section className="card overflow-hidden"><div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:px-5"><div><h2 className="font-semibold text-slate-900">All submitted results</h2><p className="mt-1 text-xs text-slate-500">{filtered.length} result{filtered.length === 1 ? '' : 's'}</p></div><div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input className="field-input pl-9" placeholder="Search student or exam…" value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>{loading ? <LoadingState /> : filtered.length ? <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Student</th><th className="px-5 py-3 font-semibold">Examination</th><th className="px-5 py-3 font-semibold">Marks</th><th className="px-5 py-3 font-semibold">Percentage</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Submitted</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((result) => <tr key={result.attempt_id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><p className="font-semibold text-slate-800">{result.student_name}</p><p className="mt-0.5 text-xs text-slate-500">{result.student_email}</p></td><td className="px-5 py-4 font-medium text-slate-700">{result.exam_title}</td><td className="px-5 py-4 text-slate-600">{result.marks_obtained} / {result.total_marks}</td><td className="px-5 py-4"><div className="flex items-center gap-2"><div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.min(100, result.percentage)}%` }} /></div><span className="text-slate-600">{result.percentage}%</span></div></td><td className="px-5 py-4"><span className={`badge ${result.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{result.passed ? 'Passed' : 'Not passed'}</span></td><td className="px-5 py-4 text-xs text-slate-500">{result.submitted_at ? new Date(result.submitted_at).toLocaleString() : '—'}</td></tr>)}</tbody></table></div> : <EmptyState title={search ? 'No matching results' : 'No results yet'} description={search ? 'Try another student name, email or exam title.' : 'Completed examinations will appear here.'} />}</section>
  </div>;
}
