import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { createItem } from '../lib/api';
import { TARGET_DOMAINS } from '../lib/types';
import { Sparkles, Image as ImageIcon, MapPin, Calendar, Mail, AlertCircle } from 'lucide-react';

const formSchema = z.object({
  report_type: z.enum(['lost', 'found']),
  category: z.string().min(1, 'Please select a category'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().min(10, 'Please provide at least 10 characters of detail').max(1000, 'Description cannot exceed 1000 characters'),
  image_url: z.string().url('Please enter a valid image URL'),
  location: z.string().min(2, 'Please provide the campus location').max(150, 'Location cannot exceed 150 characters'),
  event_time: z.string().min(1, 'Please select the date and time of the event'),
  contact_info: z.string().min(3, 'Please provide valid contact information')
});

type FormValues = z.infer<typeof formSchema>;

interface ReportFormProps {
  initialType?: 'lost' | 'found';
}

const SAMPLE_PRESETS = [
  {
    label: 'Blue Hydroflask Bottle',
    category: 'Miscellaneous',
    title: 'Blue 32oz Hydro Flask Water Bottle',
    description: 'Cobalt blue 32oz wide mouth insulated bottle with a silver metal lid and national park sticker. Has a small dent near the base.',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
    location: 'Main University Library 2nd Floor Study Cubicles'
  },
  {
    label: 'AirPods Pro Case',
    category: 'Electronics',
    title: 'AirPods Pro 2 in Black Matte Case',
    description: 'Apple wireless earbuds in a matte black Spigen shockproof case with small metallic carabiner.',
    imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80',
    location: 'Science Center Lecture Hall B10'
  },
  {
    label: 'Campus ID & Leather Wallet',
    category: 'IDs & Wallets',
    title: 'Brown Leather Bi-fold Wallet with Student Card',
    description: 'Distressed brown leather wallet containing university student ID card and city metro card.',
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
    location: 'Student Dining Commons - North Entrance'
  },
  {
    label: 'Patagonia Fleece Jacket',
    category: 'Clothing',
    title: 'Navy Blue Patagonia Quarter-Zip Fleece',
    description: 'Men size M navy blue synchilla fleece pullover with embroidered logo on chest.',
    imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80',
    location: 'Recreation Center Locker Room'
  }
];

export const ReportForm: React.FC<ReportFormProps> = ({ initialType = 'lost' }) => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Default time format for datetime-local input
  const defaultTime = new Date().toISOString().slice(0, 16);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      report_type: initialType,
      category: 'Electronics',
      title: '',
      description: '',
      image_url: '',
      location: '',
      event_time: defaultTime,
      contact_info: ''
    }
  });

  const reportType = watch('report_type');
  const imageUrl = watch('image_url');

  const applyPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setValue('category', preset.category);
    setValue('title', preset.title);
    setValue('description', preset.description);
    setValue('image_url', preset.imageUrl);
    setValue('location', preset.location);
  };

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    setServerError(null);

    try {
      // Ensure ISO datetime format for backend Zod validation
      const isoDateTime = new Date(data.event_time).toISOString();

      const created = await createItem({
        ...data,
        event_time: isoDateTime
      });

      // Redirect directly to the item detail page to show AI matches
      navigate(`/item/${created.id}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'An unexpected error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header card */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-48 h-48 text-blue-400" />
        </div>
        <div className="relative z-10">
          <span
            className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg mb-3 ${
              reportType === 'lost'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {reportType === 'lost' ? 'Lost Item Report' : 'Found Item Report'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {reportType === 'lost' ? 'Report a Lost Item' : 'Report a Found Item'}
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl">
            Upload multimodal photos and detailed descriptions. Our Gemini 2.5 Flash AI will automatically analyze your report against database records to find probable matches.
          </p>
        </div>
      </div>

      {/* Quick Fill Demo Presets */}
      <div className="mb-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-300">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Quick-Fill Sample Data for Testing:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-blue-600/30 border border-slate-700 hover:border-blue-500/50 text-slate-300 hover:text-white transition-colors"
            >
              + {preset.label}
            </button>
          ))}
        </div>
      </div>

      {serverError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
          {/* Report Type Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">Report Type</label>
            <div className="grid grid-cols-2 gap-4">
              <label
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border cursor-pointer font-medium text-sm transition-all ${
                  reportType === 'lost'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-lg shadow-rose-500/10'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  value="lost"
                  {...register('report_type')}
                  className="sr-only"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>I Lost This Item</span>
              </label>

              <label
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border cursor-pointer font-medium text-sm transition-all ${
                  reportType === 'found'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  value="found"
                  {...register('report_type')}
                  className="sr-only"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>I Found This Item</span>
              </label>
            </div>
          </div>

          {/* Category & Title Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">Category</label>
              <select
                {...register('category')}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TARGET_DOMAINS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-rose-400">{errors.category.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-200 mb-2">Item Title</label>
              <input
                type="text"
                placeholder="e.g. Blue 32oz Hydroflask Bottle"
                {...register('title')}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-rose-400">{errors.title.message}</p>
              )}
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Detailed Description & Distinguishing Marks
            </label>
            <textarea
              rows={4}
              placeholder="Describe distinguishing marks, stickers, color shades, condition, wear and tear, or contents..."
              {...register('description')}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-rose-400">{errors.description.message}</p>
            )}
          </div>

          {/* Image URL with Live Preview */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center justify-between">
              <span>Photo / Image URL (Required for AI Analysis)</span>
              <span className="text-xs text-slate-400 font-normal">Supports web URLs or data URIs</span>
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <ImageIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or paste image link"
                  {...register('image_url')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {errors.image_url && (
              <p className="mt-1 text-xs text-rose-400">{errors.image_url.message}</p>
            )}

            {/* Live Image Preview */}
            {imageUrl && (
              <div className="mt-3 relative w-full sm:w-64 h-40 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/1e293b/white?text=Invalid+Image+URL';
                  }}
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 text-[10px] rounded bg-black/70 text-slate-300 backdrop-blur-md">
                  Multimodal Input Preview
                </span>
              </div>
            )}
          </div>

          {/* Location & Datetime */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>Campus Location</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Library 2nd Floor Study Cubicles"
                {...register('location')}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.location && (
                <p className="mt-1 text-xs text-rose-400">{errors.location.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>Event Date & Time</span>
              </label>
              <input
                type="datetime-local"
                {...register('event_time')}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
              />
              {errors.event_time && (
                <p className="mt-1 text-xs text-rose-400">{errors.event_time.message}</p>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-indigo-400" />
              <span>Contact Information (Email or Phone)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. student.email@campus.edu or 555-0199"
              {...register('contact_info')}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.contact_info && (
              <p className="mt-1 text-xs text-rose-400">{errors.contact_info.message}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 px-6 rounded-2xl font-bold text-base bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Submitting & Triggering Gemini AI Reasoning...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-blue-200 group-hover:scale-110 transition-transform" />
              <span>Submit Report & Match with AI</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
