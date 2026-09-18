export const TARGET_DOMAINS = [
  'Electronics',
  'Clothing',
  'IDs & Wallets',
  'Books & Stationery',
  'Keys',
  'Accessories',
  'Miscellaneous'
] as const;

export type TargetDomain = typeof TARGET_DOMAINS[number];

export interface Item {
  id: string;
  report_type: 'lost' | 'found';
  category: string;
  title: string;
  description: string;
  image_url: string;
  location: string;
  event_time: string;
  contact_info: string;
  status: 'active' | 'resolved';
  created_at: string;
}

export interface MatchItem {
  id: string;
  lost_item_id: string;
  found_item_id: string;
  confidence_score: number;
  explanation: string;
  created_at: string;
  matched_item?: Item;
}

export interface Stats {
  total: number;
  lost: number;
  found: number;
  resolved: number;
  active: number;
}
