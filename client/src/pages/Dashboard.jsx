import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, scoreColor } from '../utils/api.js';
import AgentBrain from '../components/AgentBrain.jsx';
import SkillDigitalTwin from '../components/SkillDigitalTwin.jsx';
import PredictiveMasteryForecast from '../components/PredictiveMasteryForecast.jsx';
import AgentThinking from '../components/AgentThinking.jsx';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, AreaChart, Area
} from 'recharts';

// ── Stat chip ─────────────────────────────────────────────────────────────────
function Stat({ label, value, sub, color = 'text-indigo-400', icon }) {
  return (
    <div className="flex-1 min-w-[80px] bg-slate-800/50 border border-slate-700/40 rounded-xl px-4 py-3 text-center">
      {icon && <div className="text-lg mb-0.5">{icon}</div>}
      <div className={`text-2xl font-black font-mono ${color}`}>{value}</div>
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">{label}</div>
      {sub && <div className="text-[9px] text-slate-600 mt-0.5">{sub}</div>}
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, color = '#6366f1', thin = false }) {
  return (
    <div className={`w-full bg-slate-800 rounded-full overflow-hidden ${thin ? 'h-1.5' : 'h-2'}`}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.max(value, 2)}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ── Mission card ──────────────────────────────────────────────────────────────
function MissionCard({ planDay, adaptations, onLaunch, loading }) {
  if (!planDay) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
        <div className="text-5xl mb-3">🎉</div>
        <p className="text-lg font-black text-slate-200">All sessions complete!</p>
        <p className="text-sm text-slate-500 mt-1">Generate your final competency report below.</p>
      </div>
    );
  }

  const typeStyle = {
    concept:  { bg: 'bg-blue-500/10',   border: 'border-blue-500/25',   text: 'text-blue-300',   dot: 'bg-blue-400' },
    practice: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/25', text: 'text-indigo-300', dot: 'bg-indigo-400' },
    review:   { bg: 'bg-amber-500/10',  border: 'border-amber-500/25',  text: 'text-amber-300',  dot: 'bg-amber-400' },
  };
  const ts = typeStyle[planDay.sessionType] || typeStyle.practice;

  return (
    <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-slate-900 to-slate-900/60 p-6 space-y-4">
      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 font-bold">
          Day {planDay.day}
        </span>
        <span className={`text-xs px-3 py-1 rounded-full border font-semibold capitalize ${ts.bg} ${ts.border} ${ts.text}`}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${ts.dot} mr-1.5 animate-pulse`} />
          {planDay.sessionType}
        </span>
        <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
          ~{planDay.estimatedMinutes}m
        </span>
      </div>

      {/* Content */}
      <div>
        <h3 className="text-xl font-black text-white">{planDay.skillName}</h3>
        {planDay.topic && (
          <p className="text-sm font-bold text-indigo-300/80 mt-0.5">📌 {planDay.topic}</p>
        )}
        <p className="text-sm text-slate-400 leading-relaxed mt-2">{planDay.objective}</p>
      </div>

      {/* Agent update */}
      {adaptations.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0 animate-pulse" />
          <p className="text-xs text-amber-300/80 leading-relaxed">{adaptations[adaptations.length - 1]}</p>
        </div>
      )}

      {/* Launch */}
      <button
        onClick={onLaunch}
        disabled={loading}
        className="w-full py-4 rounded-xl font-black text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all hover:shadow-xl hover:shadow-indigo-500/20 active:scale-[0.99] disabled:opacity-60"
      >
        {loading ? '⏳ Loading Challenge…' : '🚀 Launch Practice Session'}
      </button>
    </div>
  );
}

// ── Plan grid (improved day tiles) ───────────────────────────────────────────
function PlanTimeline({ learningPlan, navigate }) {
  const [hoveredDay, setHoveredDay] = useState(null);

  const groups = learningPlan.reduce((acc, d) => {
    (acc[d.skillName] = acc[d.skillName] || []).push(d);
    return acc;
  }, {});

  const typeIcon = { concept: '📖', practice: '⚔️', review: '🔄' };
  const typeColor = {
    concept:  { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-300' },
    practice: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-300' },
    review:   { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-300' },
  };

  return (
    <div className="space-y-5">
      {Object.entries(groups).map(([skill, days]) => (
        <div key={skill}>
          {/* Skill group header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-slate-800" />
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2">{skill}</p>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          {/* Day cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {days.map(d => {
              const tc = typeColor[d.sessionType] || typeColor.practice;
              const isHovered = hoveredDay === d.day;
              return (
                <button
                  key={d.day}
                  onClick={() => !d.completed && navigate(`/session/${d.day}`)}
                  onMouseEnter={() => setHoveredDay(d.day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  disabled={d.completed}
                  className={`relative rounded-xl border p-3 text-left transition-all duration-200 group ${
                    d.completed
                      ? 'bg-emerald-500/8 border-emerald-500/25 cursor-default'
                      : d.addedByAgent
                      ? 'bg-amber-500/8 border-amber-500/25 hover:border-amber-400/50 hover:bg-amber-500/12 active:scale-[0.98]'
                      : `${tc.bg} ${tc.border} hover:brightness-125 hover:shadow-lg active:scale-[0.98] cursor-pointer`
                  }`}
                >
                  {/* Day number + status */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-black font-mono ${
                      d.completed ? 'text-emerald-400' : d.addedByAgent ? 'text-amber-400' : tc.text
                    }`}>
                      {d.completed ? '✓' : `D${d.day}`}
                    </span>
                    <span className="text-[10px]">
                      {d.completed ? '✅' : (typeIcon[d.sessionType] || '📌')}
                    </span>
                  </div>

                  {/* Topic */}
                  <p className={`text-[10px] font-semibold leading-snug truncate ${
                    d.completed ? 'text-emerald-300/70' : 'text-slate-300'
                  }`}>
                    {d.topic || d.skillName}
                  </p>

                  {/* Time estimate */}
                  <p className="text-[9px] text-slate-600 mt-0.5">{d.estimatedMinutes}m</p>

                  {/* Agent-added badge */}
                  {d.addedByAgent && (
                    <span className="absolute top-1.5 right-1.5 text-[8px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                      ⚡ AI
                    </span>
                  )}

                  {/* Hover tooltip */}
                  {isHovered && d.objective && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 z-10 bg-slate-900 border border-slate-700 rounded-lg p-2 shadow-xl pointer-events-none">
                      <p className="text-[9px] text-slate-300 leading-relaxed line-clamp-3">{d.objective}</p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-2 text-[9px] text-slate-600">
        {[
          ['bg-emerald-500/8 border-emerald-500/25', '✅', 'Completed'],
          ['bg-indigo-500/10 border-indigo-500/30', '⚔️', 'Practice'],
          ['bg-blue-500/10 border-blue-500/30',     '📖', 'Concept'],
          ['bg-amber-500/8 border-amber-500/25',    '⚡', 'Agent Added'],
        ].map(([cls, icon, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded border text-[8px] flex items-center justify-center ${cls}`}>{icon}</div>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Score trend chart ────────────────────────────────────────────────────────
function ScoreChart({ sessions }) {
  if (sessions.length < 2) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-slate-600 text-xs gap-2">
        <span className="text-3xl opacity-30">📈</span>
        Complete 2+ sessions to see your trend
      </div>
    );
  }
  const data = sessions.map((s, i) => ({
    n: i + 1, day: s.day, score: s.score, skill: s.skillName,
  }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="n" tick={{ fontSize: 9, fill: '#475569' }} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#475569' }} tickLine={false} />
        <ReferenceLine y={75} stroke="#f59e0b" strokeDasharray="4 4" />
        <Tooltip
          content={({ active, payload }) => active && payload?.length ? (
            <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
              <p className="text-slate-400">Day {payload[0].payload.day} · {payload[0].payload.skill}</p>
              <p className="font-black text-indigo-300 text-base">{payload[0].value}%</p>
            </div>
          ) : null}
        />
        <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} fill="url(#scoreGrad)" dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Skill mastery bars (expandable) ──────────────────────────────────────────
function SkillBars({ skills, diagnosticScores }) {
  const [expanded, setExpanded] = useState(null);

  if (!skills.length) return <div className="text-slate-600 text-xs text-center py-8">No skills loaded</div>;

  const barColor = (m) => m >= 75 ? '#10b981' : m >= 50 ? '#6366f1' : m > 0 ? '#f59e0b' : '#475569';
  const statusBadge = {
    complete:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    active:       'bg-indigo-500/15  text-indigo-400  border-indigo-500/30',
    demonstrated: 'bg-teal-500/15    text-teal-400    border-teal-500/30',
    locked:       'bg-slate-800      text-slate-600   border-slate-700',
  };

  return (
    <div className="space-y-2">
      {skills.map(skill => {
        const diag  = diagnosticScores?.[skill.id];
        const color = barColor(skill.mastery);
        const isOpen = expanded === skill.id;

        return (
          <div
            key={skill.id}
            className={`rounded-xl border transition-all duration-200 overflow-hidden ${
              isOpen ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-slate-700/50 bg-slate-800/20 hover:border-slate-600/60'
            }`}
          >
            {/* Header row — clickable */}
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-left"
              onClick={() => setExpanded(isOpen ? null : skill.id)}
            >
              {/* Expand arrow */}
              <span className={`text-slate-600 text-[10px] transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`}>▶</span>

              <span className="text-xs font-semibold text-slate-300 flex-1 truncate">{skill.name}</span>

              <div className="flex items-center gap-2 flex-shrink-0">
                {diag != null && (
                  <span className="text-[9px] text-slate-600 hidden sm:block">Diag {diag}%</span>
                )}
                <span className={`text-[9px] px-2 py-0.5 rounded-full border font-semibold capitalize ${statusBadge[skill.status] || statusBadge.locked}`}>
                  {skill.status}
                </span>
                <span className="text-xs font-black font-mono w-9 text-right" style={{ color }}>{skill.mastery}%</span>
              </div>
            </button>

            {/* Progress bar */}
            <div className="px-4 pb-2.5">
              <ProgressBar value={skill.mastery} color={color} />
            </div>

            {/* Expanded topics */}
            {isOpen && (
              <div className="px-4 pb-4 pt-1 border-t border-slate-700/40">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 mt-2">Topics Covered</p>
                {(skill.topics || []).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {(skill.topics || []).map((topic, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2.5 py-1 rounded-lg border font-medium"
                        style={{
                          backgroundColor: `${barColor(skill.mastery)}10`,
                          borderColor: `${barColor(skill.mastery)}25`,
                          color: barColor(skill.mastery),
                        }}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-600 italic">No topics listed — complete sessions to populate.</p>
                )}
                {diag != null && (
                  <p className="text-[9px] text-slate-600 mt-2">
                    Diagnostic score: <span className="font-bold text-slate-400">{diag}%</span>
                    {diag < 50 ? ' · flagged for extra practice' : diag >= 75 ? ' · strong foundation' : ' · moderate baseline'}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      <p className="text-[9px] text-slate-700 text-center pt-1 italic">Click any skill to see topics</p>
    </div>
  );
}

// ── Recent sessions table ────────────────────────────────────────────────────
function RecentSessions({ sessions }) {
  if (!sessions.length) return (
    <div className="text-slate-600 text-xs text-center py-8">
      <span className="text-3xl block mb-2 opacity-30">📝</span>
      No sessions completed yet — start Day 1!
    </div>
  );

  return (
    <div className="space-y-1.5">
      {[...sessions].reverse().slice(0, 10).map((s, i) => (
        <div key={i} className="flex items-center gap-2 rounded-xl bg-slate-800/40 px-3 py-2.5 text-xs border border-slate-700/30">
          <span className="text-slate-600 font-mono w-8 flex-shrink-0">D{s.day}</span>
          <span className="flex-1 text-slate-300 truncate font-medium">{s.skillName}</span>
          <span className="text-[9px] text-slate-600 truncate max-w-[100px] hidden sm:block">{s.strengths?.[0]?.slice(0, 30) || '—'}</span>
          <span className={`font-black font-mono w-10 text-right ${scoreColor(s.score)}`}>{s.score}%</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono" style={{
            backgroundColor: s.score >= 75 ? '#10b98115' : s.score >= 50 ? '#6366f115' : '#ef444415',
            color: s.score >= 75 ? '#10b981' : s.score >= 50 ? '#6366f1' : '#ef4444'
          }}>{s.grade}</span>
        </div>
      ))}
    </div>
  );
}

// ── Career overview panel ─────────────────────────────────────────────────────
function CareerOverview({ goal, sessions }) {
  const profiling = (() => {
    try { return JSON.parse(localStorage.getItem('skillforge:profiling') || 'null'); } catch { return null; }
  })();

  const avgScore = sessions.length
    ? Math.round(sessions.reduce((s, r) => s + r.score, 0) / sessions.length)
    : null;

  const gapLevel =
    !avgScore ? 'Not assessed yet' :
    avgScore >= 80 ? 'Minimal — strong foundation' :
    avgScore >= 60 ? 'Moderate — key areas to strengthen' :
    'Significant — structured practice needed';

  // Domain-specific resource mapper
  const getDomainResources = (domain) => {
    const resourceMap = {
      frontend_development: [
        { label: 'MDN Web Docs', url: 'https://developer.mozilla.org/', icon: '📖' },
        { label: 'React Documentation', url: 'https://react.dev/', icon: '⚛️' },
        { label: 'freeCodeCamp', url: 'https://www.freecodecamp.org/', icon: '🎓' },
        { label: 'Frontend Mentor', url: 'https://www.frontendmentor.io/', icon: '💪' },
      ],
      backend_development: [
        { label: 'Node.js Docs', url: 'https://nodejs.org/docs/', icon: '📖' },
        { label: 'Express.js Guide', url: 'https://expressjs.com/', icon: '🚂' },
        { label: 'PostgreSQL Tutorial', url: 'https://www.postgresql.org/docs/', icon: '🐘' },
        { label: 'REST API Tutorial', url: 'https://restfulapi.net/', icon: '🔌' },
      ],
      cooking: [
        { label: 'Serious Eats', url: 'https://www.seriouseats.com/', icon: '🍳' },
        { label: "America's Test Kitchen", url: 'https://www.americastestkitchen.com/', icon: '👨‍🍳' },
        { label: 'Chef Steps', url: 'https://www.chefsteps.com/', icon: '🔪' },
        { label: 'Culinary Institute', url: 'https://www.ciachef.edu/', icon: '🎓' },
      ],
      law: [
        { label: 'Indian Kanoon', url: 'https://indiankanoon.org/', icon: '⚖️' },
        { label: 'Manupatra', url: 'https://www.manupatrafast.com/', icon: '📚' },
        { label: 'SCC Online', url: 'https://www.scconline.com/', icon: '📖' },
        { label: 'Legal Services India', url: 'http://www.legalservicesindia.com/', icon: '🏛️' },
      ],
      medicine: [
        { label: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/', icon: '🏥' },
        { label: 'Medscape', url: 'https://www.medscape.com/', icon: '💊' },
        { label: 'UpToDate', url: 'https://www.uptodate.com/', icon: '📖' },
        { label: 'Khan Academy Medicine', url: 'https://www.khanacademy.org/science/health-and-medicine', icon: '🎓' },
      ],
      music: [
        { label: 'MusicTheory.net', url: 'https://www.musictheory.net/', icon: '🎵' },
        { label: 'JustinGuitar', url: 'https://www.justinguitar.com/', icon: '🎸' },
        { label: 'Berklee Online', url: 'https://online.berklee.edu/', icon: '🎓' },
        { label: 'Ultimate Guitar', url: 'https://www.ultimate-guitar.com/', icon: '🎼' },
      ],
      fashion: [
        { label: 'Vogue Runway', url: 'https://www.vogue.com/fashion-shows', icon: '👗' },
        { label: 'Fashion Institute', url: 'https://www.fitnyc.edu/', icon: '🎓' },
        { label: 'Threads Magazine', url: 'https://www.threadsmagazine.com/', icon: '🧵' },
        { label: 'Pattern Review', url: 'https://sewing.patternreview.com/', icon: '✂️' },
      ],
      machine_learning: [
        { label: 'Fast.ai', url: 'https://www.fast.ai/', icon: '🤖' },
        { label: 'Kaggle Learn', url: 'https://www.kaggle.com/learn', icon: '📊' },
        { label: 'Papers with Code', url: 'https://paperswithcode.com/', icon: '📄' },
        { label: 'Hugging Face', url: 'https://huggingface.co/learn', icon: '🤗' },
      ],
      data_science: [
        { label: 'Kaggle', url: 'https://www.kaggle.com/', icon: '📊' },
        { label: 'DataCamp', url: 'https://www.datacamp.com/', icon: '🎓' },
        { label: 'Towards Data Science', url: 'https://towardsdatascience.com/', icon: '📈' },
        { label: 'Python Data Science', url: 'https://jakevdp.github.io/PythonDataScienceHandbook/', icon: '🐍' },
      ],
    };

    // Return domain-specific resources or generic fallback
    return resourceMap[domain] || [
      { label: 'Google Scholar', url: 'https://scholar.google.com/', icon: '🔍' },
      { label: 'YouTube Learning', url: 'https://www.youtube.com/', icon: '📺' },
      { label: 'Coursera', url: 'https://www.coursera.org/', icon: '🎓' },
      { label: 'Khan Academy', url: 'https://www.khanacademy.org/', icon: '📚' },
    ];
  };

  const resources = getDomainResources(goal?.domain);

  const projects = goal?.skills?.slice(0, 4).map((s, i) => ({
    title: `${['Beginner', 'Intermediate', 'Advanced', 'Portfolio'][i] || 'Project'}: ${s.name}`,
    desc: `Build a project that applies your ${s.name} skills — covering: ${(s.topics || []).slice(0, 2).join(', ')}.`,
    level: ['🟢', '🟡', '🔴', '🏆'][i] || '🔵',
  })) || [];

  return (
    <div className="space-y-5">
      {/* Career analysis */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3">Career Analysis</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-slate-500 mb-0.5">Target Role</p>
            <p className="text-slate-200 font-bold capitalize">{goal?.profile?.targetRole || goal?.domainLabel || '—'}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-slate-500 mb-0.5">Domain</p>
            <p className="text-slate-200 font-bold">{goal?.domainLabel || '—'}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-slate-500 mb-0.5">Learner Level</p>
            <p className="text-slate-200 font-bold capitalize">{profiling?.experience || goal?.profile?.learnerLevel || '—'}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-slate-500 mb-0.5">Intensity</p>
            <p className="text-slate-200 font-bold capitalize">{goal?.profile?.intensity || '—'}</p>
          </div>
        </div>
      </div>

      {/* Skill gap */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-2">Skill Gap</h3>
        <p className="text-xs text-amber-200/80 mb-3">{gapLevel}</p>
        <div className="space-y-2">
          {(goal?.skills || []).map(s => (
            <div key={s.id} className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 w-28 truncate flex-shrink-0">{s.name}</span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(s.mastery, 2)}%`, backgroundColor: s.mastery >= 75 ? '#10b981' : s.mastery >= 50 ? '#6366f1' : '#f59e0b' }} />
              </div>
              <span className="w-8 text-right font-mono font-bold text-slate-400">{s.mastery}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested projects */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-3">Suggested Projects</h3>
        <div className="space-y-2">
          {projects.map((p, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-lg bg-slate-800/40 px-3 py-2.5 text-xs">
              <span className="text-base flex-shrink-0 mt-0.5">{p.level}</span>
              <div>
                <p className="text-slate-200 font-bold">{p.title}</p>
                <p className="text-slate-500 mt-0.5 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resources */}
      <div className="rounded-xl border border-slate-700/40 bg-slate-800/20 p-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Learning Resources</h3>
        <div className="space-y-2">
          {resources.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-lg bg-slate-800/50 px-3 py-2 text-xs hover:bg-slate-700/50 transition-colors group">
              <span className="text-base">{r.icon}</span>
              <span className="text-slate-300 group-hover:text-white transition-colors font-medium">{r.label}</span>
              <span className="ml-auto text-slate-600 group-hover:text-slate-400">↗</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── TABS ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',   label: 'Overview',   icon: '🗺️' },
  { id: 'plan',       label: 'Plan',       icon: '📅' },
  { id: 'skills',     label: 'Skills',     icon: '🌳' },
  { id: 'performance',label: 'Performance',icon: '📈' },
  { id: 'agent',      label: 'Agent Brain',icon: '🧠' },
  { id: 'history',    label: 'History',    icon: '📝' },
];

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [launching, setLaunching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  // ── ALL hooks must run BEFORE any conditional return ─────────────────────
  // useMemo here (not after the if-guards below) — avoids "Rendered more hooks
  // than during the previous render" when dashboard flips null → object.
  const avgTrend = useMemo(() => {
    const s = dashboard?.sessions || [];
    if (s.length < 4) return null;
    const half = Math.floor(s.length / 2);
    const early = s.slice(0, half).reduce((sum, r) => sum + r.score, 0) / half;
    const late  = s.slice(-half).reduce((sum, r) => sum + r.score, 0) / half;
    return Math.round(late - early);
  }, [dashboard]);

  useEffect(() => {
    const userId = localStorage.getItem('skillforge:userId');
    if (!userId) { navigate('/'); return; }
    api.getDashboard(userId)
      .then(d => { setDashboard(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [navigate]);

  const handleLaunch = () => {
    if (!todaysMission) return;
    setLaunching(true);
    setTimeout(() => { setLaunching(false); navigate(`/session/${todaysMission.day}`); }, 900);
  };

  const handleReport = async () => {
    setGenerating(true);
    try {
      const userId = localStorage.getItem('skillforge:userId');
      await api.generateReport(userId);
      navigate('/report');
    } catch (e) { setError(e.message); }
    finally { setGenerating(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <AgentThinking isVisible messages={['Loading dashboard…', 'Fetching your progress…', 'Syncing agent state…']} />
    </div>
  );
  if (error) return <div className="p-8 text-red-400 text-center text-sm">{error}</div>;
  if (!dashboard) return null;

  const { goal, learningPlan, sessions, stats, adaptations, diagnosticScores, agentDecisions = [], aiPowered } = dashboard;
  const completed = learningPlan.filter(d => d.completed).length;
  const total = learningPlan.length;
  const completionPct = total ? Math.round((completed / total) * 100) : 0;
  const todaysMission = learningPlan.find(d => !d.completed);

  return (
    <div className="min-h-screen px-4 py-6 max-w-6xl mx-auto space-y-5">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl flex-shrink-0">{goal.domainIcon || '🎯'}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Goal</p>
              </div>
              <p className="text-lg font-black text-white leading-tight truncate max-w-xl">{goal.goalText}</p>
              <p className="text-xs text-indigo-300 mt-0.5 font-semibold">{goal.domainLabel}</p>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Overall Progress</p>
            <p className="text-2xl font-black text-slate-100 font-mono">{completionPct}%</p>
            <p className="text-[10px] text-slate-500">{completed} / {total} days</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <ProgressBar value={completionPct} color="#6366f1" />
        </div>

        {/* Stats row */}
        <div className="flex gap-3 flex-wrap">
          <Stat label="Avg Score"   value={`${stats.avgScore}%`}    color={scoreColor(stats.avgScore)}   icon="📊" />
          <Stat label="Best Score"  value={`${stats.bestScore}%`}   color={scoreColor(stats.bestScore)}  icon="🏆" />
          <Stat label="Sessions"    value={stats.totalSessions}      color="text-indigo-400"              icon="✅" />
          <Stat label="Adaptations" value={adaptations.length}       color="text-amber-400"               icon="⚡" sub="by agent" />
          {avgTrend !== null && (
            <Stat
              label="Trend"
              value={`${avgTrend > 0 ? '+' : ''}${avgTrend}%`}
              color={avgTrend >= 0 ? 'text-emerald-400' : 'text-red-400'}
              icon={avgTrend >= 0 ? '📈' : '📉'}
              sub="vs early sessions"
            />
          )}
        </div>
      </div>

      {/* ── TODAY'S MISSION ─────────────────────────────────────────────── */}
      <MissionCard
        planDay={todaysMission}
        adaptations={adaptations}
        onLaunch={handleLaunch}
        loading={launching}
      />

      {/* ── TABBED SECTION ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-slate-700/50 bg-slate-900/80 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'text-indigo-300 border-indigo-500 bg-indigo-500/5'
                  : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <CareerOverview goal={goal} sessions={sessions} />
          )}

          {/* PLAN TAB */}
          {activeTab === 'plan' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Learning Plan</h3>
                <span className="text-[10px] text-slate-600">{completed}/{total} completed</span>
              </div>
              <PlanTimeline learningPlan={learningPlan} navigate={navigate} />
            </div>
          )}

          {/* SKILLS TAB */}
          {activeTab === 'skills' && (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Skill Mastery</h3>
              <SkillBars skills={goal.skills || []} diagnosticScores={diagnosticScores} />
              {/* Skill Digital Twin below */}
              {sessions.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-800">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Digital Twin</p>
                  <SkillDigitalTwin skills={goal.skills} sessions={sessions} diagnosticScores={diagnosticScores} />
                </div>
              )}
            </div>
          )}

          {/* PERFORMANCE TAB */}
          {activeTab === 'performance' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Score Trend</h3>
                <ScoreChart sessions={sessions} />
              </div>
              <div className="border-t border-slate-800 pt-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Mastery Forecast</h3>
                <PredictiveMasteryForecast sessions={sessions} skills={goal.skills} />
              </div>
              {/* Learner profile */}
              <div className="border-t border-slate-800 pt-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Learner Profile</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    ['Level', goal.profile?.learnerLevel || '—'],
                    ['Intensity', goal.profile?.intensity || '—'],
                    ['Target Role', goal.profile?.targetRole || '—'],
                    ['Tools', (goal.profile?.detectedTools || []).join(', ') || '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 bg-slate-800/40 rounded-lg px-3 py-2">
                      <span className="text-slate-600 font-semibold">{k}</span>
                      <span className="text-slate-300 font-bold capitalize text-right truncate max-w-[120px]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AGENT BRAIN TAB */}
          {activeTab === 'agent' && (
            <div className="space-y-4">
              {/* Pipeline overview */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-4">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">7-Agent Pipeline</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { icon: '🎯', name: 'GoalAgent',       color: '#6366F1' },
                    { icon: '🌳', name: 'DecomposeAgent',  color: '#8B5CF6' },
                    { icon: '📋', name: 'DiagnosticAgent', color: '#06B6D4' },
                    { icon: '📊', name: 'ScoringAgent',    color: '#0EA5E9' },
                    { icon: '📅', name: 'CurriculumAgent', color: '#14B8A6' },
                    { icon: '✅', name: 'EvaluatorAgent',  color: '#10B981' },
                    { icon: '⚡', name: 'AdaptorAgent',    color: '#F59E0B' },
                  ].map((a, i) => (
                    <div key={a.name} className="flex items-center gap-1">
                      <div
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border text-[10px] font-semibold"
                        style={{ backgroundColor: `${a.color}10`, borderColor: `${a.color}25`, color: a.color }}
                      >
                        <span>{a.icon}</span>
                        <span className="hidden sm:inline">{a.name}</span>
                      </div>
                      {i < 6 && <span className="text-slate-700 text-xs">→</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Decision log */}
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Decision Log · {agentDecisions.length} entries
                </p>
                <div className="h-[380px] overflow-hidden rounded-xl border border-slate-700/50">
                  <AgentBrain decisions={agentDecisions} isThinking={false} />
                </div>
              </div>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Session History</h3>
                <span className="text-[10px] text-slate-600">{sessions.length} sessions</span>
              </div>
              <RecentSessions sessions={sessions} />
            </div>
          )}

        </div>
      </div>

      {/* ── GENERATE REPORT ─────────────────────────────────────────────── */}
      <button
        onClick={handleReport}
        disabled={generating || sessions.length === 0}
        className={`w-full py-4 rounded-2xl font-black text-sm transition-all ${
          generating || sessions.length === 0
            ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white hover:shadow-xl hover:shadow-emerald-500/20 active:scale-[0.99]'
        }`}
      >
        {generating ? '⏳ Generating AI Report…'
          : sessions.length === 0 ? '📜 Complete sessions to unlock report'
          : '📜 Generate Competency Report →'}
      </button>

    </div>
  );
}
