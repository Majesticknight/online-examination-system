export default function LoadingState({ label = 'Loading…' }) {
  return <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-slate-500"><span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />{label}</div>;
}
