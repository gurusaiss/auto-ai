import React, { useEffect, useRef, useState } from 'react';

const AGENT_NAMES = {
  goal_analysis:       { name: 'GoalAgent',       color: '#6366F1', icon: '🎯' },
  skill_tree:          { name: 'DecomposeAgent',   color: '#8B5CF6', icon: '🌳' },
  diagnostic:          { name: 'DiagnosticAgent',  color: '#06B6D4', icon: '📋' },
  diagnostic_complete: { name: 'ScoringAgent',     color: '#0EA5E9', icon: '📊' },
  plan_built:          { name: 'CurriculumAgent',  color: '#14B8A6', icon: '📅' },
  adaptation:          { name: 'AdaptorAgent',     color: '#F59E0B', icon: '⚡' },
  session_complete:    { name: 'EvaluatorAgent',   color: '#10B981', icon: '✅' },
};

function TypewriterText({ text, speed = 18 }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const idx = useRef(0);

  useEffect(() => {
    idx.current = 0;
    setDisplayed('');
    setDone(false);
    const timer = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1));
        idx.current++;
      } else {
        setDone(true);
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && <span className="inline-block w-0.5 h-3 bg-current ml-0.5 animate-pulse" />}
    </span>
  );
}

function AgentBubble({ decision, index, isLatest }) {
  const [expanded, setExpanded] = useState(false);
  const meta = AGENT_NAMES[decision.type] || { name: 'Agent', color: '#6366F1', icon: '🤖' };
  const ts = new Date(decision.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div
      className="relative pl-8"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Timeline dot */}
      <div
        className="absolute left-2 top-3 w-3 h-3 rounded-full border-2 border-[#0F172A] z-10"
        style={{ backgroundColor: meta.color }}
      />
      {/* Connecting line */}
      {index > 0 && (
        <div
          className="absolute left-[14px] top-0 w-px h-3"
          style={{ backgroundColor: meta.color, opacity: 0.3 }}
        />
      )}

      <div
        className="rounded-xl border p-3 cursor-pointer transition-all hover:brightness-110 mb-2"
        style={{ borderColor: `${meta.color}30`, backgroundColor: `${meta.color}08` }}
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start gap-2">
          <span className="text-sm flex-shrink-0">{meta.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span
                className="text-xs font-bold"
                style={{ color: meta.color }}
              >
                {meta.name}
              </span>
              <span className="text-[10px] text-slate-600 font-mono">{ts}</span>
            </div>

            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed font-medium">
              {decision.title}
            </p>

            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              {isLatest
                ? <TypewriterText text={decision.detail} />
                : decision.detail
              }
            </p>

            {expanded && decision.reasoning && (
              <div className="mt-2 pt-2 border-t border-slate-700/40">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Internal Reasoning</span>
                </div>
                <p className="text-[10px] text-slate-400 italic leading-relaxed">
                  {isLatest
                    ? <TypewriterText text={`"${decision.reasoning}"`} speed={8} />
                    : `"${decision.reasoning}"`
                  }
                </p>
              </div>
            )}

            <div className="mt-1.5 flex items-center justify-between">
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
              >
                {decision.type.replace(/_/g, ' ')}
              </span>
              <button className="text-[9px] text-slate-600 hover:text-slate-400">
                {expanded ? '▲ hide reasoning' : '▼ show reasoning'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LivePulse() {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-widest">Live</span>
    </div>
  );
}

export default function AgentBrain({ decisions = [], isThinking = false, thinkingMessage = '' }) {
  const scrollRef = useRef(null);
  const [activeAgents, setActiveAgents] = useState(new Set());

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // Derive active agents from decisions
    const active = new Set(decisions.slice(-3).map(d => d.type));
    setActiveAgents(active);
  }, [decisions]);

  const agentList = Object.entries(AGENT_NAMES);

  return (
    <div className="rounded-xl border border-slate-700/50 bg-[#080E1A] overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-sm">🧠</div>
          <div>
            <p className="text-xs font-black text-slate-200 uppercase tracking-wider">Agent Brain</p>
            <p className="text-[9px] text-slate-500">Multi-Agent Reasoning System</p>
          </div>
        </div>
        <LivePulse />
      </div>

      {/* Agent roster */}
      <div className="px-3 py-2 border-b border-slate-800/60 bg-slate-900/30">
        <div className="flex flex-wrap gap-1.5">
          {agentList.map(([type, meta]) => {
            const isActive = activeAgents.has(type);
            return (
              <div
                key={type}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold transition-all duration-500"
                style={{
                  backgroundColor: isActive ? `${meta.color}20` : 'rgba(255,255,255,0.03)',
                  color: isActive ? meta.color : '#475569',
                  borderWidth: 1,
                  borderColor: isActive ? `${meta.color}40` : '#1E293B',
                  boxShadow: isActive ? `0 0 8px ${meta.color}30` : 'none',
                }}
              >
                <span>{meta.icon}</span>
                <span>{meta.name}</span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Decision stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-1"
        style={{ minHeight: 0 }}
      >
        {decisions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="text-3xl mb-2 opacity-30">🧠</div>
            <p className="text-xs text-slate-600">Agent decisions will appear here as you progress.</p>
          </div>
        ) : (
          decisions.map((d, i) => (
            <AgentBubble
              key={d.id ?? i}
              decision={d}
              index={i}
              isLatest={i === decisions.length - 1}
            />
          ))
        )}

        {/* Thinking indicator */}
        {isThinking && (
          <div className="flex items-center gap-2 pl-8 py-2">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                  style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }}
                />
              ))}
            </div>
            <span className="text-xs text-slate-500 italic">
              {thinkingMessage || 'Agent is reasoning...'}
            </span>
          </div>
        )}
      </div>

      {/* Stats footer */}
      <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/40">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-600">{decisions.length} decisions logged</span>
          <span className="text-slate-600">
            {Object.values(AGENT_NAMES).length} agents active
          </span>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
