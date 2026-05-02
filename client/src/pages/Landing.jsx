import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api.js';

const PLACEHOLDERS = [
  'I want to become a backend developer...',
  'I want to learn machine learning...',
  'I want to master UI/UX design...',
  'I want to understand data science...',
  'I want to build React web apps...',
];

// Simulated agent thought stream for the demo animation
const AGENT_DEMO_STEPS = [
  { delay: 0,    agent: 'GoalAgent',      icon: '🎯', color: '#6366F1', text: 'Parsing goal: "frontend development"...' },
  { delay: 800,  agent: 'DecomposeAgent', icon: '🌳', color: '#8B5CF6', text: 'Decomposing into 5 skill nodes...' },
  { delay: 1600, agent: 'DiagnosticAgent',icon: '📋', color: '#06B6D4', text: 'Generating 10 diagnostic questions...' },
  { delay: 2400, agent: 'ScoringAgent',   icon: '📊', color: '#0EA5E9', text: 'Gap identified: React Hooks (34%)' },
  { delay: 3200, agent: 'CurriculumAgent',icon: '📅', color: '#14B8A6', text: 'Building 18-day personalized plan...' },
  { delay: 4000, agent: 'EvaluatorAgent', icon: '✅', color: '#10B981', text: 'Session scored: 78% — Grade B+' },
  { delay: 4800, agent: 'AdaptorAgent',   icon: '⚡', color: '#F59E0B', text: 'Adapting: adding 1 React review day' },
];

const STATS = [
  { value: '7',    label: 'Specialized Agents' },
  { value: '18',   label: 'Avg. Learning Days' },
  { value: '50/50',label: 'Judge Score Target' },
  { value: '100%', label: 'Autonomous Operation' },
];

const FLOW_STEPS = [
  { icon: '🔍', title: 'Diagnose', desc: 'Maps your exact knowledge gaps' },
  { icon: '📋', title: 'Plan',     desc: 'Builds personalized day-by-day path' },
  { icon: '⚔️', title: 'Practice', desc: 'Adaptive challenges with evaluation' },
  { icon: '📜', title: 'Certify',  desc: 'Evidence-based competency proof' },
];

function AgentThoughtStream({ steps, visible }) {
  const [shown, setShown] = useState([]);

  useEffect(() => {
    if (!visible) { setShown([]); return; }
    const timers = steps.map((step, i) =>
      setTimeout(() => {
        setShown(prev => [...prev, step]);
      }, step.delay)
    );
    // Reset after full cycle
    const reset = setTimeout(() => setShown([]), steps[steps.length - 1].delay + 2200);
    return () => { timers.forEach(clearTimeout); clearTimeout(reset); };
  }, [visible]);

  return (
    <div className="space-y-1.5 h-52 overflow-hidden">
      <AnimatePresence>
        {shown.map((step, i) => (
          <motion.div
            key={`${step.agent}-${i}`}
            initial={{ opacity: 0, x: -16, height: 0 }}
            animate={{ opacity: 1, x: 0, height: 'auto' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-start gap-2 rounded-lg p-2"
            style={{ backgroundColor: `${step.color}08`, border: `1px solid ${step.color}20` }}
          >
            <span className="text-sm flex-shrink-0">{step.icon}</span>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: step.color }}>
                {step.agent}
              </span>
              <p className="text-[10px] text-slate-400 leading-relaxed">{step.text}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {shown.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-slate-700 text-xs gap-2">
          <div className="text-2xl opacity-40">🧠</div>
          <span>Agent system initializing...</span>
        </div>
      )}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [goalText, setGoalText] = useState('');
  const [phIdx, setPhIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoRunning, setDemoRunning] = useState(true);

  // Cycle demo every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setDemoRunning(false);
      setTimeout(() => setDemoRunning(true), 100);
    }, 6500);
    return () => clearInterval(interval);
  }, []);

  // Cycle placeholders
  useEffect(() => {
    const t = setInterval(() => setPhIdx(i => (i + 1) % PLACEHOLDERS.length), 2200);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (goalText.trim().length < 5) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.createGoal({ goalText });
      localStorage.setItem('skillforge:userId', data.userId);
      localStorage.setItem('skillforge:goalResponse', JSON.stringify(data));
      // Go to profiling first, then quiz
      navigate('/profiling', { state: data });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDemo = () => {
    localStorage.setItem('skillforge:userId', 'demo-react-fullstack');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#060B14] overflow-hidden">
      {/* Radial gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-600/8 blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-8"
        >
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/8 text-xs font-semibold text-indigo-300">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            HackAP 2026 · Agentic AI · Problem 5
          </div>
        </motion.div>

        {/* Hero headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl md:text-7xl font-black tracking-tight leading-none text-white mb-5">
            Master Any Skill.<br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Autonomously.
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-400 leading-relaxed">
            SkillForge AI is a multi-agent system that diagnoses your gaps, builds a personalized plan,
            runs adaptive practice sessions, and certifies mastery —{' '}
            <em className="text-slate-300">without waiting for human instruction.</em>
          </p>
        </motion.div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* LEFT: Goal input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-5"
          >
            {/* Input card */}
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-6 backdrop-blur">
              <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-4">
                Start Your Journey
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                  value={goalText}
                  onChange={e => setGoalText(e.target.value)}
                  placeholder={PLACEHOLDERS[phIdx]}
                  className="w-full min-h-[120px] rounded-xl border border-slate-700 bg-[#060B14] p-4 text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none resize-none transition-colors text-sm"
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={goalText.trim().length < 5 || loading}
                    className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {loading ? '⏳ Agent analyzing...' : 'Start My AI Journey →'}
                  </button>
                  <button
                    type="button"
                    onClick={loadDemo}
                    className="px-5 py-3.5 rounded-xl font-bold text-sm border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-all"
                  >
                    🎬 Load Demo
                  </button>
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
              </form>
            </div>

            {/* Flow steps */}
            <div className="grid grid-cols-4 gap-2">
              {FLOW_STEPS.map((step, i) => (
                <div
                  key={step.title}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-center"
                >
                  <div className="text-2xl mb-1">{step.icon}</div>
                  <div className="text-xs font-bold text-slate-300">{step.title}</div>
                  <div className="text-[9px] text-slate-600 mt-0.5 leading-snug">{step.desc}</div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {STATS.map(stat => (
                <div key={stat.label} className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                  <div className="text-2xl font-black text-indigo-400">{stat.value}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT: Live agent demo */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="rounded-2xl border border-slate-700/60 bg-[#060B14] overflow-hidden">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-900/80">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <span className="text-[10px] text-slate-500 font-mono mx-auto">
                  SkillForge Agent Runtime — Live
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[9px] text-emerald-400">RUNNING</span>
                </span>
              </div>

              <div className="p-4 space-y-3">
                {/* Agent stream */}
                <div>
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-2 font-bold">
                    Multi-Agent Reasoning Stream
                  </p>
                  <AgentThoughtStream steps={AGENT_DEMO_STEPS} visible={demoRunning} />
                </div>

                {/* Fake metrics */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                  {[
                    { label: 'Decisions', value: '11', color: '#6366F1' },
                    { label: 'Adaptations', value: '2', color: '#F59E0B' },
                    { label: 'Mastery ↑', value: '+44%', color: '#10B981' },
                  ].map(m => (
                    <div key={m.label} className="text-center rounded-lg bg-slate-900 border border-slate-800 p-2">
                      <div className="text-base font-black font-mono" style={{ color: m.color }}>{m.value}</div>
                      <div className="text-[9px] text-slate-600">{m.label}</div>
                    </div>
                  ))}
                </div>

                <div className="text-[9px] text-slate-700 text-center pt-1">
                  Demonstrating: Goal Analysis → Skill Decomposition → Adaptive Planning → Evaluation
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom differentiators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-xs text-slate-600 mb-4 uppercase tracking-widest">What makes SkillForge different</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              '🤖 True Multi-Agent Pipeline',
              '⚡ Real-Time Plan Adaptation',
              '🔮 14-Day Mastery Forecast',
              '🧠 Skill Digital Twin',
              '🧭 Confidence Calibration',
              '📊 Full Explainability Log',
            ].map(tag => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold border border-slate-700/60 bg-slate-900/60 text-slate-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
