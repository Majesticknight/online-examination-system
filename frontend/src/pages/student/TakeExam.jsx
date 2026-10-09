import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Clock3, Flag, LoaderCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errorMessage } from '../../services/api';
import LoadingState from '../../components/LoadingState';

function formatTime(totalSeconds) {
  const seconds = Math.max(0, totalSeconds || 0);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function TakeExam() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [savingQuestion, setSavingQuestion] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedLocally, setSubmittedLocally] = useState(false);
  const submittingRef = useRef(false);

  const loadAttempt = useCallback(async () => {
    try {
      const { data } = await api.get(`/student/attempts/${attemptId}`);
      if (data.attempt.status !== 'in_progress' || data.attempt.result) {
        navigate(`/student/results/${attemptId}`, { replace: true });
        return;
      }
      setAttempt(data.attempt);
      setSecondsLeft(data.attempt.remaining_seconds);
    } catch (error) { toast.error(errorMessage(error)); navigate('/student/exams', { replace: true }); }
    finally { setLoading(false); }
  }, [attemptId, navigate]);
  useEffect(() => { loadAttempt(); }, [loadAttempt]);

  const submitExam = useCallback(async (automatic = false) => {
    if (submittingRef.current || submittedLocally) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/student/attempts/${attemptId}/submit`);
      setSubmittedLocally(true);
      if (automatic) toast('Time is up. Your answers have been submitted.', { icon: '⏱️' });
      else toast.success('Exam submitted successfully.');
      navigate(`/student/results/${attemptId}`, { replace: true, state: { result: data.result } });
    } catch (error) {
      toast.error(errorMessage(error, 'Could not submit the exam.'));
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [attemptId, navigate, submittedLocally]);

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0 || !attempt || attempt.status !== 'in_progress') return undefined;
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, (value ?? 0) - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft, attempt]);

  useEffect(() => {
    if (secondsLeft === 0 && attempt?.status === 'in_progress' && !loading) submitExam(true);
  }, [secondsLeft, attempt, loading, submitExam]);

  const questions = attempt?.questions || [];
  const current = questions[currentIndex];
  const answeredCount = useMemo(() => questions.filter((question) => question.selected_option !== null && question.selected_option !== undefined).length, [questions]);
  const selectAnswer = async (question, optionIndex) => {
    setAttempt((prev) => ({ ...prev, questions: prev.questions.map((item) => item.id === question.id ? { ...item, selected_option: optionIndex } : item) }));
    setSavingQuestion(question.id);
    try {
      await api.put(`/student/attempts/${attemptId}/answers/${question.id}`, { selected_option: optionIndex });
    } catch (error) {
      toast.error(errorMessage(error));
      if (error.response?.status === 409) await submitExam(true);
    } finally { setSavingQuestion(null); }
  };
  const manualSubmit = () => {
    if (window.confirm(`Submit this examination now? You have answered ${answeredCount} of ${questions.length} questions.`)) submitExam(false);
  };

  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-50"><LoadingState label="Opening examination…" /></div>;
  if (!attempt || !current) return <div className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center"><div><h1 className="text-xl font-bold">No active examination</h1><p className="mt-2 text-sm text-slate-500">Return to the exam list to continue.</p><button className="btn-primary mt-4" onClick={() => navigate('/student/exams')}>Back to exams</button></div></div>;

  return <div className="min-h-screen bg-slate-50"><header className="sticky top-0 z-20 border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-7"><div className="min-w-0"><p className="truncate font-bold text-slate-900">{attempt.exam.title}</p><p className="mt-0.5 text-xs text-slate-500">Question {currentIndex + 1} of {questions.length}</p></div><div className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 font-mono text-sm font-bold ${secondsLeft <= 60 ? 'bg-rose-50 text-rose-700' : 'bg-brand-50 text-brand-700'}`}><Clock3 size={17} />{formatTime(secondsLeft)}<span className="hidden font-sans text-xs font-medium sm:inline">remaining</span></div></div></header>
    <main className="mx-auto grid max-w-7xl gap-5 p-4 sm:p-7 lg:grid-cols-[minmax(0,1fr)_280px]"><section className="card min-w-0 p-5 sm:p-8"><div className="mb-6 flex items-center justify-between gap-3"><span className="badge bg-brand-50 text-brand-700">Question {currentIndex + 1}</span><span className="text-xs font-medium text-slate-500">{current.marks} mark{current.marks === 1 ? '' : 's'}</span></div><div className="mb-8 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} /></div><h1 className="text-xl font-bold leading-8 text-slate-900 sm:text-2xl">{current.text}</h1><p className="mt-2 text-sm text-slate-500">Select one answer below. Your selection is saved automatically.</p><div className="mt-7 space-y-3">{current.options.map((option, index) => { const selected = current.selected_option === index; return <button key={`${current.id}-${index}`} type="button" onClick={() => selectAnswer(current, index)} disabled={submitting || savingQuestion === current.id} className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${selected ? 'border-brand-500 bg-brand-50/70 ring-2 ring-brand-100' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-bold ${selected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{String.fromCharCode(65 + index)}</span><span className={`flex-1 pt-1 text-sm leading-6 ${selected ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>{option}</span>{selected && <CheckCircle2 size={19} className="mt-1 shrink-0 text-brand-600" />}</button>; })}</div><div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5"><button type="button" className="btn-secondary" disabled={currentIndex === 0 || submitting} onClick={() => setCurrentIndex((index) => index - 1)}><ArrowLeft size={16} /> Previous</button><div className="flex items-center gap-2 text-xs text-slate-500">{savingQuestion === current.id ? <><LoaderCircle size={14} className="animate-spin" /> Saving answer…</> : current.selected_option !== null && current.selected_option !== undefined ? <><CheckCircle2 size={14} className="text-emerald-600" /> Answer saved</> : 'Not answered'}</div><button type="button" className="btn-primary" disabled={currentIndex === questions.length - 1 || submitting} onClick={() => setCurrentIndex((index) => index + 1)}>Next <ArrowRight size={16} /></button></div></section>
    <aside className="space-y-5"><section className="card p-5"><div className="flex items-center justify-between"><h2 className="font-semibold text-slate-900">Question palette</h2><span className="text-xs text-slate-500">{answeredCount}/{questions.length}</span></div><div className="mt-4 grid grid-cols-5 gap-2">{questions.map((question, index) => { const answered = question.selected_option !== null && question.selected_option !== undefined; return <button type="button" key={question.id} onClick={() => setCurrentIndex(index)} className={`grid aspect-square place-items-center rounded-lg border text-sm font-semibold transition ${index === currentIndex ? 'border-brand-600 bg-brand-600 text-white' : answered ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`} aria-label={`Go to question ${index + 1}`}>{index + 1}</button>; })}</div><div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500"><p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-brand-600" /> Current question</p><p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Answered</p><p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm border border-slate-300 bg-white" /> Not answered</p></div></section><section className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex gap-3"><AlertTriangle size={19} className="mt-0.5 shrink-0 text-amber-700" /><div><p className="text-sm font-semibold text-amber-900">Before you submit</p><p className="mt-1 text-xs leading-5 text-amber-800">Your saved answers will be graded automatically. The exam will also submit when the timer reaches zero.</p></div></div><button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold text-white hover:bg-amber-700" onClick={manualSubmit} disabled={submitting || savingQuestion !== null}>{submitting ? 'Submitting…' : <><Flag size={16} /> Submit exam</>}</button></section></aside></main></div>;
}
