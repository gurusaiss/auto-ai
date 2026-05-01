import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, scoreColor } from '../utils/api.js';
import AgentThinking from '../components/AgentThinking.jsx';

function Session() {
  const { day } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem('skillforge:userId');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [response, setResponse] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [showModelSolution, setShowModelSolution] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const payload = await api.getChallenge(userId, day);
        setData(payload);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [day, userId]);

  const wordCount = useMemo(() => (response.trim() ? response.trim().split(/\s+/).length : 0), [response]);

  const handleSubmit = async () => {
    setEvaluating(true);
    setError('');

    try {
      const payload = await api.submitSession({
        userId,
        day: Number(day),
        skillId: data.planDay.skillId,
        challenge: data.challenge,
        userResponse: response
      });
      setResult(payload);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-14">
        <AgentThinking isVisible messages={["Loading today's mission...", 'Fetching challenge...', 'Preparing practice session...']} />
      </div>
    );
  }

  if (!data) {
    return <div className="mx-auto max-w-3xl px-6 py-14 text-slate-300">{error || 'Challenge not found.'}</div>;
  }

  if (evaluating) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-14">
        <AgentThinking isVisible messages={['Evaluating your response...', 'Checking reasoning quality...', 'Finalizing your feedback...']} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {!result ? (
        <div className="space-y-6">
          <div className="bg-[#1E293B] rounded-2xl p-6 border border-[#334155] shadow-xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-indigo-600/20 px-3 py-1 text-sm text-indigo-300">Day {data.planDay.day}</span>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">{data.planDay.skillName}</span>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-sm capitalize text-slate-300">{data.challenge.type}</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold text-white">{data.challenge.title}</h1>
            <p className="mt-4 text-slate-300">{data.challenge.description}</p>
          </div>

          <div className="bg-[#1E293B] rounded-2xl p-6 border border-[#334155] shadow-xl">
            <button type="button" onClick={() => setShowHints((current) => !current)} className="text-sm font-semibold text-indigo-300">
              Show Hints
            </button>
            {showHints && (
              <ul className="mt-4 space-y-2 text-slate-300">
                {data.challenge.hints.map((hint) => (
                  <li key={hint}>- {hint}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-[#1E293B] rounded-2xl p-6 border border-[#334155] shadow-xl">
            <label className="text-lg font-semibold text-white">Your Answer:</label>
            <textarea
              value={response}
              onChange={(event) => setResponse(event.target.value)}
              className="mt-4 min-h-[220px] w-full rounded-xl border border-[#334155] bg-[#0F172A] p-4 text-[#F8FAFC] focus:border-indigo-500 focus:outline-none"
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-slate-400">{wordCount} words</p>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={wordCount < 8}
                className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-700"
              >
                Submit Answer
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-[#1E293B] rounded-2xl p-6 border border-[#334155] shadow-xl">
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Evaluation</p>
            <div className="mt-4 flex items-end gap-4">
              <p className={`text-5xl font-extrabold ${scoreColor(result.evaluation.score)}`}>{result.evaluation.score}</p>
              <span className="rounded-full bg-slate-800 px-4 py-2 text-lg font-semibold text-white">{result.evaluation.grade}</span>
            </div>
            <p className="mt-4 text-slate-300">{result.evaluation.feedback}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-[#1E293B] rounded-2xl p-6 border border-[#334155] shadow-xl">
              <h3 className="text-lg font-semibold text-emerald-300">Strengths</h3>
              <ul className="mt-4 space-y-2 text-slate-300">
                {result.evaluation.strengths.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-[#1E293B] rounded-2xl p-6 border border-[#334155] shadow-xl">
              <h3 className="text-lg font-semibold text-red-300">Areas to Improve</h3>
              <ul className="mt-4 space-y-2 text-slate-300">
                {result.evaluation.weaknesses.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-[#1E293B] rounded-2xl p-6 border border-[#334155] shadow-xl">
            <button type="button" onClick={() => setShowModelSolution((current) => !current)} className="text-sm font-semibold text-indigo-300">
              Model Solution
            </button>
            {showModelSolution && <p className="mt-4 text-slate-300">{result.evaluation.modelSolution}</p>}
          </div>

          {result.adaptations.length > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 shadow-xl text-amber-100">
              <p className="text-sm uppercase tracking-[0.25em] text-amber-300">Agent Note</p>
              <p className="mt-3">{result.adaptations[result.adaptations.length - 1]}</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-indigo-500"
          >
            Back to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}

export default Session;
