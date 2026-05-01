import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, scoreColor } from '../utils/api.js';
import AgentBrain from '../components/AgentBrain.jsx';
import SkillDigitalTwin from '../components/SkillDigitalTwin.jsx';
import PredictiveMasteryForecast from '../components/PredictiveMasteryForecast.jsx';
import PerformanceChart from '../components/PerformanceChart.jsx';
import AgentThinking from '../components/AgentThinking.jsx';

function StatCard({ label, value, color = 'text-indigo-400', sub }) {
  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700/40 p-3 text-center">
      <div className={`text-2xl font-black font-mono ${color}`}>{value}</div>
      <div className="text-[10px] font-semibold text-slate-500 mt-0.5 uppercase tracking-wide">{label}</div>
      {sub && <div className="text-[9px] text-slate-600 mt-0.5">{sub}</div>}
    </div>
  );
}

function MissionCard({ planDay, adaptations, onLaunch }) {
  if (!planDay) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <p className="text-slate-200 font-bold text-lg">All sessions complete!</p>
        <p className="text-xs text-slate-500 mt-1">Generate your final competency report below.</p>
      </div>
    );
  }

  const typeColors = {
    concept:  { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   text: 'text-blue-400' },
    practice: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400' },
    review:   { bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  text: 'text-amber-400' },
  };
  const tc = typeColors[planDay.sessionType] || typeColors.practice;

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-slate-900/60 p-5 space-y-4">
      {/* Tags row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
          Day {planDay.day}
        </span>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${tc.bg} ${tc.border} ${tc.text} border`}>
          {planDay.sessionType}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-400 border border-slate-600/40">
          ~{planDay.estimatedMinutes}m
        </span>
      </div>

      {/* Skill + objective */}
      <div>
        <h3 className="text-xl font-black text-slate-100">{planDay.skillName}</h3>
        {planDay.topic && (
          <p className="text-sm font-semibold text-indigo-300 mt-0.5">Topic: {planDay.topic}</p>
        )}
        <p className="text-sm text-slate-400 leading-relaxed mt-2">{planDay.objective}</p>
      </div>

      {/* Agent adaptation notice */}
      {adaptations.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Agent Updated Your Plan</span>
          </div>
          <p className="text-xs text-amber-300/80 leading-relaxed">
            {adaptations[adaptations.length - 1]}
          </p>
        </div>
      )}

      {/* Launch button */}
      <button
        onClick={onLaunch}
        className="w-full py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98]"
      >
        🚀 Launch Practice Session
      </button>
    </div>
  );
}

function PlanTimeline({ learningPlan, onNavigate }) {
  const grouped = learningPlan.reduce((acc, d) => {
    (acc[d.skillName] = acc[d.skillName] || []).push(d);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([skill, days]) => (
        <div key={skill}>
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5">{skill}</p>
          <div className="flex flex-wrap gap-1.5">
            {days.map(d => (
              <button
                key={d.day}
                title={`Day ${d.day}: ${d.topic || d.skillName}`}
                onClick={() => !d.completed && onNavigate(`/session/${d.day}`)}
                className={`w-7 h-7 rounded text-xs font-bold border transition-all hover:scale-110 ${
                  d.completed
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 cursor-default'
                    : d.addedByAgent
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:border-amber-400'
                    : 'bg-slate-700/60 border-slate-600/50 text-slate-400 hover:border-indigo-500/60 hover:text-indigo-300'
                }`}
              >
                {d.day}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="flex gap-4 pt-1 text-[9px] text-slate-600">
        {[
          ['bg-emerald-500/20 border-emerald-500/50', 'Done'],
          ['bg-amber-500/10 border-amber-500/30', 'Agent Added'],
          ['bg-slate-700/60 border-slate-600/50', 'Pending'],
        ].map(([cls, label]) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-4 h-4 rounded border ${cls}`} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tabs for the right column (Charts / Twin / Forecast) ──────────────────
const RIGHT_TABS = ['Performance', 'Digital Twin', 'Forecast'];

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [rightTab, setRightTab] = useState('Performance');
  const [agentThinking, setAgentThinking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem('skillforge:userId');
    if (!userId) { navigate('/'); return; }
    api.getDashboard(userId)
      .then(setDashboard)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLaunch = () => {
    if (!todaysMission) return;
    setAgentThinking(true);
    setTimeout(() => {
      setAgentThinking(false);
      navigate(`/session/${todaysMission.day}`);
    }, 1500);
  };

  const handleReport = async () => {
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
      <AgentThinking isVisible messages={['Loading dashboard…', 'Fetching your progress…', 'Syncing agent state…']} />
    </div>
  );
  if (error) return <div className="p-8 text-red-400 text-center">{error}</div>;
  if (!dashboard) return null;

  const { goal, learningPlan, sessions, stats, adaptations, diagnosticScores, agentDecisions = [], aiPowered } = dashboard;
  const completed = learningPlan.filter(d => d.completed).length;
  const total = learningPlan.length;
  const completionPct = total ? Math.round((completed / total) * 100) : 0;
  const todaysMission = learningPlan.find(d => !d.completed);

  return (
    <div className="min-h-screen px-4 py-6 max-w-[1700px] mx-auto">

      {/* Agent Thinking overlay */}
      {agentThinking && (
        <div className="fixed inset-0 bg-[#060B14]/80 flex items-center justify-center z-50 backdrop-blur">
          <AgentThinking
            isVisible
            messages={['Loading today\'s challenge…', 'Generating personalized task…', 'Calibrating difficulty…']}
          />
        </div>
      )}

      {/* HEADER BAR */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{goal.domainIcon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Active Goal</p>
              {aiPowered && (
                <span className="text-[8px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-black uppercase tracking-widest">
                  🤖 Gemini Powered
                </span>
              )}
            </div>
            <p className="text-base font-black text-slate-100 truncate max-w-xl">{goal.goalText}</p>
          </div>
        </div>
        <div className="flex items-center gap-5 flex-shrink-0">
          <div className="text-right">
            <p className="text-[9px] text-slate-600">Domain</p>
            <p className="text-sm font-bold text-indigo-300">{goal.domainLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-slate-600">Progress</p>
            <p className="text-sm font-black text-slate-100">{completed}/{total} days</p>
          </div>
          <div className="w-32">
            <div className="flex justify-between text-[9px] mb-1">
              <span className="text-slate-600">Overall</span>
              <span className="text-indigo-300 font-black">{completionPct}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-5">

        {/* ── LEFT: Agent Brain ── */}
        <div className="flex flex-col gap-5">
          <div className="h-[520px]">
            <AgentBrain
              decisions={agentDecisions}
              isThinking={false}
            />
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Avg Score" value={`${stats.avgScore}%`} color={scoreColor(stats.avgScore)} />
            <StatCard label="Best Score" value={`${stats.bestScore}%`} color={scoreColor(stats.bestScore)} />
            <StatCard label="Sessions" value={stats.totalSessions} color="text-indigo-400" />
            <StatCard label="Adaptations" value={adaptations.length} color="text-amber-400" sub="by agent" />
          </div>
        </div>

        {/* ── CENTER: Mission + Timeline + Recent ── */}
        <div className="flex flex-col gap-5">
          <MissionCard
            planDay={todaysMission}
            adaptations={adaptations}
            onLaunch={handleLaunch}
          />

          <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2 mb-4">
              <span>📅</span>
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Learning Plan</h2>
              <span className="ml-auto text-[10px] text-slate-600">{completed}/{total} done</span>
            </div>
            <PlanTimeline learningPlan={learningPlan} onNavigate={navigate} />
          </div>

          {sessions.length > 0 && (
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span>📝</span>
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Recent Sessions</h2>
                <span className="ml-auto text-[10px] text-slate-600">{sessions.length} total</span>
              </div>
              <div className="space-y-1.5">
                {[...sessions].reverse().slice(0, 6).map((s, i) => (
                  <div key={i} className="flex items-center rounded-lg bg-slate-800/50 px-3 py-2 text-xs gap-2">
                    <span className="text-slate-500 font-mono w-10 flex-shrink-0">D{s.day}</span>
                    <span className="flex-1 text-slate-400 truncate">{s.skillName}</span>
                    <span className={`font-black font-mono ${scoreColor(s.score)}`}>{s.score}%</span>
                    <span className="text-slate-600 w-8 flex-shrink-0 font-mono">{s.grade}</span>
                    <span className="text-slate-700 w-16 text-right flex-shrink-0 text-[9px]">
                      {new Date(s.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Real-World Mission (after 5+ sessions) */}
          {sessions.length >= 5 && (
            <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🌍</span>
                <div>
                  <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Real-World Mission</p>
                  <p className="text-[9px] text-teal-600">Unlocked after 5 sessions</p>
                </div>
              </div>
              <p className="text-sm text-teal-200 font-semibold mb-1">
                Apply your {goal.domainLabel} skills to a real project
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                You've completed {sessions.length} sessions. It's time to test your skills in a real-world context.
                Build something with what you've learned — even a small project counts.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(goal.skills || []).filter(s => s.mastery >= 50).slice(0, 3).map(s => (
                  <span key={s.id} className="text-[10px] px-2 py-1 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    ✓ {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Generate report */}
          <button
            onClick={handleReport}
            disabled={generating}
            className={`w-full py-3.5 rounded-xl font-black text-sm transition-all ${
              generating
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98]'
            }`}
          >
            {generating ? '⏳ Generating…' : '📜 Generate Competency Report →'}
          </button>
        </div>

        {/* ── RIGHT: Tabbed visualizations ── */}
        <div className="flex flex-col gap-4">
          {/* Tab switcher */}
          <div className="flex rounded-xl border border-slate-700/50 p-1 bg-slate-900/60 gap-1">
            {RIGHT_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-wider ${
                  rightTab === tab
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {rightTab === 'Performance' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span>📈</span>
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Score Trend</h2>
                </div>
                {sessions.length >= 2
                  ? <PerformanceChart sessions={sessions} />
                  : <div className="h-40 flex items-center justify-center text-slate-600 text-xs">Complete 2+ sessions</div>
                }
              </div>
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span>🧠</span>
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Agent Profile</h2>
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    ['Domain', goal.domainLabel],
                    ['Learner Level', goal.profile?.learnerLevel || '—'],
                    ['Intensity', goal.profile?.intensity || '—'],
                    ['Target Role', goal.profile?.targetRole || '—'],
                    ['Detected Tools', (goal.profile?.detectedTools || []).join(', ') || '—'],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-slate-600">{label}</span>
                      <span className="text-slate-300 font-semibold capitalize text-right max-w-[120px] truncate">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {rightTab === 'Digital Twin' && (
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span>🌐</span>
                <div>
                  <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Skill Digital Twin</h2>
                  <p className="text-[9px] text-slate-600">Your evolving learner model</p>
                </div>
              </div>
              <SkillDigitalTwin
                skills={goal.skills}
                sessions={sessions}
                diagnosticScores={diagnosticScores}
              />
            </div>
          )}

          {rightTab === 'Forecast' && (
            <PredictiveMasteryForecast
              sessions={sessions}
              skills={goal.skills}
            />
          )}
        </div>
      </div>
    </div>
  );
}
