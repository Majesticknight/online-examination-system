import { ClipboardList } from 'lucide-react';

export default function EmptyState({ title = 'Nothing here yet', description = 'Your data will appear here when it is available.' }) {
  return <div className="flex flex-col items-center justify-center px-6 py-14 text-center"><div className="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-500"><ClipboardList size={28} /></div><h3 className="font-semibold text-slate-800">{title}</h3><p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p></div>;
}
