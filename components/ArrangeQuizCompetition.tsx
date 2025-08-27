import React, { useState } from 'react';
import { QuizQuestion } from './QuizTypes';
import { useAuth } from '../hooks/useAuth';
import { createQuiz, createCompetition, saveCompetitionDraft, listDraftsForOrganizer, getCompetition, updateCompetition } from '../services/quizService';

const defaultQuestion: QuizQuestion = {
  id: '',
  question: '',
  options: ['', '', '', ''],
  answer: '',
};

export default function ArrangeQuizCompetition() {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion>(defaultQuestion);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [registrationEndsAt, setRegistrationEndsAt] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [fee, setFee] = useState<number | ''>('');
  const [organizerPhone, setOrganizerPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);

  const addQuestion = () => {
    if (!currentQuestion.question.trim()) return;
    // if editing, update the question
    if (editingQuestionId) {
      setQuestions(prev => prev.map(q => q.id === editingQuestionId ? { ...currentQuestion, id: editingQuestionId } : q));
      setEditingQuestionId(null);
      setCurrentQuestion(defaultQuestion);
      return;
    }
    setQuestions(prev => [...prev, { ...currentQuestion, id: Date.now().toString() }]);
    setCurrentQuestion(defaultQuestion);
  };

  const editQuestion = (id: string) => {
    const q = questions.find(q => q.id === id);
    if (!q) return;
    setEditingQuestionId(id);
    setCurrentQuestion({ ...q });
  };

  const deleteQuestion = (id: string) => {
    if (!confirm('Delete this question?')) return;
    setQuestions(prev => prev.filter(q => q.id !== id));
    if (editingQuestionId === id) {
      setEditingQuestionId(null);
      setCurrentQuestion(defaultQuestion);
    }
  };

  const addOptionToCurrent = () => {
    setCurrentQuestion(prev => ({ ...prev, options: [...prev.options, ''] }));
  };

  const removeOptionFromCurrent = (idx: number) => {
    setCurrentQuestion(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async () => {
    if (!title.trim() || questions.length === 0) {
      alert('Please provide a title and at least one question.');
      return;
    }
    if (!currentUser) {
      alert('You must be signed in to arrange a competition.');
      return;
    }
    if (!startAt || !endAt) {
      alert('Please set start and end times for the competition.');
      return;
    }

    setSaving(true);
    try {
  const quizId = await createQuiz({ title, organizerId: currentUser.uid, questions: questions.map(q => ({ id: q.id, question: q.question, options: q.options, answer: q.answer })) });
    const compPayload: any = {
      quizId,
      startAt: new Date(startAt).toISOString(),
      endAt: new Date(endAt).toISOString(),
      isPaid: !!isPaid,
      organizerId: currentUser.uid,
      visible: true,
      draft: false,
    };
    if (registrationEndsAt) compPayload.registrationEndsAt = new Date(registrationEndsAt).toISOString();
    if (isPaid && fee !== '' && fee !== null) compPayload.fee = Number(fee || 0);
    if (organizerPhone) compPayload.organizerPhone = organizerPhone;
    await createCompetition(compPayload);
      alert('Quiz competition created!');
      setTitle('');
      setQuestions([]);
      setStartAt('');
      setEndAt('');
    } catch (err: any) {
      console.error('Error creating competition', err);
      alert(err.message || 'Failed to create competition');
    } finally {
      setSaving(false);
    }
  };

  const loadDrafts = async () => {
    if (!currentUser) return;
    try {
      const items = await listDraftsForOrganizer(currentUser.uid);
      setDrafts(items || []);
    } catch (err) {
      console.error('Failed to load drafts', err);
    }
  };

  const handleSaveDraft = async () => {
    if (!currentUser) return alert('Sign in to save drafts');
    setSavingDraft(true);
    try {
      // create quiz first
      const quizId = await createQuiz({ title, organizerId: currentUser.uid, questions: questions.map(q => ({ id: q.id, question: q.question, options: q.options, answer: q.answer })) });
      const draftPayload: any = {
        quizId,
        startAt: startAt ? new Date(startAt).toISOString() : new Date().toISOString(),
        endAt: endAt ? new Date(endAt).toISOString() : new Date().toISOString(),
        registrationEndsAt: registrationEndsAt ? new Date(registrationEndsAt).toISOString() : undefined,
        isPaid: !!isPaid,
        fee: isPaid ? (fee === '' ? 0 : Number(fee)) : undefined,
        organizerPhone: organizerPhone || undefined,
        organizerId: currentUser.uid,
        title,
        draft: true,
        visible: false,
      };
      const id = await saveCompetitionDraft(draftPayload);
      alert('Draft saved. You can publish it later from the admin panel.');
      setSelectedDraftId(id);
      setTitle(''); setQuestions([]); setStartAt(''); setEndAt(''); setRegistrationEndsAt(''); setIsPaid(false); setFee(''); setOrganizerPhone('');
      await loadDrafts();
    } catch (err: any) {
      console.error('Error saving draft', err);
      alert(err.message || 'Failed to save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleOpenDraft = async (draftId: string) => {
    try {
      const comp = await getCompetition(draftId);
      if (!comp) return alert('Draft not found');
      // load quiz
      const q = comp.quiz || (comp.quizId ? await (await fetch('') , null) : null);
      setSelectedDraftId(comp.id);
      // load UI fields: title from quiz, questions from quiz, timings from comp
      setTitle(q?.title || '');
      setQuestions(q?.questions?.map((qq: any) => ({ id: qq.id || Date.now().toString(), question: qq.question, options: qq.options || ['', '', '', ''], answer: qq.answer || '' })) || []);
      setStartAt(comp.startAt ? new Date(comp.startAt).toISOString().slice(0,16) : '');
      setEndAt(comp.endAt ? new Date(comp.endAt).toISOString().slice(0,16) : '');
      setRegistrationEndsAt(comp.registrationEndsAt ? new Date(comp.registrationEndsAt).toISOString().slice(0,16) : '');
      setIsPaid(!!comp.isPaid);
      setFee(comp.fee || '');
      setOrganizerPhone(comp.organizerPhone || '');
    } catch (err) {
      console.error('Failed to open draft', err);
      alert('Failed to open draft');
    }
  };

  const handlePublishDraft = async () => {
    if (!selectedDraftId) return alert('No draft selected');
    setSaving(true);
    try {
      // ensure the associated quiz is updated with current title/questions
      // naive approach: create new quiz and update competition.quizId to new id
      const quizId = await createQuiz({ title, organizerId: currentUser!.uid, questions: questions.map(q => ({ id: q.id, question: q.question, options: q.options, answer: q.answer })) });
      const compPayload: any = {
        quizId,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        isPaid: !!isPaid,
        registrationEndsAt: registrationEndsAt ? new Date(registrationEndsAt).toISOString() : undefined,
        fee: isPaid ? (fee === '' ? 0 : Number(fee)) : undefined,
        organizerPhone: organizerPhone || undefined,
        visible: true,
        draft: false,
        organizerId: currentUser!.uid,
      };
      await updateCompetition(selectedDraftId, compPayload);
      alert('Draft published as competition');
      setSelectedDraftId(null);
      await loadDrafts();
    } catch (err: any) {
      console.error('Failed to publish draft', err);
      alert('Failed to publish draft');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="arrange-quiz-competition space-y-4">
      <h2 className="text-2xl font-bold">Arrange Quiz Competition</h2>

      <div>
        <label className="block text-sm">Quiz Title</label>
        <input className="w-full p-2 bg-primary border rounded" value={title} onChange={e => setTitle(e.target.value)} />
        <div className="mt-2 flex gap-2">
          <button onClick={handleSaveDraft} disabled={savingDraft} className="px-3 py-1 bg-yellow-500 text-white rounded">{savingDraft ? 'Saving...' : 'Save Draft'}</button>
          <button onClick={loadDrafts} className="px-3 py-1 bg-primary rounded">Load Drafts</button>
          {selectedDraftId && <button onClick={handlePublishDraft} disabled={saving} className="px-3 py-1 bg-green-600 text-white rounded">{saving ? 'Publishing...' : 'Publish Draft'}</button>}
        </div>
        {drafts.length > 0 && (
          <div className="mt-2">
            <label className="block text-sm">Your Drafts</label>
            <select value={selectedDraftId || ''} onChange={e => { setSelectedDraftId(e.target.value || null); if (e.target.value) handleOpenDraft(e.target.value); }} className="w-full p-2 bg-primary border rounded">
              <option value="">Select a draft to open</option>
              {drafts.map(d => <option key={d.id} value={d.id}>{d.quiz?.title || d.id} - {new Date(d.createdAt || Date.now()).toLocaleString()}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="p-4 bg-primary rounded">
        <h3 className="font-semibold mb-2">Add Question</h3>
        <input className="w-full p-2 mb-2 bg-primary border rounded" placeholder="Question" value={currentQuestion.question} onChange={e => setCurrentQuestion({ ...currentQuestion, question: e.target.value })} />
        {currentQuestion.options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <input className="flex-1 p-2 bg-primary border rounded" placeholder={`Option ${idx + 1}`} value={opt} onChange={e => {
              const newOptions = [...currentQuestion.options];
              newOptions[idx] = e.target.value;
              setCurrentQuestion({ ...currentQuestion, options: newOptions });
            }} />
            <button onClick={() => removeOptionFromCurrent(idx)} className="px-2 py-1 bg-red-600 text-white rounded">Remove</button>
          </div>
        ))}
        <div className="mb-2">
          <button onClick={addOptionToCurrent} className="px-3 py-1 bg-blue-600 text-white rounded">Add Option</button>
        </div>
        <input className="w-full p-2 mb-2 bg-primary border rounded" placeholder="Correct Answer (exact text)" value={currentQuestion.answer} onChange={e => setCurrentQuestion({ ...currentQuestion, answer: e.target.value })} />
        <div className="flex gap-2">
          <button onClick={addQuestion} className="bg-accent text-white px-3 py-2 rounded">{editingQuestionId ? 'Save Question' : 'Add Question'}</button>
          {editingQuestionId && <button onClick={() => { setEditingQuestionId(null); setCurrentQuestion(defaultQuestion); }} className="px-3 py-2 rounded border">Cancel Edit</button>}
        </div>
      </div>

      <div>
        <h3 className="font-semibold">Questions Added</h3>
        <ul className="list-disc pl-6 space-y-2">
          {questions.map(q => (
            <li key={q.id} className="flex justify-between items-start">
              <div>
                <div className="font-medium">{q.question}</div>
                <div className="text-sm text-slate-400">Options: {q.options && q.options.length > 0 ? q.options.join(' | ') : 'No options'}</div>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => editQuestion(q.id)} className="px-2 py-1 bg-yellow-400 rounded">Edit</button>
                <button onClick={() => deleteQuestion(q.id)} className="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <label className="block text-sm">Start At</label>
          <input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} className="w-full p-2 bg-primary border rounded" />
        </div>
        <div>
          <label className="block text-sm">End At</label>
          <input type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} className="w-full p-2 bg-primary border rounded" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
        <div>
          <label className="block text-sm">Registration Ends At</label>
          <input type="datetime-local" value={registrationEndsAt} onChange={e => setRegistrationEndsAt(e.target.value)} className="w-full p-2 bg-primary border rounded" />
        </div>
        <div>
          <label className="block text-sm">Paid Competition?</label>
          <div className="flex items-center gap-4 mt-2">
            <label className="flex items-center gap-2"><input type="checkbox" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} /> Paid</label>
            {isPaid && <input type="number" min={0} value={fee as any} onChange={e => setFee(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Fee" className="p-2 bg-primary border rounded w-32" />}
          </div>
        </div>
      </div>

      <div className="mt-2">
        <label className="block text-sm">Organizer Phone (for receiving payments)</label>
        <input className="w-full p-2 bg-primary border rounded" value={organizerPhone} onChange={e => setOrganizerPhone(e.target.value)} placeholder="e.g. +123456789" />
      </div>

      <div>
        <button disabled={saving} onClick={handleSubmit} className="mt-3 bg-accent text-white px-4 py-2 rounded">{saving ? 'Creating...' : 'Arrange Competition'}</button>
      </div>
    </div>
  );
}
