export default function ChartCard({ title, subtitle, children, action }) {
  return <section className="card min-w-0 p-5"><div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="font-semibold text-slate-900">{title}</h2>{subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}</div>{action}</div>{children}</section>;
}
