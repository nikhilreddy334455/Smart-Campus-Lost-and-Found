import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Tag, ArrowRight } from 'lucide-react';
import { Item } from '../lib/types';
import { format, parseISO } from 'date-fns';

interface ItemCardProps {
  item: Item;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const isLost = item.report_type === 'lost';
  
  let formattedDate = 'Recently';
  try {
    formattedDate = format(parseISO(item.event_time), 'MMM d, yyyy • h:mm a');
  } catch {
    formattedDate = item.event_time;
  }

  return (
    <div className="group relative bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col">
      {/* Image Container with Badges */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
        <img
          src={item.image_url}
          alt={item.title}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            // Fallback image if broken URL
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex gap-2 items-center">
          <span
            className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg shadow-md backdrop-blur-md border ${
              isLost
                ? 'bg-rose-500/90 text-white border-rose-400/30'
                : 'bg-emerald-600/90 text-white border-emerald-400/30'
            }`}
          >
            {isLost ? 'Lost Item' : 'Found Item'}
          </span>
          <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-900/80 text-slate-300 backdrop-blur-md border border-slate-700/50 flex items-center gap-1">
            <Tag className="w-3 h-3 text-blue-400" />
            {item.category}
          </span>
        </div>

        {/* Status Indicator */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-2 py-0.5 text-xs rounded-full font-medium ${
              item.status === 'resolved'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                : 'bg-blue-950/80 text-blue-300 border border-blue-500/40'
            }`}
          >
            {item.status === 'resolved' ? 'Resolved' : 'Active'}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
            {item.title}
          </h3>
          <p className="mt-1.5 text-sm text-slate-400 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Metadata */}
        <div className="space-y-2 pt-2 border-t border-slate-700/50 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Action Button */}
        <Link
          to={`/item/${item.id}`}
          className="mt-2 w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-slate-700/50 hover:bg-blue-600 text-slate-200 hover:text-white transition-all duration-200 group/btn"
        >
          <span>View Details & Matches</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </div>
  );
};
