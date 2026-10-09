import { useEffect, useState } from 'react';
import { ArrowRight, Award, BookOpen, BarChart3, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import toast from 'react-hot-toast';
import api, { errorMessage } from '../../services/api';
import { useAuth } from '../../services/AuthContext';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import StatCard from '../../components/StatCard';
import ChartCard from '../../components/ChartCard';

const tooltipStyle = { borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 25px rgba(15,23,42,.08)' };

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/student/dashboard').then(({ data: response }) => setData(response)).catch((error) => toast.error(errorMessage(error))).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState label="Loading your results…" />;
  if (!data) return <EmptyState title="Dashboard unavailable" description="Check that the API is running and refresh the page." />;
  const { stats, score_history: history, recent_results: recent } = data;
  const name = user?.name?.split(' ')[0] || 'there';
  return <div className="space-y-7">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-brand-600">STUDENT PORTAL</p><h1 className="page-title mt-1">Welcome back, {name} 👋</h1><p className="page-subtitle">Keep learning, keep improving. Here's your progress at a glance.</p></div><Link to="/student/exams" className="btn-primary w-fit">Browse exams <ArrowRight size={17} /></Link></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Exams attempted" value={stats.exams_attempted} detail={`${stats.completed_exams} submitted`} icon={BookOpen} tint="blue" /><StatCard label="Average score" value={`${stats.average_percentage}%`} detail="Across completed exams" icon={BarChart3} tint="violet" /><StatCard label="Pass rate" value={`${stats.pass_rate}%`} detail="Of submitted exams" icon={Award} tint="green" /><StatCard label="Available exams" value={stats.available_exams} detail="Ready to take" icon={Target} tint="amber" /></div>
    <div className="grid gap-5 xl:grid-cols-2"><ChartCard title="Score progression" subtitle="Your percentage across completed exams"><div className="h-72">{history.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={history} margin={{ top: 8, right: 10, left: -15, bottom: 22 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} /><YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}%`, 'Score']} labelFormatter={(_, payload) => payload?.[0]?.payload?.label || 'Exam'} /><Line type="monotone" dataKey="percentage" name="Score" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer> : <EmptyState title="Your score chart is waiting" description="Complete your first exam to see your performance trend." />}</div></ChartCard>
      <ChartCard title="Marks by exam" subtitle="Marks obtained compared with total marks"><div className="h-72">{history.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={history.slice(-6)} margin={{ top: 8, right: 8, left: -15, bottom: 26 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} /><YAxis tick={{ fontSize: 11, fill: '#64748b' }} /><Tooltip contentStyle={tooltipStyle} /><Legend iconType="circle" formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} /><Bar dataKey="marks_obtained" name="Marks obtained" fill="#2563eb" radius={[5, 5, 0, 0]} /><Bar dataKey="total_marks" name="Total marks" fill="#cbd5e1" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer> : <EmptyState title="No marks to compare yet" description="Marks from your completed exams will appear here." />}</div></ChartCard></div>
    <section className="card overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-semibold text-slate-900">Recent results</h2><p className="mt-1 text-xs text-slate-500">Your latest completed examinations</p></div><Link to="/student/results" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">View all <ArrowRight size={15} /></Link></div>{recent.length ? <div className="overflow-x-auto"><table className="w-full min-w-[540px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Examination</th><th className="px-5 py-3 font-semibold">Score</th><th className="px-5 py-3 font-semibold">Percentage</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3" /></tr></thead><tbody className="divide-y divide-slate-100">{recent.map((result) => <tr key={result.attempt_id} className="hover:bg-slate-50/70"><td className="px-5 py-4 font-medium text-slate-800">{result.exam_title}</td><td className="px-5 py-4 text-slate-600">{result.marks_obtained} / {result.total_marks}</td><td className="px-5 py-4 text-slate-600">{result.percentage}%</td><td className="px-5 py-4"><span className={`badge ${result.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{result.passed ? 'Passed' : 'Not passed'}</span></td><td className="px-5 py-4 text-right"><Link className="text-sm font-semibold text-brand-600" to={`/student/results/${result.attempt_id}`}>Review</Link></td></tr>)}</tbody></table></div> : <EmptyState title="No results yet" description="Take an available examination to see your scores and progress here." />}</section>
  </div>;
}
