import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';
import AgentThinking from '../components/AgentThinking.jsx';

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

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex] || '';
  const wordCount = useMemo(() => (currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0), [currentAnswer]);

  if (!initialData) {
    return <div className="mx-auto max-w-3xl px-6 py-16 text-slate-300">No diagnostic loaded yet. Start from the landing page.</div>;
  }

  const updateAnswer = (value) => {
    const next = [...answers];
    next[currentIndex] = value;
    setAnswers(next);
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((index) => index + 1);
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

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      {loading ? (
        <AgentThinking
          isVisible
          messages={['Scoring your answers...', 'Mapping knowledge gaps...', 'Building your personalized plan...', 'Finalizing skill roadmap...']}
        />
      ) : (
        <div className="bg-[#1E293B] rounded-2xl p-8 border border-[#334155] shadow-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">
            Question {currentIndex + 1} of {questions.length}
          </p>
          <div className="mt-4 h-2 rounded-full bg-[#0F172A]">
            <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
          </div>

          <p className="mt-6 text-sm text-slate-400">{currentQuestion.skillName}</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{currentQuestion.question}</h2>

          <div className="mt-8">
            {currentQuestion.type === 'multiple_choice' ? (
              <div className="grid gap-3">
                {currentQuestion.options.map((option) => {
                  const selected = currentAnswer === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => updateAnswer(option)}
                      className={`rounded-xl border px-4 py-4 text-left transition-all ${
                        selected
                          ? 'border-indigo-500 bg-indigo-600/20 text-white'
                          : 'border-[#334155] bg-[#0F172A] text-slate-300 hover:border-indigo-500'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <textarea
                  value={currentAnswer}
                  onChange={(event) => updateAnswer(event.target.value)}
                  className="min-h-[220px] w-full rounded-xl border border-[#334155] bg-[#0F172A] p-4 text-[#F8FAFC] focus:border-indigo-500 focus:outline-none"
                  placeholder="Explain your reasoning with a clear example."
                />
                <p className="mt-2 text-sm text-slate-400">{wordCount} words</p>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-red-400">{error}</p>
            <button
              type="button"
              onClick={handleNext}
              disabled={!currentAnswer.trim()}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {currentIndex === questions.length - 1 ? 'Submit & Build My Plan' : 'Next →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Diagnostic;
