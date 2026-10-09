import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Check, CirclePlus, Pencil, Trash2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errorMessage } from '../../services/api';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';

const blankQuestion = { text: '', options: ['', '', '', ''], correct_option: 0, marks: 1 };

export default function AdminQuestions() {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(blankQuestion);
  const [editingId, setEditingId] = useState(null);
  const [locked, setLocked] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/exams/${examId}`);
      setExam(data.exam); setQuestions(data.questions);
      setLocked(Boolean(data.exam.is_published && data.questions.length > 0 && data.exam.attempt_count));
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setLoading(false); }
  }, [examId]);
  useEffect(() => { load(); }, [load]);

  const reset = () => { setForm(blankQuestion); setEditingId(null); };
  const updateOption = (index, value) => setForm((prev) => ({ ...prev, options: prev.options.map((option, i) => i === index ? value : option) }));
  const editQuestion = (question) => { setEditingId(question.id); setForm({ text: question.text, options: [...question.options], correct_option: question.correct_option, marks: question.marks }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const submit = async (event) => {
    event.preventDefault(); setSaving(true);
    const payload = { ...form, correct_option: Number(form.correct_option), marks: Number(form.marks) };
    try {
      if (editingId) await api.put(`/admin/questions/${editingId}`, payload);
      else await api.post(`/admin/exams/${examId}/questions`, payload);
      toast.success(editingId ? 'Question updated.' : 'Question added.'); reset(); await load();
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setSaving(false); }
  };
  const remove = async (question) => {
    if (!window.confirm('Delete this question?')) return;
    try { await api.delete(`/admin/questions/${question.id}`); toast.success('Question deleted.'); await load(); }
    catch (error) { toast.error(errorMessage(error)); }
  };

  if (loading && !exam) return <LoadingState label="Loading question bank…" />;
  if (!exam) return <EmptyState title="Exam not found" description="This exam may have been deleted." />;
  const totalMarks = questions.reduce((sum, question) => sum + Number(question.marks), 0);
  const isLocked = locked || exam.attempt_count > 0;
  return <div className="space-y-7"><Link to="/admin/exams" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-600"><ArrowLeft size={17} /> Back to examinations</Link><div><p className="text-sm font-semibold text-brand-600">QUESTION BANK</p><h1 className="page-title mt-1">{exam.title}</h1><p className="page-subtitle">Manage four-option multiple-choice questions for this exam.</p></div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]"><section className="card h-fit p-5 sm:p-6"><h2 className="font-semibold text-slate-900">{editingId ? 'Edit question' : 'Add a question'}</h2><p className="mt-1 text-xs text-slate-500">One correct option per question.</p>{isLocked && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Question editing is locked because a student has already started this exam.</div>}
      <form onSubmit={submit} className="mt-5 space-y-4"><fieldset disabled={isLocked || saving} className="space-y-4"><div><label className="field-label" htmlFor="questionText">Question</label><textarea id="questionText" required maxLength={3000} className="field-input min-h-24 resize-y" placeholder="Enter the question here" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} /></div>{form.options.map((option, index) => <div key={index}><label className="field-label" htmlFor={`option-${index}`}>Option {String.fromCharCode(65 + index)}</label><input id={`option-${index}`} required maxLength={500} className="field-input" placeholder={`Enter option ${String.fromCharCode(65 + index)}`} value={option} onChange={(e) => updateOption(index, e.target.value)} /></div>)}<div className="grid grid-cols-2 gap-3"><div><label className="field-label" htmlFor="correctOption">Correct answer</label><select id="correctOption" className="field-input" value={form.correct_option} onChange={(e) => setForm({ ...form, correct_option: Number(e.target.value) })}>{form.options.map((_, index) => <option value={index} key={index}>Option {String.fromCharCode(65 + index)}</option>)}</select></div><div><label className="field-label" htmlFor="marks">Marks</label><input id="marks" className="field-input" type="number" min="0.5" step="0.5" required value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} /></div></div><div className="flex gap-2"><button className="btn-primary flex-1" disabled={saving || isLocked}>{saving ? 'Saving…' : editingId ? <><Check size={16} /> Save question</> : <><CirclePlus size={16} /> Add question</>}</button>{editingId && <button className="btn-secondary" type="button" onClick={reset}>Cancel</button>}</div></fieldset></form>
    </section>
    <section className="card min-w-0 overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-semibold text-slate-900">Questions</h2><p className="mt-1 text-xs text-slate-500">{questions.length} questions · {totalMarks} total marks</p></div><span className={`badge ${exam.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{exam.is_published ? 'Published' : 'Draft'}</span></div>{loading ? <LoadingState /> : questions.length ? <div className="divide-y divide-slate-100">{questions.map((question, index) => <div key={question.id} className="p-5"><div className="flex justify-between gap-3"><div className="flex min-w-0 gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700">{index + 1}</div><div className="min-w-0"><p className="font-medium leading-6 text-slate-900">{question.text}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{question.options.map((option, optionIndex) => <div key={optionIndex} className={`rounded-lg border px-3 py-2 text-xs ${optionIndex === question.correct_option ? 'border-emerald-200 bg-emerald-50 font-semibold text-emerald-800' : 'border-slate-100 bg-slate-50 text-slate-600'}`}><span className="mr-2 opacity-60">{String.fromCharCode(65 + optionIndex)}.</span>{option}{optionIndex === question.correct_option && <span className="ml-2">✓ Correct</span>}</div>)}</div><p className="mt-2 text-xs text-slate-400">{question.marks} mark{question.marks === 1 ? '' : 's'}</p></div></div><div className="flex shrink-0 flex-col gap-1"><button onClick={() => editQuestion(question)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600" disabled={isLocked} aria-label="Edit question"><Pencil size={16} /></button><button onClick={() => remove(question)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" disabled={isLocked} aria-label="Delete question"><Trash2 size={16} /></button></div></div></div>)}</div> : <EmptyState title="No questions yet" description="Add your first question, then publish the exam from the Manage Examinations page." />}</section></div>
  </div>;
}
