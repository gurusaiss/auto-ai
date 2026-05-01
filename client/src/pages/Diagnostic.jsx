import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';
import AgentThinking from '../components/AgentThinking.jsx';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const OPTION_COLORS = {
  selected: {
    A: 'border-indigo-500 bg-indigo-600/20 text-white shadow-indigo-500/10',
    B: 'border-purple-500 bg-purple-600/20 text-white shadow-purple-500/10',
    C: 'border-cyan-500 bg-cyan-600/20 text-white shadow-cyan-500/10',
    D: 'border-emerald-500 bg-emerald-600/20 text-white shadow-emerald-500/10',
  },
  labelSelected: {
    A: 'bg-indigo-500 text-white border-indigo-400',
    B: 'bg-purple-500 text-white border-purple-400',
    C: 'bg-cyan-500 text-white border-cyan-400',
    D: 'bg-emerald-500 text-white border-emerald-400',
  },
};

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

  if (!initialData || !userId) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="text-5xl mb-4">🎯</div>
        <p className="text-slate-200 text-xl font-black">No diagnostic loaded</p>
        <p className="text-slate-500 text-sm mt-2 mb-6">Enter your learning goal on the home page first.</p>
        <button onClick={() => navigate('/')} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all">
          ← Go Home
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-14">
        <AgentThinking isVisible messages={[
          'Scoring your answers…',
          'Mapping your knowledge profile…',
          'Building your personalized plan…',
          'Scheduling your learning journey…',
        ]} />
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex] || '';
  const answeredCount = answers.filter(a => a.trim()).length;
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isLast = currentIndex === questions.length - 1;

  const selectOption = (option) => {
    const next = [...answers];
    next[currentIndex] = option;
    setAnswers(next);

    // Auto-advance after short delay so user sees their selection
    if (!isLast) {
      setTimeout(() => {
        setAnimating(true);
        setTimeout(() => {
          setCurrentIndex(i => i + 1);
          setAnimating(false);
        }, 200);
      }, 350);
    }
  };

  const goBack = () => {
    if (currentIndex > 0 && !animating) {
      setAnimating(true);
      setTimeout(() => { setCurrentIndex(i => i - 1); setAnimating(false); }, 150);
    }
  };

  const handleSubmit = async () => {
    if (answeredCount < questions.length) {
      setError(`Please answer all ${questions.length} questions before submitting.`);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await api.submitDiagnostic({ userId, answers });
      localStorage.setItem('skillforge:diagnostic', JSON.stringify(data));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Parse option text — strip leading "A) " etc for display if already labeled
  const getOptionText = (option) => option.replace(/^[A-D]\)\s*/, '').trim();

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">

      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Skill Assessment</p>
        <h1 className="text-xl font-black text-slate-100">
          How well do you know this already?
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Your answers shape your personalized learning plan
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex justify-between text-[10px] text-slate-600 mb-1.5 font-semibold">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{answeredCount}/{questions.length} answered</span>
        </div>
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Dot progress */}
        <div className="flex gap-1 mt-2 justify-center flex-wrap">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => !animating && setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? 'bg-indigo-400 w-5'
                  : answers[i]?.trim()
                  ? 'bg-emerald-500/70'
                  : 'bg-slate-700'
              }`}
              title={`Q${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Question card */}
      <div className={`rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 transition-all duration-200 ${animating ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'}`}>

        {/* Question meta tags */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-[9px] px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-semibold uppercase tracking-wide">
            {currentQuestion.skillName}
          </span>
          {currentQuestion.source === 'llm' && (
            <span className="text-[9px] px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-bold">
              🤖 AI Question
            </span>
          )}
          <span className="ml-auto text-[9px] text-slate-600 font-mono">Q{currentIndex + 1}/{questions.length}</span>
        </div>

        {/* Question text */}
        <h2 className="text-base font-black text-slate-100 leading-snug mb-5">
          {currentQuestion.question}
        </h2>

        {/* MCQ Options */}
        <div className="space-y-2.5">
          {(currentQuestion.options || []).map((option, idx) => {
            const label = OPTION_LABELS[idx] || String.fromCharCode(65 + idx);
            const isSelected = currentAnswer === option;
            const selectedStyle = isSelected ? OPTION_COLORS.selected[label] : '';
            const labelStyle = isSelected ? OPTION_COLORS.labelSelected[label] : 'border-slate-700 text-slate-500 bg-slate-800/80';

            return (
              <button
                key={option}
                type="button"
                onClick={() => selectOption(option)}
                className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-200 group
                  ${isSelected
                    ? `${selectedStyle} shadow-lg`
                    : 'border-slate-700/60 bg-slate-800/30 text-slate-300 hover:border-slate-500 hover:bg-slate-800/70 hover:text-white'
                  }`}
              >
                {/* Label badge */}
                <span className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-black border transition-all ${labelStyle}`}>
                  {label}
                </span>

                {/* Option text */}
                <span className="text-sm leading-relaxed font-medium">
                  {getOptionText(option)}
                </span>

                {/* Check mark when selected */}
                {isSelected && (
                  <span className="ml-auto text-sm opacity-80">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Hint */}
        {currentQuestion.personalizationHint && (
          <p className="mt-3 text-[10px] text-slate-600 italic">
            💡 {currentQuestion.personalizationHint}
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Navigation row */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={goBack}
          disabled={currentIndex === 0}
          className="px-4 py-3 rounded-xl text-sm font-semibold border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
        >
          ← Back
        </button>

        {isLast ? (
          <button
            onClick={handleSubmit}
            disabled={answeredCount < questions.length}
            className="flex-1 py-3 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
          >
            {answeredCount < questions.length
              ? `Answer ${questions.length - answeredCount} more question${questions.length - answeredCount !== 1 ? 's' : ''} to continue`
              : '✓ Submit & Build My Learning Plan →'
            }
          </button>
        ) : (
          <button
            onClick={() => selectOption(currentAnswer)}
            disabled={!currentAnswer}
            className="flex-1 py-3 rounded-xl font-black text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next Question →
          </button>
        )}
      </div>

      {/* Bottom summary */}
      {answeredCount === questions.length && (
        <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
          <p className="text-xs text-emerald-400 font-bold">
            ✅ All {questions.length} questions answered — ready to build your plan!
          </p>
        </div>
      )}
    </div>
  );
}

export default Diagnostic;
