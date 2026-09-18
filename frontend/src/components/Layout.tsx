import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, PlusCircle, Search, ShieldCheck, Sparkles, MapPin } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Campus Alert / AI Banner */}
      <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-slate-900/60 border-b border-blue-500/20 px-4 py-2 text-center text-xs font-medium text-blue-200 flex items-center justify-center gap-2 backdrop-blur-md">
        <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
        <span>Powered by Gemini 2.5 Flash Multimodal Reasoning • Smart Campus Lost & Found System</span>
      </div>

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-50 bg-slate-900/85 backdrop-blur-xl border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent flex items-center gap-1.5">
                CampusFind <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">AI</span>
              </span>
              <p className="text-[10px] tracking-wider uppercase text-slate-400 font-medium">Smart Recovery Hub</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive('/')
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/search"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                isActive('/search')
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Search className="w-4 h-4" />
              Search & Browse
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/report/lost"
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 border ${
                isActive('/report/lost')
                  ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500 hover:text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Lost</span>
            </Link>

            <Link
              to="/report/found"
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 border ${
                isActive('/report/found')
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-600 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Report Found</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/90 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span>Campus Student Affairs & Security Services</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Automated AI Matching Engine</span>
            <span>•</span>
            <span>gemini-2.5-flash</span>
            <span>•</span>
            <span>PostgreSQL Active Storage</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
