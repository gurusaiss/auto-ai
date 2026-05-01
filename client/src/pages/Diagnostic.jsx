import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';
import AgentThinking from '../components/AgentThinking.jsx';

const MCQ_LABELS = ['A', 'B', 'C', 'D'];

function Diagnostic() {
  const navigate = useNavigate();
  const location = useLocation();
  const stored = localStorage.getItem('skillforge:goalResponse');
  const initialData = location.state || (stored ? JSON.parse(stored) : null);
  const questions = initialData?.diagnosticQuestions || [];
  const userId = initialData?.userId || localStorage.getItem('skillforge:userId');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [animating, setAnimating] = useState(false);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex] || '';
  const wordCount = useMemo(() => (currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0), [currentAnswer]);
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = answers.filter(a => a.trim()).length;

  if (!initialData || !userId) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <p className="text-slate-300 text-lg font-semibold">No diagnostic loaded</p>
        <p className="text-slate-500 text-sm mt-2 mb-6">Start by entering your learning goal on the home page.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all"
        >
          ← Go Home
        </button>
      </div>
    );
  }

  const updateAnswer = (value) => {
    const next = [...answers];
    next[currentIndex] = value;
    setAnswers(next);
  };

  const goNext = async () => {
    if (animating) return;
    if (currentIndex < questions.length - 1) {
      setAnimating(true);
      setTimeout(() => {
        setCurrentIndex(i => i + 1);
        setAnimating(false);
      }, 150);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await api.submitDiagnostic({ userId, answers });
      localStorage.setItem('skillforge:diagnostic', JSON.stringify(data));
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0 && !animating) {
      setAnimating(true);
      setTimeout(() => {
        setCurrentIndex(i => i - 1);
        setAnimating(false);
      }, 150);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-14">
        <AgentThinking
          isVisible
          messages={[
            'Scoring your answers…',
            'Identifying knowledge gaps…',
            'Building your personalized plan…',
            'Finalising skill roadmap…',
          ]}
        />
      </div>
    );
  }

  const isLast = currentIndex === questions.length - 1;
  const allAnswered = answers.every(a => a.trim());
  const canSubmit = isLast && allAnswered;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Diagnostic Assessment
          </p>
          <span className="text-xs text-slate-500">
            {answeredCount}/{questions.length} answered
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex gap-1 mt-2">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                i === currentIndex ? 'bg-indigo-400'
                : answers[i]?.trim() ? 'bg-emerald-500/60'
                : 'bg-slate-700'
              }`}
              title={`Question ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Question card */}
      <div className={`bg-[#1E293B] rounded-2xl p-8 border border-[#334155] shadow-xl transition-opacity duration-150 ${animating ? 'opacity-0' : 'opacity-100'}`}>
        {/* Question meta */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
            Q{currentIndex + 1} of {questions.length}
          </span>
          <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {currentQuestion.skillName}
          </span>
          <span className={`text-xs px-3 py-1 rounded-full border font-medium ${
            currentQuestion.type === 'multiple_choice'
              ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
              : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
          }`}>
            {currentQuestion.type === 'multiple_choice' ? '⊙ MCQ' : '✎ Open'}
          </span>
          {currentQuestion.source === 'llm' && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 font-medium">
              🤖 AI
            </span>
          )}
        </div>

        <h2 className="mt-4 text-xl font-black text-white leading-tight">{currentQuestion.question}</h2>

        {/* Answer area */}
        <div className="mt-6">
          {currentQuestion.type === 'multiple_choice' ? (
            <div className="grid gap-2.5">
              {currentQuestion.options.map((option, idx) => {
                const selected = currentAnswer === option;
                const label = MCQ_LABELS[idx] || String.fromCharCode(65 + idx);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateAnswer(option)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all ${
                      selected
                        ? 'border-indigo-500 bg-indigo-600/20 text-white shadow-lg shadow-indigo-500/10'
                        : 'border-[#334155] bg-[#0F172A] text-slate-300 hover:border-indigo-500/50 hover:bg-indigo-500/5'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-black border transition-all ${
                      selected
                        ? 'bg-indigo-500 text-white border-indigo-400'
                        : 'border-slate-600 text-slate-500 bg-slate-800'
                    }`}>
                      {label}
                    </span>
                    <span className="text-sm leading-relaxed">{option.replace(/^[A-D]\)\s*/, '')}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <textarea
                value={currentAnswer}
                onChange={(event) => updateAnswer(event.target.value)}
                className="min-h-[200px] w-full rounded-xl border border-[#334155] bg-[#0F172A] p-4 text-[#F8FAFC] text-sm focus:border-indigo-500 focus:outline-none resize-y transition-colors"
                placeholder="Write a detailed answer with examples. Aim for 30+ words for a strong score."
              />
              <div className="flex items-center justify-between mt-2">
                <p className={`text-xs font-semibold transition-colors ${
                  wordCount >= 30 ? 'text-emerald-400' : wordCount >= 15 ? 'text-amber-400' : 'text-slate-600'
                }`}>
                  {wordCount} words {wordCount >= 30 ? '✓ Good length' : wordCount >= 15 ? '— aim for 30+' : '— too short for full marks'}
                </p>
                {currentQuestion.personalizationHint && (
                  <p className="text-xs text-slate-600 max-w-xs text-right truncate">{currentQuestion.personalizationHint}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            ← Previous
          </button>

          <div className="text-center">
            {canSubmit && !allAnswered && (
              <p className="text-xs text-amber-400">Answer all questions to submit</p>
            )}
          </div>

          <button
            type="button"
            onClick={goNext}
            disabled={!currentAnswer.trim()}
            className={`rounded-xl px-6 py-2.5 font-black text-sm transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
              isLast
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white disabled:from-slate-700 disabled:to-slate-700 shadow-lg shadow-emerald-500/20'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isLast ? '✓ Submit & Build My Plan' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Diagnostic;
