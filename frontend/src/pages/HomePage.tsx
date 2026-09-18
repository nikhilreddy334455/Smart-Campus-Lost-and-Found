import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchItems, fetchStats, seedSampleData } from '../lib/api';
import { Item, Stats } from '../lib/types';
import { ItemCard } from '../components/ItemCard';
import { Sparkles, PlusCircle, ShieldCheck, Search, ArrowRight, Layers, AlertCircle, Database } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'lost' | 'found'>('all');
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, statsData] = await Promise.all([
        fetchItems(),
        fetchStats().catch(() => null)
      ]);
      setItems(itemsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load homepage data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedSampleData();
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSeeding(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (activeTab === 'all') return true;
    return item.report_type === activeTab;
  });

  return (
    <div className="space-y-12">
      {/* Hero Section with Call To Action */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-2xl p-8 sm:p-12">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Autonomous AI Multimodal Reconnection</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Lost something on campus? <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              Let Gemini AI match it for you.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Our campus recovery system uses Gemini 2.5 Flash to automatically compare photos, unique distinguishing marks, time logs, and building locations—connecting lost belongings with their owners in seconds.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/report/lost"
              className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all duration-200 flex items-center gap-2 group"
            >
              <PlusCircle className="w-4 h-4" />
              <span>I Lost An Item</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/report/found"
              className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 transition-all duration-200 flex items-center gap-2 group"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>I Found An Item</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/search"
              className="px-5 py-3.5 rounded-2xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span>Browse All Records</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Campus Quick Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>TOTAL REPORTS</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {stats?.total ?? items.length}
          </div>
          <p className="text-xs text-slate-400 mt-1">Active items logged in campus registry</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-rose-400 text-xs font-semibold mb-2">
            <span>LOST ITEMS</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-rose-400">
            {stats?.lost ?? items.filter(i => i.report_type === 'lost').length}
          </div>
          <p className="text-xs text-slate-400 mt-1">Awaiting owner recovery</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold mb-2">
            <span>FOUND ITEMS</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {stats?.found ?? items.filter(i => i.report_type === 'found').length}
          </div>
          <p className="text-xs text-slate-400 mt-1">Safely reported across campus</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-indigo-400 text-xs font-semibold mb-2">
            <span>AI MATCHING</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-indigo-400">
            Active
          </div>
          <p className="text-xs text-slate-400 mt-1">Gemini 2.5 Flash analyzing pairs</p>
        </div>
      </section>

      {/* Recent Items Feed */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Recent Campus Reports</h2>
            <p className="text-xs sm:text-sm text-slate-400">Latest lost and found items reported by students and staff</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-xl bg-slate-900 border border-slate-800 flex gap-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('lost')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'lost'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Lost
              </button>
              <button
                onClick={() => setActiveTab('found')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'found'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Found
              </button>
            </div>

            <button
              onClick={handleSeed}
              disabled={seeding}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
              title="Re-seed sample campus items"
            >
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">{seeding ? 'Seeding...' : 'Seed Data'}</span>
            </button>
          </div>
        </div>

        {/* Item Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-80 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <p className="text-slate-400 text-sm">No items found matching this filter.</p>
            <button
              onClick={handleSeed}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
            >
              Seed Sample Demo Items
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
