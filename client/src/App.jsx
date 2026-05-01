import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';

const Landing = lazy(() => import('./pages/Landing.jsx'));
const Diagnostic = lazy(() => import('./pages/Diagnostic.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Session = lazy(() => import('./pages/Session.jsx'));
const Report = lazy(() => import('./pages/Report.jsx'));

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC]">
        <Navbar />
        <Suspense fallback={<div className="mx-auto max-w-4xl px-6 py-14 text-slate-300">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/diagnostic" element={<Diagnostic />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/session/:day" element={<Session />} />
            <Route path="/report" element={<Report />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}

export default App;
