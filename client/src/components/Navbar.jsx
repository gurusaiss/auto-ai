import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();
  const hideNavLinks = location.pathname === '/';

  return (
    <header className="sticky top-0 z-20 border-b border-[#1E293B] bg-[#0F172A]/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600/20 text-xl">🧠</div>
          <div>
            <p className="font-semibold text-white">SkillForge AI</p>
            <p className="text-xs text-slate-400">Autonomous Skill Acquisition Agent</p>
          </div>
        </Link>
        {!hideNavLinks && (
          <nav className="flex items-center gap-5 text-sm text-slate-300">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/report">Report</Link>
          </nav>
        )}
      </div>
    </header>
  );
}

export default Navbar;
