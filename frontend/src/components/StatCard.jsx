export default function StatCard({ label, value, detail, icon: Icon, tint = 'blue' }) {
  const tints = {
    blue: 'bg-blue-50 text-blue-600', violet: 'bg-violet-50 text-violet-600',
    green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600',
  };
  return <div className="card p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>{detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}</div>{Icon && <div className={`rounded-xl p-3 ${tints[tint] || tints.blue}`}><Icon size={21} /></div>}</div></div>;
}
