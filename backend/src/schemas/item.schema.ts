import { z } from 'zod';

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

export const ItemSchema = z.object({
  report_type: z.enum(['lost', 'found']),
  category: z.string().min(1, 'Category is required'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description cannot exceed 1000 characters'),
  image_url: z.string().url('Image must be a valid URL'),
  location: z.string().min(2, 'Location must be at least 2 characters').max(150, 'Location cannot exceed 150 characters'),
  event_time: z.string().datetime('Event time must be a valid ISO datetime'),
  contact_info: z.string().min(3, 'Contact info must be at least 3 characters')
});

export type ItemInput = z.infer<typeof ItemSchema>;

export const ItemQuerySchema = z.object({
  type: z.enum(['lost', 'found']).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(['active', 'resolved']).optional()
});

export type ItemQuery = z.infer<typeof ItemQuerySchema>;

export interface ItemRecord {
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

export interface MatchResult {
  id: string;
  lost_item_id: string;
  found_item_id: string;
  confidence_score: number;
  explanation: string;
  created_at: string;
  matched_item?: ItemRecord;
}
