import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchItem, fetchItemMatches, triggerItemMatch } from '../lib/api';
import { Item, MatchItem } from '../lib/types';
import { MatchList } from '../components/MatchList';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Mail,
  Sparkles,
  Tag,
  AlertTriangle,
  RefreshCw,
  Share2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingInProgress, setMatchingInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadItemAndMatches = async (itemId: string) => {
    try {
      setLoading(true);
      setError(null);
      const [itemData, matchesData] = await Promise.all([
        fetchItem(itemId),
        fetchItemMatches(itemId).catch(() => [])
      ]);
      setItem(itemData);
      setMatches(matchesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Item not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadItemAndMatches(id);
    }
  }, [id]);

  const handleTriggerReMatch = async () => {
    if (!id) return;
    try {
      setMatchingInProgress(true);
      const result = await triggerItemMatch(id);
      if (result.matches) {
        setMatches(result.matches);
      }
    } catch (err) {
      console.error('Re-matching failed:', err);
    } finally {
      setMatchingInProgress(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 mx-auto border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading item report and AI matches...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Item Not Found</h2>
        <p className="text-slate-400 text-sm">{error || 'The requested item could not be retrieved.'}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  const isLost = item.report_type === 'lost';
  let formattedDate = 'Recently';
  try {
    formattedDate = format(parseISO(item.event_time), 'EEEE, MMMM d, yyyy • h:mm a');
  } catch {
    formattedDate = item.event_time;
  }

  return (
    <div className="space-y-10">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Campus Registry</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? 'Link Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Main Item Detail Hero Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left / Top: Multimodal Image */}
        <div className="lg:col-span-5 relative bg-slate-950 aspect-[4/3] lg:aspect-auto flex items-center justify-center overflow-hidden">
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-4 left-4 flex gap-2">
            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-md border ${
                isLost
                  ? 'bg-rose-500/90 text-white border-rose-400/30'
                  : 'bg-emerald-600/90 text-white border-emerald-400/30'
              }`}
            >
              {isLost ? 'Lost Item' : 'Found Item'}
            </span>
            <span className="px-3 py-1 rounded-xl text-xs font-medium bg-slate-900/80 text-slate-200 backdrop-blur-md border border-slate-700/60 flex items-center gap-1">
              <Tag className="w-3 h-3 text-blue-400" />
              {item.category}
            </span>
          </div>
        </div>

        {/* Right / Bottom: Item Metadata & Actions */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Campus Registry ID: <span className="font-mono text-slate-300">{item.id.slice(0, 8)}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-950 text-blue-400 border border-blue-500/30">
                {item.status === 'resolved' ? 'Resolved' : 'Active Report'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {item.title}
            </h1>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-sm text-slate-200 leading-relaxed">
              <p className="font-semibold text-xs text-slate-400 mb-1">Detailed Description:</p>
              {item.description}
            </div>

            {/* Location, Timeline, and Contact grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                  <MapPin className="w-4 h-4" />
                  <span>Campus Location</span>
                </div>
                <p className="text-slate-200 font-medium">{item.location}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                  <Calendar className="w-4 h-4" />
                  <span>Incident Date & Time</span>
                </div>
                <p className="text-slate-200 font-medium">{formattedDate}</p>
              </div>
            </div>
          </div>

          {/* Contact Box */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Reporter Contact</p>
                <p className="text-sm font-semibold text-white">{item.contact_info}</p>
              </div>
            </div>

            <a
              href={`mailto:${item.contact_info}?subject=Campus Lost & Found Inquiry: ${encodeURIComponent(item.title)}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Reporter</span>
            </a>
          </div>
        </div>
      </div>

      {/* AI MATCHING ENGINE DASHBOARD SECTION */}
      <section className="space-y-6">
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
              <h2 className="text-xl font-extrabold text-white">
                Top Potential AI Matches
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {matches.length} Candidates Analyzed
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Evaluated by Gemini 2.5 Flash comparing multimodal images, descriptions, spatial landmarks, and timestamps.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTriggerReMatch}
            disabled={matchingInProgress}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${matchingInProgress ? 'animate-spin' : ''}`} />
            <span>{matchingInProgress ? 'Analyzing Database...' : 'Re-run AI Matching'}</span>
          </button>
        </div>

        {/* Matches Feed */}
        <MatchList
          matches={matches}
          loading={matchingInProgress}
          onRefresh={handleTriggerReMatch}
        />
      </section>
    </div>
  );
};
