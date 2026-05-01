import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, scoreColor } from '../utils/api.js';
import AgentThinking from '../components/AgentThinking.jsx';
import PerformanceChart from '../components/PerformanceChart.jsx';

const DECISION_STYLES = {
  goal_analysis:       { border: 'border-indigo-500/40',  badge: 'bg-indigo-500/20 text-indigo-300' },
  skill_tree:          { border: 'border-purple-500/40',  badge: 'bg-purple-500/20 text-purple-300' },
  diagnostic:          { border: 'border-blue-500/40',    badge: 'bg-blue-500/20 text-blue-300' },
  diagnostic_complete: { border: 'border-cyan-500/40',    badge: 'bg-cyan-500/20 text-cyan-300' },
  plan_built:          { border: 'border-teal-500/40',    badge: 'bg-teal-500/20 text-teal-300' },
  adaptation:          { border: 'border-amber-500/40',   badge: 'bg-amber-500/20 text-amber-300' },
  session_complete:    { border: 'border-emerald-500/40', badge: 'bg-emerald-500/20 text-emerald-300' },
};

function DecisionCard({ decision }) {
  const [expanded, setExpanded] = useState(false);
  const style = DECISION_STYLES[decision.type] || DECISION_STYLES.goal_analysis;
  const ts = new Date(decision.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div
      className={`rounded-lg border ${style.border} bg-slate-800/50 p-3 cursor-pointer transition-all hover:bg-slate-800`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-2">
        <span className="text-base leading-none mt-0.5 flex-shrink-0">{decision.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-100">{decision.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${style.badge}`}>
              {decision.type.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{decision.detail}</p>
          {expanded && decision.reasoning && (
            <div className="mt-2 pt-2 border-t border-slate-700/50">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Agent Reasoning</p>
              <p className="text-xs text-slate-400 leading-relaxed italic">"{decision.reasoning}"</p>
            </div>
          )}
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-slate-600">{ts}</span>
            <span className="text-xs text-slate-600">{expanded ? '▲ hide' : '▼ reasoning'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillMasteryPanel({ skills, diagnosticScores }) {
  const STATUS_STYLE = {
    complete: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    active:   'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    locked:   'text-slate-500 bg-slate-700/30 border-slate-600/20',
  };
  return (
    <div className="space-y-2">
      {skills.map((skill) => {
        const mastery = skill.mastery ?? 0;
        const bar = mastery >= 75 ? 'bg-emerald-500' : mastery >= 50 ? 'bg-indigo-500' : mastery > 0 ? 'bg-amber-500' : 'bg-slate-600';
        const diagnostic = diagnosticScores?.[skill.id] ?? null;
        return (
          <div key={skill.id} className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-100">{skill.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[skill.status] || STATUS_STYLE.locked}`}>
                {skill.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${bar}`} style={{ width: `${Math.max(mastery, 3)}%` }} />
              </div>
              <span className="text-xs font-mono font-bold text-slate-300 w-8 text-right">{mastery}%</span>
            </div>
            {diagnostic !== null && (
              <p className="text-xs text-slate-500 mt-1">
                Diagnostic: <span className={diagnostic >= 60 ? 'text-emerald-400' : 'text-amber-400'}>{diagnostic}%</span>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PlanTimeline({ learningPlan, onNavigate }) {
  const grouped = learningPlan.reduce((acc, day) => {
    (acc[day.skillName] = acc[day.skillName] || []).push(day);
    return acc;
  }, {});
  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([skill, days]) => (
        <div key={skill}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{skill}</p>
          <div className="flex flex-wrap gap-1.5">
            {days.map((d) => (
              <button
                key={d.day}
                title={`Day ${d.day}: ${d.topic || d.skillName} (${d.sessionType})`}
                onClick={() => !d.completed && onNavigate(`/session/${d.day}`)}
                className={`w-7 h-7 rounded text-xs font-bold border transition-all hover:scale-110 ${
                  d.completed
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 cursor-default'
                    : 'bg-slate-700/60 border-slate-600/50 text-slate-400 hover:border-indigo-500/60 hover:text-indigo-300 cursor-pointer'
                }`}
              >{d.day}</button>
            ))}
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-3 pt-1">
        {[['bg-emerald-500/20 border-emerald-500/50', 'Done'], ['bg-slate-700/60 border-slate-600/50', 'Pending']].map(([c, l]) => (
          <div key={l} className="flex items-center gap-1">
            <div className={`w-4 h-4 rounded border ${c}`} />
            <span className="text-xs text-slate-500">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'text-indigo-400' }) {
  return (
    <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-3 text-center">
      <div className={`text-2xl font-black font-mono ${color}`}>{value}</div>
      <div className="text-xs font-semibold text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem('skillforge:userId');
    if (!userId) { navigate('/'); return; }
    api.getDashboard(userId)
      .then(setDashboard)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const userId = localStorage.getItem('skillforge:userId');
      await api.generateReport(userId);
      navigate('/report');
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <AgentThinking isVisible messages={['Loading dashboard…', 'Gathering progress data…', 'Syncing your latest mission…']} />
    </div>
  );
  if (error) return <div className="p-8 text-red-400 text-center">{error}</div>;
  if (!dashboard) return null;

  const { goal, learningPlan, sessions, stats, adaptations, diagnosticScores, agentDecisions = [] } = dashboard;
  const completed = learningPlan.filter((d) => d.completed).length;
  const total = learningPlan.length;
  const completionPct = total ? Math.round((completed / total) * 100) : 0;
  const todaysMission = learningPlan.find((d) => !d.completed);

  return (
    <div className="min-h-screen px-4 py-6 max-w-[1600px] mx-auto">

      {/* HEADER */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{goal.domainIcon}</span>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Active Goal</p>
            <p className="text-base font-bold text-slate-100 truncate max-w-xl">{goal.goalText}</p>
          </div>
        </div>
        <div className="flex items-center gap-5 flex-shrink-0">
          <div className="text-right">
            <p className="text-xs text-slate-500">Domain</p>
            <p className="text-sm font-semibold text-indigo-300">{goal.domainLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Progress</p>
            <p className="text-sm font-bold text-slate-100">{completed}/{total} days</p>
          </div>
          <div className="w-28">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500">Overall</span>
              <span className="text-indigo-300 font-bold">{completionPct}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700" style={{ width: `${completionPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-[1fr_1.3fr_1.1fr] gap-5">

        {/* LEFT */}
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2 mb-4">
              <span>🌳</span>
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Skill Mastery</h2>
            </div>
            <SkillMasteryPanel skills={goal.skills} diagnosticScores={diagnosticScores} />
          </div>

          <div className="rounded-xl border border-indigo-500/20 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <h2 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Agent Intelligence</h2>
              <span className="ml-auto text-xs text-slate-600 font-mono">{agentDecisions.length} decisions</span>
            </div>
            {agentDecisions.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Agent decisions appear as you progress.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {[...agentDecisions].reverse().map((d, i) => (
                  <DecisionCard key={d.id ?? i} decision={d} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CENTER */}
        <div className="space-y-5">
          <div className="rounded-xl border border-indigo-500/30 bg-slate-900/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span>⚔️</span>
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Today's Mission</h2>
            </div>
            {todaysMission ? (
              <>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">Day {todaysMission.day}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600/40 capitalize">{todaysMission.sessionType}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600/40">~{todaysMission.estimatedMinutes}m</span>
                </div>
                <h3 className="text-xl font-black text-slate-100 mb-1">{todaysMission.skillName}</h3>
                {todaysMission.topic && (
                  <p className="text-sm font-semibold text-indigo-300 mb-2">Topic: {todaysMission.topic}</p>
                )}
                <p className="text-sm text-slate-400 leading-relaxed mb-4">{todaysMission.objective}</p>
                {adaptations.length > 0 && (
                  <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                    <p className="text-xs font-semibold text-amber-400 mb-1">⚡ Agent Updated Your Plan</p>
                    <p className="text-xs text-amber-300/80">{adaptations[adaptations.length - 1]}</p>
                  </div>
                )}
                <button
                  onClick={() => navigate(`/session/${todaysMission.day}`)}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm transition-all hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98]"
                >
                  Launch Practice Session →
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🎉</div>
                <p className="text-slate-200 font-bold text-lg">All sessions complete!</p>
                <p className="text-xs text-slate-500 mt-1">Generate your final competency report below.</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2 mb-4">
              <span>📅</span>
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Learning Plan</h2>
              <span className="ml-auto text-xs text-slate-500">{completed}/{total} done</span>
            </div>
            <PlanTimeline learningPlan={learningPlan} onNavigate={navigate} />
          </div>

          {sessions.length > 0 && (
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span>📝</span>
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Recent Sessions</h2>
                <span className="ml-auto text-xs text-slate-500">{sessions.length} total</span>
              </div>
              <div className="space-y-1.5">
                {[...sessions].reverse().slice(0, 5).map((s, i) => (
                  <div key={i} className="flex items-center rounded-lg bg-slate-800/50 px-3 py-2 text-xs gap-2">
                    <span className="text-slate-500 font-mono w-10 flex-shrink-0">Day {s.day}</span>
                    <span className="flex-1 text-slate-400 truncate">{s.skillName}</span>
                    <span className={`font-black font-mono ${scoreColor(s.score)}`}>{s.score}%</span>
                    <span className="text-slate-600 w-16 text-right flex-shrink-0">{new Date(s.completedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Avg Score" value={`${stats.avgScore}%`} color={scoreColor(stats.avgScore)} />
            <StatCard label="Best Score" value={`${stats.bestScore}%`} color={scoreColor(stats.bestScore)} />
            <StatCard label="Sessions" value={stats.totalSessions} color="text-indigo-400" />
            <StatCard label="Days Done" value={`${completed}/${total}`} color="text-purple-400" />
          </div>

          <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span>📈</span>
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Performance Trend</h2>
            </div>
            {sessions.length >= 2 ? (
              <PerformanceChart sessions={sessions} />
            ) : (
              <div className="h-28 flex items-center justify-center text-slate-500 text-xs text-center">
                Complete 2+ sessions to see trend
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span>🧠</span>
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Agent Overview</h2>
            </div>
            <div className="space-y-2 text-xs">
              {[
                ['Domain', goal.domainLabel],
                ['Learner level', goal.profile?.learnerLevel || '—'],
                ['Intensity', goal.profile?.intensity || '—'],
                ['Adaptations', adaptations.length, adaptations.length > 0 ? 'text-amber-400' : 'text-slate-400'],
                ['Agent decisions', agentDecisions.length, 'text-indigo-400'],
              ].map(([label, val, color = 'text-slate-300']) => (
                <div key={label} className="flex justify-between">
                  <span className="text-slate-500 capitalize">{label}</span>
                  <span className={`font-semibold capitalize ${color}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
              generating
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98]'
            }`}
          >
            {generating ? '⏳ Generating…' : '📜 Generate Competency Report →'}
          </button>
        </div>
      </div>
    </div>
  );
}
