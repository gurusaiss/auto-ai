import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, scoreColor } from '../utils/api.js';
import AgentThinking from '../components/AgentThinking.jsx';
import { ConfidenceSelector, ConfidenceResult } from '../components/ConfidenceCalibration.jsx';

// Animated score counter
function CountUp({ target, duration = 1200 }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return <>{current}</>;
}

const GRADE_META = {
  A: { label: 'Outstanding', color: '#10B981', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', emoji: '🏆' },
  B: { label: 'Proficient',  color: '#6366F1', bg: 'bg-indigo-500/15',  border: 'border-indigo-500/30',  emoji: '⭐' },
  C: { label: 'Developing',  color: '#F59E0B', bg: 'bg-amber-500/15',   border: 'border-amber-500/30',   emoji: '📈' },
  D: { label: 'Needs Work',  color: '#F97316', bg: 'bg-orange-500/15',  border: 'border-orange-500/30',  emoji: '💪' },
  F: { label: 'Keep Going',  color: '#EF4444', bg: 'bg-red-500/15',     border: 'border-red-500/30',     emoji: '🔄' },
};

export default function Session() {
  const { day } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem('skillforge:userId');

  const [data, setData] = useState(null);
  const [phase, setPhase] = useState('loading'); // loading | confidence | challenge | evaluating | result
  const [response, setResponse] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState(null);
  const [historicalCalibrations] = useState(() => {
    try { return JSON.parse(localStorage.getItem('skillforge:calibrations') || '[]'); } catch { return []; }
  });

  const wordCount = useMemo(() => response.trim() ? response.trim().split(/\s+/).length : 0, [response]);

  useEffect(() => {
    if (!userId) { navigate('/'); return; }
    api.getChallenge(userId, day)
      .then(payload => {
        setData(payload);
        setPhase('confidence'); // Show confidence selector first
      })
      .catch(e => { setError(e.message); setPhase('error'); });
  }, [day, userId, navigate]);

  const handleConfidenceSelect = (level) => {
    setConfidenceLevel(level);
    setTimeout(() => setPhase('challenge'), 400);
  };

  const handleSubmit = async () => {
    if (wordCount < 8) return;
    setPhase('evaluating');
    try {
      const payload = await api.submitSession({
        userId,
        day: Number(day),
        skillId: data.planDay.skillId,
        challenge: data.challenge,
        userResponse: response,
      });
      setResult(payload);

      // Save calibration data
      if (confidenceLevel) {
        const predicted = confidenceLevel * 20;
        const cals = [...historicalCalibrations, { predicted, actual: payload.evaluation.score, day: Number(day) }];
        localStorage.setItem('skillforge:calibrations', JSON.stringify(cals.slice(-20)));
      }

      setPhase('result');
    } catch (e) {
      setError(e.message);
      setPhase('challenge');
    }
  };

  // ── LOADING ──────────────────────────────────────────────────────────────
  if (phase === 'loading') return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <AgentThinking isVisible messages={["Loading today's mission…", 'Fetching challenge…', 'Calibrating difficulty…']} />
    </div>
  );

  if (phase === 'error') return (
    <div className="mx-auto max-w-3xl px-6 py-14 text-red-400 text-center">{error || 'Challenge not found.'}</div>
  );

  // ── CONFIDENCE SELECTOR ──────────────────────────────────────────────────
  if (phase === 'confidence') return (
    <div className="mx-auto max-w-2xl px-6 py-10 space-y-5">
      <div className="text-center mb-2">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Session {day}</p>
        <h1 className="text-2xl font-black text-slate-100 mt-1">Before You Begin</h1>
        <p className="text-sm text-slate-500 mt-1">
          The agent tracks your metacognitive accuracy alongside performance
        </p>
      </div>
      <ConfidenceSelector onSelect={handleConfidenceSelect} selected={confidenceLevel} />
      <button
        onClick={() => setPhase('challenge')}
        className="w-full py-3 rounded-xl text-xs text-slate-600 border border-slate-800 hover:text-slate-400 hover:border-slate-700 transition-all"
      >
        Skip confidence check →
      </button>
    </div>
  );

  // ── EVALUATING ──────────────────────────────────────────────────────────
  if (phase === 'evaluating') return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <AgentThinking
        isVisible
        messages={['Evaluating your response…', 'Checking reasoning quality…', 'Analysing coverage of criteria…', 'Calibrating final score…']}
      />
    </div>
  );

  // ── CHALLENGE ────────────────────────────────────────────────────────────
  if (phase === 'challenge' && data) {
    const typeColors = {
      coding: '#6366F1', conceptual: '#8B5CF6', design: '#06B6D4',
      scenario: '#F59E0B', practical: '#10B981', implementation: '#3B82F6', query: '#EC4899',
    };
    const typeColor = typeColors[data.challenge.type] || '#6366F1';

    return (
      <div className="mx-auto max-w-4xl px-6 py-8 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
              Day {data.planDay.day}
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
              {data.planDay.skillName}
            </span>
            <span
              className="text-xs px-3 py-1 rounded-full font-semibold capitalize"
              style={{ backgroundColor: `${typeColor}15`, color: typeColor, border: `1px solid ${typeColor}30` }}
            >
              {data.challenge.type}
            </span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            ← Dashboard
          </button>
        </div>

        {/* Challenge card */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
          <h1 className="text-2xl font-black text-slate-100 mb-4">{data.challenge.title}</h1>
          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{data.challenge.description}</p>

          {/* Criteria preview */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {(data.challenge.evaluation_criteria || []).slice(0, 5).map(c => (
              <span key={c} className="text-[9px] px-2 py-0.5 rounded-full border border-slate-700 text-slate-500 bg-slate-800/50 uppercase tracking-wide">
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Hints */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50">
          <button
            onClick={() => setShowHints(h => !h)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-indigo-300 font-semibold"
          >
            <span>💡 Hints ({data.challenge.hints?.length || 0})</span>
            <span>{showHints ? '▲' : '▼'}</span>
          </button>
          {showHints && (
            <div className="px-4 pb-4 space-y-1.5">
              {(data.challenge.hints || []).map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="text-indigo-500 font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>
                  <span>{h}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Response area */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-black text-slate-300 uppercase tracking-wider">Your Answer</label>
            <span className={`text-xs font-semibold ${wordCount >= 30 ? 'text-emerald-400' : wordCount >= 10 ? 'text-amber-400' : 'text-slate-600'}`}>
              {wordCount} words {wordCount >= 30 ? '✓' : wordCount >= 10 ? '(aim for 30+)' : '(too short)'}
            </span>
          </div>
          <textarea
            value={response}
            onChange={e => setResponse(e.target.value)}
            className="w-full min-h-[220px] rounded-xl border border-slate-700 bg-[#060B14] p-4 text-slate-100 text-sm focus:border-indigo-500 focus:outline-none resize-y transition-colors"
            placeholder="Write your answer here. Include reasoning, examples, and explanations for full marks."
          />
          <div className="flex items-center justify-between">
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={wordCount < 8}
              className="ml-auto px-8 py-3 rounded-xl font-black text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit Answer →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── RESULT ───────────────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    const { evaluation, adaptations: newAdaptations } = result;
    const gradeMeta = GRADE_META[evaluation.grade] || GRADE_META.F;

    return (
      <div className="mx-auto max-w-4xl px-6 py-8 space-y-5">
        {/* Score hero */}
        <div className={`rounded-2xl border p-6 text-center ${gradeMeta.bg} ${gradeMeta.border}`}>
          <div className="text-5xl mb-2">{gradeMeta.emoji}</div>
          <div
            className="text-8xl font-black font-mono mb-1"
            style={{ color: gradeMeta.color }}
          >
            <CountUp target={evaluation.score} />
          </div>
          <div
            className="text-sm font-black uppercase tracking-widest"
            style={{ color: gradeMeta.color }}
          >
            Grade {evaluation.grade} — {gradeMeta.label}
          </div>
          <p className="text-slate-400 text-sm mt-3 max-w-lg mx-auto leading-relaxed">{evaluation.feedback}</p>
        </div>

        {/* Strengths + Weaknesses */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <h3 className="text-sm font-black text-emerald-400 mb-3 uppercase tracking-wide">✅ Strengths</h3>
            <ul className="space-y-2">
              {(evaluation.strengths || []).map((item, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5 flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
            <h3 className="text-sm font-black text-red-400 mb-3 uppercase tracking-wide">📈 To Improve</h3>
            <ul className="space-y-2">
              {(evaluation.weaknesses || []).map((item, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5 flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Confidence calibration result */}
        {confidenceLevel && (
          <ConfidenceResult
            confidenceLevel={confidenceLevel}
            actualScore={evaluation.score}
            historicalCalibrations={historicalCalibrations}
          />
        )}

        {/* Model solution */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/60">
          <button
            onClick={() => setShowSolution(s => !s)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-indigo-300 font-semibold"
          >
            <span>💡 View Model Solution</span>
            <span>{showSolution ? '▲' : '▼'}</span>
          </button>
          {showSolution && (
            <div className="px-4 pb-4">
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{evaluation.modelSolution}</p>
            </div>
          )}
        </div>

        {/* Agent adaptation note */}
        {newAdaptations?.length > 0 && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/8 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-xs font-black text-amber-400 uppercase tracking-widest">Agent Updated Your Plan</p>
            </div>
            <p className="text-sm text-amber-200/80 leading-relaxed">
              {newAdaptations[newAdaptations.length - 1]}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 py-3.5 rounded-xl font-black text-sm border border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white hover:border-slate-500 transition-all"
          >
            ← Back to Dashboard
          </button>
          {result.nextDay && (
            <button
              onClick={() => navigate(`/session/${result.nextDay}`)}
              className="flex-1 py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all"
            >
              Next Session (Day {result.nextDay}) →
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
