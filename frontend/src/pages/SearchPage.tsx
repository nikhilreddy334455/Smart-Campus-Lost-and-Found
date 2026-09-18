import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchItems } from '../lib/api';
import { Item } from '../lib/types';
import { SearchBar } from '../components/SearchBar';
import { ItemCard } from '../components/ItemCard';
import { Search, Frown } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const initialSearch = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || 'all';
  const initialCategory = searchParams.get('category') || 'All';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await fetchItems({
        type: selectedType,
        category: selectedCategory,
        search: searchTerm
      });
      setItems(data);
    } catch (err) {
      console.error('Failed to search items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Sync state with URL params
    const params: Record<string, string> = {};
    if (searchTerm) params.q = searchTerm;
    if (selectedType !== 'all') params.type = selectedType;
    if (selectedCategory !== 'All') params.category = selectedCategory;
    setSearchParams(params, { replace: true });

    // Debounce search query
    const timer = setTimeout(() => {
      loadItems();
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedType, selectedCategory]);

  const handleReset = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedCategory('All');
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          <Search className="w-8 h-8 text-blue-500" />
          <span>Search & Discover Items</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Browse through all logged campus reports using real-time keyword matching, domain filters, and report types.
        </p>
      </div>

      {/* Filter Component */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onReset={handleReset}
      />

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
        <span>Showing {items.length} {items.length === 1 ? 'item' : 'items'}</span>
        {(searchTerm || selectedType !== 'all' || selectedCategory !== 'All') && (
          <span className="text-blue-400">Filters Applied</span>
        )}
      </div>

      {/* Grid Feed */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-80 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="p-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400">
            <Frown className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-white">No Matching Reports Found</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Try adjusting your search keywords or switching category filters.
          </p>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};
