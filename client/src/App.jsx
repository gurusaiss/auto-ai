import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const Landing    = lazy(() => import('./pages/Landing.jsx'));
const Profiling  = lazy(() => import('./pages/Profiling.jsx'));
const Diagnostic = lazy(() => import('./pages/Diagnostic.jsx'));
const Dashboard  = lazy(() => import('./pages/Dashboard.jsx'));
const Session    = lazy(() => import('./pages/Session.jsx'));
const Report     = lazy(() => import('./pages/Report.jsx'));

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC]">
          <Navbar />
          <Suspense fallback={
            <div className="mx-auto max-w-4xl px-6 py-14 text-slate-400 text-center">
              <div className="animate-pulse text-indigo-400 text-2xl mb-2">⟳</div>
              Loading...
            </div>
          }>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/profiling" element={<Profiling />} />
              <Route path="/diagnostic" element={<Diagnostic />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/session/:day" element={<Session />} />
              <Route path="/report" element={<Report />} />
            </Routes>
          </Suspense>
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
