import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../utils/api.js';
import AgentThinking from '../components/AgentThinking.jsx';

const placeholders = [
  'I want to become a backend developer...',
  'I want to learn machine learning...',
  'I want to master UI/UX design...',
  'I want to understand data science...'
];

const features = [
  ['🔍 Diagnose', 'Find knowledge gaps and current skill level.'],
  ['📋 Plan', 'Build a day-by-day roadmap around weak spots.'],
  ['⚔️ Practice', 'Launch adaptive sessions with real evaluation.'],
  ['📜 Certify', 'Generate a competency report judges can trust.']
];

function Landing() {
  const navigate = useNavigate();
  const [goalText, setGoalText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadDemo = () => {
    localStorage.setItem('skillforge:userId', 'demo-react-fullstack');
    navigate('/dashboard');
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % placeholders.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api.createGoal({ goalText });
      localStorage.setItem('skillforge:userId', data.userId);
      localStorage.setItem('skillforge:goalResponse', JSON.stringify(data));
      navigate('/diagnostic', { state: data });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-sm uppercase tracking-[0.35em] text-indigo-300">
            HackAP Agentic AI
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 max-w-3xl text-5xl font-extrabold leading-tight text-white md:text-6xl"
          >
            Master Any Skill. Autonomously.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 max-w-2xl text-lg text-slate-300"
          >
            SkillForge diagnoses your gaps, builds a personalized roadmap, runs practice sessions,
            and certifies progress without waiting for human instruction.
          </motion.p>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={loadDemo}
              className="flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-5 py-2.5 text-sm font-semibold text-indigo-300 transition-all hover:bg-indigo-500/20 hover:border-indigo-400"
            >
              🎬 Load Demo Session
            </button>
            <span className="text-xs text-slate-500">See a completed React learning journey instantly</span>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 rounded-[28px] border border-[#334155] bg-[#1E293B]/90 p-6 shadow-2xl">
            <textarea
              value={goalText}
              onChange={(event) => setGoalText(event.target.value)}
              placeholder={placeholders[placeholderIndex]}
              className="min-h-[150px] w-full rounded-xl border border-[#334155] bg-[#0F172A] p-4 text-[#F8FAFC] placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-400">Agent flow: Diagnose → Plan → Practice → Certify</p>
              <button
                type="submit"
                disabled={goalText.trim().length < 5 || loading}
                className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-700"
              >
                Start My AI Journey →
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          </form>
        </div>

        <div className="space-y-4">
          {loading ? (
            <AgentThinking
              isVisible={loading}
              messages={['Analyzing your goal...', 'Generating your skill tree...', 'Preparing diagnostic quiz...']}
            />
          ) : (
            features.map(([title, description]) => (
              <div key={title} className="bg-[#1E293B] rounded-2xl p-6 border border-[#334155] shadow-xl">
                <p className="text-lg font-semibold text-white">{title}</p>
                <p className="mt-2 text-slate-400">{description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Landing;
