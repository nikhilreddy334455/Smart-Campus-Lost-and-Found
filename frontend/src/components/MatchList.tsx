import React from 'react';
import { Link } from 'react-router-dom';
import { MatchItem } from '../lib/types';
import { MatchScoreBadge } from './MatchScoreBadge';
import { Brain, MapPin, Calendar, Mail, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface MatchListProps {
  matches: MatchItem[];
  loading?: boolean;
  onRefresh?: () => void;
}

export const MatchList: React.FC<MatchListProps> = ({ matches, loading = false, onRefresh }) => {
  if (loading) {
    return (
      <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="w-10 h-10 mx-auto border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-300">
          Gemini 2.5 Flash is analyzing visual characteristics and location logic...
        </p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="p-10 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400">
          <Brain className="w-7 h-7 text-slate-500" />
        </div>
        <h4 className="text-base font-semibold text-white">No Potential Matches Identified Yet</h4>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Our AI hasn't found high-confidence candidate reports yet. As more campus reports are submitted, new matches will automatically appear here.
        </p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Re-run AI Matching Now</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {matches.map((match, idx) => {
        const item = match.matched_item;
        let formattedDate = 'Recently';
        if (item?.event_time) {
          try {
            formattedDate = format(parseISO(item.event_time), 'MMM d, yyyy • h:mm a');
          } catch {
            formattedDate = item.event_time;
          }
        }

        return (
          <div
            key={match.id}
            className={`p-6 rounded-2xl border transition-all duration-300 ${
              idx === 0 && match.confidence_score >= 80
                ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-emerald-500/50 shadow-2xl shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-xl'
            }`}
          >
            {/* Header with Rank & Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold">
                  #{idx + 1}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {item?.report_type === 'found' ? 'Found Candidate' : 'Lost Candidate'}
                </span>
                {idx === 0 && match.confidence_score >= 80 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Top Probable Match
                  </span>
                )}
              </div>

              <MatchScoreBadge score={match.confidence_score} size="md" />
            </div>

            {/* AI Logical Explanation Box */}
            <div className="my-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 relative">
              <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-blue-400">
                <Brain className="w-4 h-4" />
                <span>Gemini Multimodal Reasoning & Evidence:</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed italic">
                "{match.explanation}"
              </p>
            </div>

            {/* Candidate Item Summary */}
            {item && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center pt-2">
                {/* Image */}
                <div className="sm:col-span-1 h-28 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                </div>

                {/* Details */}
                <div className="sm:col-span-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-white text-base hover:text-blue-400 transition-colors">
                      {item.title}
                    </h5>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {item.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      {item.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      {formattedDate}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-indigo-400" />
                      {item.contact_info}
                    </span>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Link
                      to={`/item/${item.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <span>Inspect Full Candidate Report</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
