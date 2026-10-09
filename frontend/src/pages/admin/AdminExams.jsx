import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Check, CirclePlus, ClipboardList, Pencil, Power, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errorMessage } from '../../services/api';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';

const blankForm = { title: '', description: '', duration_minutes: 30, passing_marks: 5, is_published: false };

export default function AdminExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/admin/exams'); setExams(data.exams); }
    catch (error) { toast.error(errorMessage(error)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const updateField = (event) => setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  const clearForm = () => { setForm(blankForm); setEditingId(null); };
  const editExam = (exam) => {
    setEditingId(exam.id);
    setForm({ title: exam.title, description: exam.description || '', duration_minutes: exam.duration_minutes, passing_marks: exam.passing_marks, is_published: exam.is_published });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = { ...form, duration_minutes: Number(form.duration_minutes), passing_marks: Number(form.passing_marks) };
    try {
      if (editingId) { await api.put(`/admin/exams/${editingId}`, payload); toast.success('Exam details updated.'); }
      else { await api.post('/admin/exams', payload); toast.success('Exam created. Now add its questions.'); }
      clearForm(); await load();
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setSaving(false); }
  };
  const togglePublish = async (exam) => {
    try {
      await api.put(`/admin/exams/${exam.id}`, { title: exam.title, description: exam.description, duration_minutes: exam.duration_minutes, passing_marks: exam.passing_marks, is_published: !exam.is_published });
      toast.success(exam.is_published ? 'Exam unpublished.' : 'Exam published.'); await load();
    } catch (error) { toast.error(errorMessage(error)); }
  };
  const remove = async (exam) => {
    if (!window.confirm(`Delete “${exam.title}”? Its questions, attempts and results will also be deleted.`)) return;
    try { await api.delete(`/admin/exams/${exam.id}`); toast.success('Exam deleted.'); await load(); if (editingId === exam.id) clearForm(); }
    catch (error) { toast.error(errorMessage(error)); }
  };

  return <div className="space-y-7"><div><p className="text-sm font-semibold text-brand-600">EXAM SETUP</p><h1 className="page-title mt-1">Manage examinations</h1><p className="page-subtitle">Create exams, manage multiple-choice questions, and control publication.</p></div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)]"><section className="card h-fit p-5 sm:p-6"><div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-brand-50 p-2.5 text-brand-600"><CirclePlus size={21} /></div><div><h2 className="font-semibold text-slate-900">{editingId ? 'Edit examination' : 'Create an examination'}</h2><p className="text-xs text-slate-500">{editingId ? `Editing exam #${editingId}` : 'New exams start as drafts.'}</p></div></div>
      <form onSubmit={submit} className="space-y-4"><div><label className="field-label" htmlFor="title">Exam title</label><input className="field-input" id="title" name="title" required maxLength={180} placeholder="e.g. Python Fundamentals" value={form.title} onChange={updateField} /></div><div><label className="field-label" htmlFor="description">Description</label><textarea className="field-input min-h-24 resize-y" id="description" name="description" maxLength={2000} placeholder="Briefly describe the examination" value={form.description} onChange={updateField} /></div><div className="grid grid-cols-2 gap-3"><div><label className="field-label" htmlFor="duration_minutes">Duration (minutes)</label><input className="field-input" id="duration_minutes" name="duration_minutes" type="number" min="1" max="360" required value={form.duration_minutes} onChange={updateField} /></div><div><label className="field-label" htmlFor="passing_marks">Passing marks</label><input className="field-input" id="passing_marks" name="passing_marks" type="number" min="0" step="0.5" required value={form.passing_marks} onChange={updateField} /></div></div><div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">Add questions after creating the exam. The pass mark should not exceed the total marks in the question bank.</div><div className="flex gap-2"><button className="btn-primary flex-1" disabled={saving}>{saving ? 'Saving…' : editingId ? <><Check size={16} /> Save changes</> : <><CirclePlus size={16} /> Create exam</>}</button>{editingId && <button type="button" className="btn-secondary" onClick={clearForm}>Cancel</button>}</div></form>
    </section>
    <section className="card min-w-0 overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-semibold text-slate-900">All examinations</h2><p className="mt-1 text-xs text-slate-500">{exams.length} exam{exams.length === 1 ? '' : 's'} in the system</p></div><span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600"><BookOpen size={14} className="mr-1 inline" /> {exams.filter((e) => e.is_published).length} published</span></div>{loading ? <LoadingState /> : exams.length ? <div className="divide-y divide-slate-100">{exams.map((exam) => <div key={exam.id} className="p-5 transition hover:bg-slate-50/60"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-start"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-900">{exam.title}</h3><span className={`badge ${exam.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{exam.is_published ? 'Published' : 'Draft'}</span></div><p className="mt-1 line-clamp-2 text-sm text-slate-500">{exam.description || 'No description provided.'}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>{exam.question_count} questions</span><span>{exam.total_marks} total marks</span><span>{exam.duration_minutes} min</span><span>Pass: {exam.passing_marks}</span></div></div><div className="flex flex-wrap items-center gap-2"><Link to={`/admin/exams/${exam.id}/questions`} className="btn-secondary !px-3 !py-2"><ClipboardList size={15} /> Questions</Link><button onClick={() => editExam(exam)} className="btn-secondary !px-3 !py-2" aria-label={`Edit ${exam.title}`}><Pencil size={15} /></button><button onClick={() => togglePublish(exam)} className={`btn-secondary !px-3 !py-2 ${exam.is_published ? '!text-amber-700' : '!text-emerald-700'}`} title={exam.is_published ? 'Unpublish exam' : 'Publish exam'}><Power size={15} /></button><button onClick={() => remove(exam)} className="btn-danger !px-3 !py-2" aria-label={`Delete ${exam.title}`}><Trash2 size={15} /></button></div></div></div>)}</div> : <EmptyState title="No examinations created" description="Use the form to create your first exam. Then add its questions before publishing." />}</section></div>
  </div>;
}
