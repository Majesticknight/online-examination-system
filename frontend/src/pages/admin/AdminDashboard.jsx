import { useEffect, useState } from 'react';
import { BookOpen, ClipboardCheck, GraduationCap, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import toast from 'react-hot-toast';
import api, { errorMessage } from '../../services/api';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import StatCard from '../../components/StatCard';
import ChartCard from '../../components/ChartCard';

const COLORS = ['#2563eb', '#f59e0b'];
const tooltipStyle = { borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 25px rgba(15,23,42,.08)' };

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/admin/dashboard').then(({ data: response }) => setData(response)).catch((error) => toast.error(errorMessage(error))).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState label="Loading analytics…" />;
  if (!data) return <EmptyState title="Dashboard unavailable" description="Check that the Flask API is running, then refresh the page." />;
  const { stats, pass_fail: passFail, exam_performance: examPerformance, participation } = data;

  return <div className="space-y-7">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-brand-600">ADMINISTRATION</p><h1 className="page-title mt-1">Dashboard overview</h1><p className="page-subtitle">A quick view of exams, participation, and student performance.</p></div><span className="badge w-fit bg-emerald-50 text-emerald-700">Live database analytics</span></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Registered students" value={stats.total_students} detail="Student accounts" icon={GraduationCap} tint="blue" />
      <StatCard label="Total examinations" value={stats.total_exams} detail="Published and drafts" icon={BookOpen} tint="violet" />
      <StatCard label="Exam attempts" value={stats.total_attempts} detail={`${stats.completed_attempts} submitted`} icon={ClipboardCheck} tint="green" />
      <StatCard label="Average score" value={`${stats.average_percentage}%`} detail="Across submitted attempts" icon={TrendingUp} tint="amber" />
    </div>
    <div className="grid gap-5 xl:grid-cols-5">
      <div className="xl:col-span-3"><ChartCard title="Average score by exam" subtitle="Average percentage for completed attempts"><div className="h-72">{examPerformance.some((item) => item.attempts > 0) ? <ResponsiveContainer width="100%" height="100%"><BarChart data={examPerformance} margin={{ top: 8, right: 8, left: -15, bottom: 28 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="exam" tick={{ fontSize: 11, fill: '#64748b' }} angle={-15} textAnchor="end" interval={0} height={52} /><YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}%`, 'Average score']} /><Bar dataKey="average_percentage" name="Average score" fill="#3b82f6" radius={[7, 7, 0, 0]} maxBarSize={48} /></BarChart></ResponsiveContainer> : <EmptyState title="No submitted exams yet" description="Scores will appear after students complete an examination." />}</div></ChartCard></div>
      <div className="xl:col-span-2"><ChartCard title="Pass and fail distribution" subtitle="Based on submitted results"><div className="h-72">{passFail.some((item) => item.value > 0) ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={passFail} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={62} outerRadius={90} paddingAngle={4} stroke="none">{passFail.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /><Legend verticalAlign="bottom" iconType="circle" formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} /></PieChart></ResponsiveContainer> : <EmptyState title="No result data" description="The chart will populate when exams are submitted." />}</div></ChartCard></div>
    </div>
    <ChartCard title="Exam participation" subtitle="Number of exam attempts started during the last seven days"><div className="h-72">{participation.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={participation} margin={{ top: 8, right: 10, left: -15, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} /><Tooltip contentStyle={tooltipStyle} /><Line type="monotone" dataKey="attempts" name="Attempts started" stroke="#0d9488" strokeWidth={3} dot={{ r: 4, fill: '#0d9488', strokeWidth: 0 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer> : <EmptyState title="No participation data" />}</div></ChartCard>
  </div>;
}
