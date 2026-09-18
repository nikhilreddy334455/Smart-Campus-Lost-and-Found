import { Item, MatchItem, Stats } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function fetchItems(params?: { type?: string; category?: string; search?: string }): Promise<Item[]> {
  const query = new URLSearchParams();
  if (params?.type && params.type !== 'all') query.set('type', params.type);
  if (params?.category && params.category !== 'All') query.set('category', params.category);
  if (params?.search && params.search.trim()) query.set('search', params.search.trim());

  const url = `${API_BASE}/items${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load items');
  const json = await res.json();
  return json.data || [];
}

export async function fetchItem(id: string): Promise<Item> {
  const res = await fetch(`${API_BASE}/items/${id}`);
  if (!res.ok) throw new Error('Item not found');
  const json = await res.json();
  return json.data;
}

export async function createItem(data: {
  report_type: 'lost' | 'found';
  category: string;
  title: string;
  description: string;
  image_url: string;
  location: string;
  event_time: string;
  contact_info: string;
}): Promise<Item> {
  const res = await fetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to submit report');
  }
  return json.data;
}

export async function fetchItemMatches(id: string): Promise<MatchItem[]> {
  const res = await fetch(`${API_BASE}/items/${id}/matches`);
  if (!res.ok) throw new Error('Failed to fetch matches');
  const json = await res.json();
  return json.data || [];
}

export async function triggerItemMatch(id: string): Promise<{ matches: MatchItem[]; summary: { matchesFound: number; topScore: number } }> {
  const res = await fetch(`${API_BASE}/trigger-match/${id}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to trigger AI matching');
  return res.json();
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  const json = await res.json();
  return json.data;
}

export async function seedSampleData(): Promise<void> {
  const res = await fetch(`${API_BASE}/seed`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to seed data');
}
