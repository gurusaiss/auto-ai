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

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const OPTION_COLORS = {
  correct:   'border-emerald-500 bg-emerald-500/20 text-emerald-100',
  wrong:     'border-red-500 bg-red-500/20 text-red-200',
  selected:  'border-indigo-500 bg-indigo-500/20 text-white',
  default:   'border-slate-700 bg-slate-800/30 text-slate-300 hover:border-slate-500 hover:bg-slate-800/70',
};

// ── Learn Phase Component ────────────────────────────────────────────────────
function LearnPhase({ challenge, planDay, onReady }) {
  const cs = challenge?.conceptSummary;
  const topic = planDay?.topic || planDay?.skillName || 'Today\'s Concept';

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 space-y-5">
      {/* Header */}
      <div className="text-center mb-2">
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">
          📚 Learn First — Then Practice
        </p>
        <h1 className="text-2xl font-black text-slate-100 mt-1 leading-tight">
          {cs?.title || topic}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Read through this before your challenge — it'll make the difference
        </p>
      </div>

      {/* Definition */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-5">
        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <span>📖</span> Definition
        </p>
        <p className="text-sm text-slate-200 leading-relaxed font-medium">
          {cs?.definition || `${topic} is a key concept you'll practice in today's session.`}
        </p>
      </div>

      {/* Key Points */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <span>🔑</span> Key Points
        </p>
        <ul className="space-y-2.5">
          {(cs?.keyPoints || [
            `${topic} is fundamental to mastering ${planDay?.skillName}`,
            'Focus on understanding the concept before applying it',
            'Practice with real-world scenarios to solidify your knowledge',
          ]).map((pt, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
              <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5 border border-indigo-500/30">
                {i + 1}
              </span>
              <span className="leading-relaxed">{pt}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Example */}
      {(cs?.example) && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <span>💡</span> Real-World Example
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">{cs.example}</p>
        </div>
      )}

      {/* Pro Tip */}
      {(cs?.proTip) && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
          <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <span>⚡</span> Pro Tip
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">{cs.proTip}</p>
        </div>
      )}

      {/* Skill context */}
      <div className="flex items-center gap-2 text-[10px] text-slate-600 justify-center flex-wrap">
        <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700">
          {planDay?.skillName}
        </span>
        <span>•</span>
        <span className="capitalize">{planDay?.sessionType} session</span>
        <span>•</span>
        <span>~{planDay?.estimatedMinutes}m total</span>
      </div>

      {/* CTA */}
      <button
        onClick={onReady}
        className="w-full py-4 rounded-xl font-black text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all hover:shadow-xl hover:shadow-indigo-500/20 active:scale-[0.99]"
      >
        ✅ I'm Ready — Start Practice →
      </button>
    </div>
  );
}

// ── MCQ Warm-up Component ────────────────────────────────────────────────────
function WarmupMCQ({ question, onDone }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);

  if (!question) return null;

  const getOptionText = (opt) => opt.replace(/^[A-D]\)\s*/, '').trim();
  const isCorrect = (opt) => opt === question.correct;

  const handleSelect = (opt) => {
    if (revealed) return;
    setSelected(opt);
    setRevealed(true);
  };

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/80 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">🎯</span>
        <div>
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Warm-Up Question</p>
          <p className="text-[9px] text-slate-600">Quick MCQ before your practice session</p>
        </div>
      </div>

      <h2 className="text-base font-black text-slate-100 leading-snug">{question.question}</h2>

      <div className="space-y-2">
        {(question.options || []).map((opt, idx) => {
          const label = OPTION_LABELS[idx];
          let style = OPTION_COLORS.default;
          if (revealed) {
            if (isCorrect(opt)) style = OPTION_COLORS.correct;
            else if (selected === opt && !isCorrect(opt)) style = OPTION_COLORS.wrong;
          } else if (selected === opt) {
            style = OPTION_COLORS.selected;
          }

          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={revealed}
              className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${style} ${revealed ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span className={`w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center text-[11px] font-black border
                ${revealed && isCorrect(opt) ? 'bg-emerald-500 text-white border-emerald-400'
                  : revealed && selected === opt && !isCorrect(opt) ? 'bg-red-500 text-white border-red-400'
                  : 'border-slate-600 text-slate-500 bg-slate-800'}`}>
                {revealed && isCorrect(opt) ? '✓' : revealed && selected === opt && !isCorrect(opt) ? '✗' : label}
              </span>
              <span className="text-sm leading-relaxed">{getOptionText(opt)}</span>
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className={`rounded-xl p-4 ${selected === question.correct ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
          <p className={`text-xs font-black mb-1 ${selected === question.correct ? 'text-emerald-400' : 'text-amber-400'}`}>
            {selected === question.correct ? '✅ Correct!' : '💡 Not quite —'}
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">{question.explanation}</p>
          <button
            onClick={onDone}
            className="mt-3 w-full py-2.5 rounded-xl font-black text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all"
          >
            Continue to Practice →
          </button>
        </div>
      )}

      {!revealed && (
        <button
          onClick={onDone}
          className="w-full py-2 rounded-xl text-xs text-slate-600 border border-slate-800 hover:text-slate-400 hover:border-slate-700 transition-all"
        >
          Skip warm-up →
        </button>
      )}
    </div>
  );
}

// ── Reflection Journal ───────────────────────────────────────────────────────
function ReflectionJournal({ skillName, score, grade, onComplete }) {
  const [reflection, setReflection] = useState('');
  const [keyTakeaway, setKeyTakeaway] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    const entry = { date: new Date().toISOString(), skillName, score, grade, reflection, keyTakeaway };
    const existing = JSON.parse(localStorage.getItem('skillforge:journal') || '[]');
    localStorage.setItem('skillforge:journal', JSON.stringify([...existing, entry].slice(-50)));
    setSubmitted(true);
    setTimeout(onComplete, 1200);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <div className="text-3xl mb-2">📓</div>
        <p className="text-sm font-black text-emerald-400">Reflection saved!</p>
        <p className="text-xs text-slate-500 mt-1">Added to your learning journal.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">📓</span>
        <div>
          <h3 className="text-sm font-black text-slate-200 uppercase tracking-wide">Reflection Journal</h3>
          <p className="text-xs text-slate-500">2 minutes to consolidate what you learned</p>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">What did you learn? What was challenging?</label>
        <textarea
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          className="w-full min-h-[90px] rounded-xl border border-slate-700 bg-[#060B14] p-3 text-slate-200 text-sm focus:border-purple-500 focus:outline-none resize-none"
          placeholder="e.g. I understood seam allowance better today, but bias cut is still confusing..."
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">One key takeaway:</label>
        <input
          type="text"
          value={keyTakeaway}
          onChange={e => setKeyTakeaway(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-[#060B14] px-3 py-2.5 text-slate-200 text-sm focus:border-purple-500 focus:outline-none"
          placeholder="e.g. Always press seams open after sewing..."
        />
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={!reflection.trim() || !keyTakeaway.trim()}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Save Reflection
        </button>
        <button onClick={onComplete} className="px-4 py-2.5 rounded-xl text-sm text-slate-600 border border-slate-800 hover:text-slate-400 transition-all">
          Skip
        </button>
      </div>
    </div>
  );
}

// ── Main Session Component ───────────────────────────────────────────────────
export default function Session() {
  const { day } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem('skillforge:userId');

  const [data, setData] = useState(null);
  // phases: loading | confidence | learn | warmup | challenge | evaluating | result | journal
  const [phase, setPhase] = useState('loading');
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
    let cancelled = false;
    if (!userId) { navigate('/'); return; }
    api.getChallenge(userId, day)
      .then(payload => {
        if (!cancelled) { setData(payload); setPhase('confidence'); }
      })
      .catch(e => { if (!cancelled) { setError(e.message); setPhase('error'); } });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, userId]);

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
      <AgentThinking isVisible messages={["Loading today's mission…", "Generating your challenge…", "Calibrating difficulty…"]} />
    </div>
  );

  if (phase === 'error') return (
    <div className="mx-auto max-w-3xl px-6 py-14 text-red-400 text-center">{error || 'Challenge not found.'}</div>
  );

  // Helper: advance from confidence/learn to next phase
  const afterConfidence = () => {
    // Always go to learn phase first
    setPhase('learn');
  };
  const afterLearn = () => {
    setPhase(data?.challenge?.warmupQuestion ? 'warmup' : 'challenge');
  };

  // ── CONFIDENCE SELECTOR ──────────────────────────────────────────────────
  if (phase === 'confidence') return (
    <div className="mx-auto max-w-2xl px-6 py-10 space-y-5">
      <div className="text-center mb-2">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Session {day}</p>
        <h1 className="text-2xl font-black text-slate-100 mt-1">Before You Begin</h1>
        <p className="text-sm text-slate-500 mt-1">The agent tracks your metacognitive accuracy</p>
      </div>
      <ConfidenceSelector onSelect={(level) => { setConfidenceLevel(level); setTimeout(afterConfidence, 400); }} selected={confidenceLevel} />
      <button
        onClick={afterConfidence}
        className="w-full py-3 rounded-xl text-xs text-slate-600 border border-slate-800 hover:text-slate-400 hover:border-slate-700 transition-all"
      >
        Skip confidence check →
      </button>
    </div>
  );

  // ── LEARN PHASE ──────────────────────────────────────────────────────────
  if (phase === 'learn' && data) return (
    <LearnPhase
      challenge={data.challenge}
      planDay={data.planDay}
      onReady={afterLearn}
    />
  );

  // ── MCQ WARM-UP ──────────────────────────────────────────────────────────
  if (phase === 'warmup' && data) return (
    <div className="mx-auto max-w-2xl px-6 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Session {day}</p>
          <p className="text-base font-black text-slate-100">{data.planDay.skillName} — {data.planDay.topic}</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
          ← Dashboard
        </button>
      </div>
      <WarmupMCQ
        question={data.challenge.warmupQuestion}
        onDone={() => setPhase('challenge')}
      />
    </div>
  );

  // ── EVALUATING ──────────────────────────────────────────────────────────
  if (phase === 'evaluating') return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <AgentThinking isVisible messages={['Evaluating your response…', 'Checking reasoning quality…', 'Analysing criteria coverage…', 'Calibrating score…', 'Almost done…']} />
    </div>
  );

  // ── CHALLENGE ────────────────────────────────────────────────────────────
  if (phase === 'challenge' && data) {
    const typeColors = { coding: '#6366F1', conceptual: '#8B5CF6', design: '#06B6D4', scenario: '#F59E0B', practical: '#10B981', implementation: '#3B82F6', review: '#F97316' };
    const typeColor = typeColors[data.challenge.type] || '#6366F1';
    const isAI = data.challenge.source === 'llm';

    return (
      <div className="mx-auto max-w-4xl px-6 py-8 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">Day {data.planDay.day}</span>
            <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">{data.planDay.skillName}</span>
            <span className="text-xs px-3 py-1 rounded-full font-semibold capitalize" style={{ backgroundColor: `${typeColor}15`, color: typeColor, border: `1px solid ${typeColor}30` }}>
              {data.challenge.type}
            </span>
            {isAI && <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-semibold">🤖 AI-Generated</span>}
          </div>
          <button onClick={() => navigate('/dashboard')} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">← Dashboard</button>
        </div>

        {/* Challenge card */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
          <h1 className="text-2xl font-black text-slate-100 mb-4">{data.challenge.title}</h1>
          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{data.challenge.description}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {(data.challenge.evaluation_criteria || []).slice(0, 5).map(c => (
              <span key={c} className="text-[9px] px-2 py-0.5 rounded-full border border-slate-700 text-slate-500 bg-slate-800/50 uppercase tracking-wide">{c}</span>
            ))}
          </div>
        </div>

        {/* Hints */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50">
          <button onClick={() => setShowHints(h => !h)} className="w-full flex items-center justify-between px-4 py-3 text-sm text-indigo-300 font-semibold">
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
            placeholder="Write your answer here. Include reasoning, examples, and specific details for full marks."
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

  // ── REFLECTION JOURNAL ───────────────────────────────────────────────────
  if (phase === 'journal' && result) {
    const { evaluation } = result;
    return (
      <div className="mx-auto max-w-2xl px-6 py-8 space-y-5">
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-black">Session {day} Complete</p>
          <h1 className="text-xl font-black text-slate-100 mt-1">Lock In Your Learning</h1>
        </div>
        <ReflectionJournal
          skillName={data?.planDay?.skillName || ''}
          score={evaluation.score}
          grade={evaluation.grade}
          onComplete={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  // ── RESULT ───────────────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    const { evaluation, adaptations: newAdaptations } = result;
    const gradeMeta = GRADE_META[evaluation.grade] || GRADE_META.F;
    const isAIEval = evaluation.source === 'llm';

    return (
      <div className="mx-auto max-w-4xl px-6 py-8 space-y-5">
        {/* Score hero */}
        <div className={`rounded-2xl border p-6 text-center ${gradeMeta.bg} ${gradeMeta.border}`}>
          <div className="text-5xl mb-2">{gradeMeta.emoji}</div>
          <div className="text-8xl font-black font-mono mb-1" style={{ color: gradeMeta.color }}>
            <CountUp target={evaluation.score} />
          </div>
          <div className="text-sm font-black uppercase tracking-widest" style={{ color: gradeMeta.color }}>
            Grade {evaluation.grade} — {gradeMeta.label}
          </div>
          {isAIEval && (
            <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-semibold">
              🤖 Evaluated by Gemini 2.0 Flash
            </span>
          )}
          <p className="text-slate-400 text-sm mt-3 max-w-lg mx-auto leading-relaxed">{evaluation.feedback}</p>
        </div>

        {/* AI Coach Note */}
        {evaluation.coachNote && (
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/8 p-4 flex items-start gap-3">
            <span className="text-lg flex-shrink-0">🤖</span>
            <div>
              <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1">AI Coach Note</p>
              <p className="text-sm text-slate-300 leading-relaxed">{evaluation.coachNote}</p>
            </div>
          </div>
        )}

        {/* Strengths + Weaknesses */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <h3 className="text-sm font-black text-emerald-400 mb-3 uppercase tracking-wide">✅ Strengths</h3>
            <ul className="space-y-2">
              {(evaluation.strengths || []).map((item, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5 flex-shrink-0">•</span>{item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
            <h3 className="text-sm font-black text-red-400 mb-3 uppercase tracking-wide">📈 To Improve</h3>
            <ul className="space-y-2">
              {(evaluation.weaknesses || []).map((item, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5 flex-shrink-0">•</span>{item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Confidence calibration */}
        {confidenceLevel && (
          <ConfidenceResult
            confidenceLevel={confidenceLevel}
            actualScore={evaluation.score}
            historicalCalibrations={historicalCalibrations}
          />
        )}

        {/* Model solution */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/60">
          <button onClick={() => setShowSolution(s => !s)} className="w-full flex items-center justify-between px-4 py-3 text-sm text-indigo-300 font-semibold">
            <span>💡 View Model Solution</span>
            <span>{showSolution ? '▲' : '▼'}</span>
          </button>
          {showSolution && (
            <div className="px-4 pb-4">
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{evaluation.modelSolution}</p>
            </div>
          )}
        </div>

        {/* Agent adaptation */}
        {newAdaptations?.length > 0 && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/8 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-xs font-black text-amber-400 uppercase tracking-widest">Agent Updated Your Plan</p>
            </div>
            <p className="text-sm text-amber-200/80 leading-relaxed">{newAdaptations[newAdaptations.length - 1]}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={() => setPhase('journal')}
            className="flex-1 py-3.5 rounded-xl font-black text-sm border border-purple-700/50 bg-purple-900/20 text-purple-300 hover:text-purple-200 hover:border-purple-600 transition-all"
          >
            📓 Reflect & Journal
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 py-3.5 rounded-xl font-black text-sm border border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white hover:border-slate-500 transition-all"
          >
            ← Dashboard
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
