import pg from 'pg';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { ItemInput, ItemQuery, ItemRecord, MatchResult } from '../schemas/item.schema.js';

dotenv.config();

const { Pool } = pg;

const rawConnectionString = process.env.DATABASE_URL || '';
// In Vercel or production, only use connection string if it's an actual external URL
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
const isValidRemoteUrl = rawConnectionString.startsWith('postgres://') || rawConnectionString.startsWith('postgresql://');
const connectionString = isValidRemoteUrl 
  ? rawConnectionString 
  : (isProduction ? '' : 'postgresql://localhost:5432/campus_lost_found');

const isSslRequired = 
  connectionString.includes('sslmode=require') || 
  connectionString.includes('neon.tech') || 
  connectionString.includes('supabase.co') || 
  connectionString.includes('render.com') ||
  isProduction;

export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: isSslRequired ? { rejectUnauthorized: false } : undefined,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  : null;

// Initial sample items for high-fidelity fallback when database is offline or not yet configured
const SAMPLE_ITEMS: ItemRecord[] = [
  {
    id: 'e151968c-7670-412c-8f18-f074bf62a668',
    report_type: 'lost',
    category: 'Miscellaneous',
    title: 'Blue 32oz Hydro Flask Water Bottle',
    description: 'Dark blue wide-mouth Hydroflask with a silver cap and a noticeable small dent near the bottom rim. Has a Yosemite National Park vinyl sticker on the side.',
    image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
    location: 'Main University Library 2nd Floor Study Cubicles',
    event_time: new Date(Date.now() - 3600000 * 5).toISOString(),
    contact_info: 'alex.chen@campus.edu',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'f3146be1-22b0-4872-b0fb-e105779db58f',
    report_type: 'found',
    category: 'Miscellaneous',
    title: 'Found Blue Hydro Flask with sticker',
    description: 'Found a 32oz cobalt blue Hydroflask bottle with silver metal cap. Features a round national park sticker and a small dent along the lower base.',
    image_url: 'https://images.unsplash.com/photo-1570831739435-6601aa3fa4fb?auto=format&fit=crop&w=800&q=80',
    location: 'Library Quad Outdoor Benches near fountain',
    event_time: new Date(Date.now() - 3600000 * 3).toISOString(),
    contact_info: 'campus-security@campus.edu',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: '445d7189-5661-438c-885c-ce5cb0e97ad5',
    report_type: 'lost',
    category: 'Electronics',
    title: 'Apple AirPods Pro Gen 2 with Black Silicone Case',
    description: 'AirPods Pro 2 in a matte black Spigen silicone case with a small carabiner clip. Left earbud has tiny scratch on the stem.',
    image_url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80',
    location: 'Science Center Lecture Hall B10',
    event_time: new Date(Date.now() - 3600000 * 12).toISOString(),
    contact_info: 'sarah.m@campus.edu',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: '959ff397-cca4-45f2-afa5-e2791e7f90ac',
    report_type: 'found',
    category: 'Electronics',
    title: 'AirPods in Black Case',
    description: 'White wireless ear buds inside a protective dark black rubbery case. Found tucked between row 4 lecture chairs.',
    image_url: 'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?auto=format&fit=crop&w=800&q=80',
    location: 'Science Center Lecture Hall B10 front row podium',
    event_time: new Date(Date.now() - 3600000 * 8).toISOString(),
    contact_info: 'facilities.help@campus.edu',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: '4b321a50-61cd-40a2-bfe7-0bfdfb608123',
    report_type: 'lost',
    category: 'IDs & Wallets',
    title: 'Brown Leather Bi-fold Wallet with Student ID',
    description: 'Vintage brown Fossil leather wallet containing campus card for Nikhil Reddy, driver license, and blue transit pass.',
    image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
    location: 'Student Dining Commons - North Entrance',
    event_time: new Date(Date.now() - 3600000 * 24).toISOString(),
    contact_info: 'n.reddy@campus.edu',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: '04ec8ee0-d103-44f0-9c1d-edb70812cf96',
    report_type: 'found',
    category: 'Clothing',
    title: 'Navy Blue Patagonia Fleece Pullover (Medium)',
    description: 'Men navy blue quarter-zip fleece jacket. Left breast Patagonia logo, size M label, very good condition.',
    image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80',
    location: 'Gymnasium Locker Room Bench',
    event_time: new Date(Date.now() - 3600000 * 6).toISOString(),
    contact_info: 'recreation.desk@campus.edu',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: '3c8e4112-5812-4cf3-a7a2-94ea487be110',
    report_type: 'lost',
    category: 'Keys',
    title: 'Subaru Car Key + Dorm Key on Red Lanyard',
    description: 'Black electronic Subaru fob key ring with brass dorm room key #314 and red university alumni woven lanyard.',
    image_url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80',
    location: 'North Campus Parking Structure Level 2',
    event_time: new Date(Date.now() - 3600000 * 18).toISOString(),
    contact_info: 'j.taylor@campus.edu',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString()
  }
];

// In-memory matches store
const memoryMatches: MatchResult[] = [
  {
    id: randomUUID(),
    lost_item_id: 'e151968c-7670-412c-8f18-f074bf62a668',
    found_item_id: 'f3146be1-22b0-4872-b0fb-e105779db58f',
    confidence_score: 95,
    explanation: 'Both items are 32oz blue Hydroflasks with a distinct dent on the base; locations (Library and Quad) are adjacent and timestamps align.',
    created_at: new Date().toISOString(),
    matched_item: SAMPLE_ITEMS[1]
  },
  {
    id: randomUUID(),
    lost_item_id: '445d7189-5661-438c-885c-ce5cb0e97ad5',
    found_item_id: '959ff397-cca4-45f2-afa5-e2791e7f90ac',
    confidence_score: 88,
    explanation: 'High probability match for Apple AirPods Pro in black protective case found at Science Center Lecture Hall B10 podium shortly after the loss event.',
    created_at: new Date().toISOString(),
    matched_item: SAMPLE_ITEMS[3]
  }
];

// In-memory items store
const memoryItems: ItemRecord[] = [...SAMPLE_ITEMS];

export class DbService {
  private static dbAvailable: boolean | null = null;

  /**
   * Tests whether PostgreSQL is accessible
   */
  private static async isDbOnline(): Promise<boolean> {
    if (!pool) return false;
    if (this.dbAvailable !== null) return this.dbAvailable;

    try {
      const client = await pool.connect();
      client.release();
      this.dbAvailable = true;
      return true;
    } catch (err) {
      console.warn('[Database] PostgreSQL connection not available. Serving resilient in-memory storage:', err instanceof Error ? err.message : err);
      this.dbAvailable = false;
      return false;
    }
  }

  /**
   * Initializes the database tables if they do not exist
   */
  static async initDb(): Promise<void> {
    if (!pool) {
      console.log('[Database] No remote DATABASE_URL provided. Operating with in-memory resilient storage.');
      return;
    }

    try {
      const isOnline = await this.isDbOnline();
      if (!isOnline) return;

      const client = await pool.connect();
      try {
        await client.query(`
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

          CREATE TABLE IF NOT EXISTS items (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              report_type VARCHAR(10) NOT NULL CHECK (report_type IN ('lost', 'found')),
              category VARCHAR(50) NOT NULL,
              title VARCHAR(255) NOT NULL,
              description TEXT NOT NULL,
              image_url TEXT NOT NULL,
              location VARCHAR(255) NOT NULL,
              event_time TIMESTAMP WITH TIME ZONE NOT NULL,
              contact_info VARCHAR(255) NOT NULL,
              status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS item_matches (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              lost_item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
              found_item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
              confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
              explanation TEXT NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(lost_item_id, found_item_id)
          );

          CREATE INDEX IF NOT EXISTS idx_items_report_type ON items(report_type);
          CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
          CREATE INDEX IF NOT EXISTS idx_matches_lost_id ON item_matches(lost_item_id);
          CREATE INDEX IF NOT EXISTS idx_matches_found_id ON item_matches(found_item_id);
        `);
        console.log('[Database] PostgreSQL initialized successfully.');
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[Database] Table check notice:', err instanceof Error ? err.message : err);
      this.dbAvailable = false;
    }
  }

  /**
   * Retrieves items with optional filtering and search
   */
  static async getItems(query: ItemQuery): Promise<ItemRecord[]> {
    if (await this.isDbOnline() && pool) {
      try {
        const conditions: string[] = [];
        const values: unknown[] = [];
        let paramIndex = 1;

        if (query.type) {
          conditions.push(`report_type = $${paramIndex++}`);
          values.push(query.type);
        }

        if (query.category && query.category !== 'All') {
          conditions.push(`category = $${paramIndex++}`);
          values.push(query.category);
        }

        if (query.status) {
          conditions.push(`status = $${paramIndex++}`);
          values.push(query.status);
        }

        if (query.search && query.search.trim()) {
          const searchPattern = `%${query.search.trim()}%`;
          conditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR location ILIKE $${paramIndex})`);
          values.push(searchPattern);
          paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const sql = `
          SELECT id, report_type, category, title, description, image_url, location, 
                 event_time::text, contact_info, status, created_at::text
          FROM items
          ${whereClause}
          ORDER BY created_at DESC
        `;

        const { rows } = await pool.query<ItemRecord>(sql, values);
        return rows;
      } catch (err) {
        console.warn('[Database] getItems SQL query failed, falling back to memory store:', err);
      }
    }

    // In-memory fallback
    return memoryItems.filter(item => {
      if (query.type && item.report_type !== query.type) return false;
      if (query.category && query.category !== 'All' && item.category !== query.category) return false;
      if (query.status && item.status !== query.status) return false;
      if (query.search && query.search.trim()) {
        const s = query.search.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(s);
        const matchesDesc = item.description.toLowerCase().includes(s);
        const matchesLoc = item.location.toLowerCase().includes(s);
        if (!matchesTitle && !matchesDesc && !matchesLoc) return false;
      }
      return true;
    });
  }

  /**
   * Fetches an item by its UUID
   */
  static async getItemById(id: string): Promise<ItemRecord | null> {
    if (await this.isDbOnline() && pool) {
      try {
        const sql = `
          SELECT id, report_type, category, title, description, image_url, location, 
                 event_time::text, contact_info, status, created_at::text
          FROM items
          WHERE id = $1
        `;
        const { rows } = await pool.query<ItemRecord>(sql, [id]);
        if (rows[0]) return rows[0];
      } catch (err) {
        console.warn('[Database] getItemById query failed, falling back to memory store:', err);
      }
    }

    return memoryItems.find(item => item.id === id) || null;
  }

  /**
   * Inserts a new item into the database
   */
  static async createItem(item: ItemInput): Promise<ItemRecord> {
    if (await this.isDbOnline() && pool) {
      try {
        const sql = `
          INSERT INTO items (report_type, category, title, description, image_url, location, event_time, contact_info)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id, report_type, category, title, description, image_url, location, 
                    event_time::text, contact_info, status, created_at::text
        `;
        const values = [
          item.report_type,
          item.category,
          item.title,
          item.description,
          item.image_url,
          item.location,
          item.event_time,
          item.contact_info,
        ];

        const { rows } = await pool.query<ItemRecord>(sql, values);
        return rows[0];
      } catch (err) {
        console.warn('[Database] createItem SQL insert failed, storing in memory:', err);
      }
    }

    const newItem: ItemRecord = {
      id: randomUUID(),
      report_type: item.report_type,
      category: item.category,
      title: item.title,
      description: item.description,
      image_url: item.image_url,
      location: item.location,
      event_time: item.event_time,
      contact_info: item.contact_info,
      status: 'active',
      created_at: new Date().toISOString()
    };
    memoryItems.unshift(newItem);
    return newItem;
  }

  /**
   * Retrieves reciprocal candidate items for AI matching
   */
  static async getCandidateItemsForMatching(targetItem: ItemRecord): Promise<ItemRecord[]> {
    const reciprocalType = targetItem.report_type === 'lost' ? 'found' : 'lost';

    if (await this.isDbOnline() && pool) {
      try {
        const sql = `
          SELECT id, report_type, category, title, description, image_url, location, 
                 event_time::text, contact_info, status, created_at::text
          FROM items
          WHERE report_type = $1 AND status = 'active' AND id != $2
          ORDER BY (CASE WHEN category = $3 THEN 0 ELSE 1 END), created_at DESC
          LIMIT 20
        `;
        const { rows } = await pool.query<ItemRecord>(sql, [reciprocalType, targetItem.id, targetItem.category]);
        return rows;
      } catch (err) {
        console.warn('[Database] getCandidateItems query failed, using memory store:', err);
      }
    }

    return memoryItems.filter(item => item.report_type === reciprocalType && item.id !== targetItem.id);
  }

  /**
   * Upserts an AI match result
   */
  static async saveMatch(
    lostItemId: string,
    foundItemId: string,
    confidenceScore: number,
    explanation: string
  ): Promise<MatchResult> {
    if (await this.isDbOnline() && pool) {
      try {
        const sql = `
          INSERT INTO item_matches (lost_item_id, found_item_id, confidence_score, explanation)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (lost_item_id, found_item_id)
          DO UPDATE SET confidence_score = EXCLUDED.confidence_score,
                        explanation = EXCLUDED.explanation,
                        created_at = CURRENT_TIMESTAMP
          RETURNING id, lost_item_id, found_item_id, confidence_score, explanation, created_at::text
        `;
        const { rows } = await pool.query<MatchResult>(sql, [lostItemId, foundItemId, confidenceScore, explanation]);
        return rows[0];
      } catch (err) {
        console.warn('[Database] saveMatch query failed, saving in memory:', err);
      }
    }

    const existingIndex = memoryMatches.findIndex(m => m.lost_item_id === lostItemId && m.found_item_id === foundItemId);
    const foundItem = memoryItems.find(i => i.id === foundItemId);
    const matchRecord: MatchResult = {
      id: randomUUID(),
      lost_item_id: lostItemId,
      found_item_id: foundItemId,
      confidence_score: confidenceScore,
      explanation,
      created_at: new Date().toISOString(),
      matched_item: foundItem
    };

    if (existingIndex >= 0) {
      memoryMatches[existingIndex] = matchRecord;
    } else {
      memoryMatches.unshift(matchRecord);
    }

    return matchRecord;
  }

  /**
   * Retrieves AI matches for a specific item with the matched item's full details
   */
  static async getMatchesForItem(itemId: string): Promise<MatchResult[]> {
    const target = await this.getItemById(itemId);
    if (!target) return [];

    if (await this.isDbOnline() && pool) {
      try {
        let sql = '';
        if (target.report_type === 'lost') {
          sql = `
            SELECT m.id, m.lost_item_id, m.found_item_id, m.confidence_score, m.explanation, m.created_at::text,
                   json_build_object(
                     'id', i.id,
                     'report_type', i.report_type,
                     'category', i.category,
                     'title', i.title,
                     'description', i.description,
                     'image_url', i.image_url,
                     'location', i.location,
                     'event_time', i.event_time::text,
                     'contact_info', i.contact_info,
                     'status', i.status,
                     'created_at', i.created_at::text
                   ) as matched_item
            FROM item_matches m
            JOIN items i ON m.found_item_id = i.id
            WHERE m.lost_item_id = $1
            ORDER BY m.confidence_score DESC, m.created_at DESC
          `;
        } else {
          sql = `
            SELECT m.id, m.lost_item_id, m.found_item_id, m.confidence_score, m.explanation, m.created_at::text,
                   json_build_object(
                     'id', i.id,
                     'report_type', i.report_type,
                     'category', i.category,
                     'title', i.title,
                     'description', i.description,
                     'image_url', i.image_url,
                     'location', i.location,
                     'event_time', i.event_time::text,
                     'contact_info', i.contact_info,
                     'status', i.status,
                     'created_at', i.created_at::text
                   ) as matched_item
            FROM item_matches m
            JOIN items i ON m.lost_item_id = i.id
            WHERE m.found_item_id = $1
            ORDER BY m.confidence_score DESC, m.created_at DESC
          `;
        }

        const { rows } = await pool.query<MatchResult>(sql, [itemId]);
        return rows;
      } catch (err) {
        console.warn('[Database] getMatchesForItem query failed, falling back to memory store:', err);
      }
    }

    // In-memory fallback: return matches where itemId is lost or found
    return memoryMatches
      .filter(m => m.lost_item_id === itemId || m.found_item_id === itemId)
      .map(m => {
        const otherId = m.lost_item_id === itemId ? m.found_item_id : m.lost_item_id;
        const otherItem = memoryItems.find(i => i.id === otherId);
        return { ...m, matched_item: otherItem || m.matched_item };
      })
      .sort((a, b) => b.confidence_score - a.confidence_score);
  }

  /**
   * Seeds demo data
   */
  static async seedDemoData(): Promise<{ seeded: boolean; count: number }> {
    if (await this.isDbOnline() && pool) {
      try {
        const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*) as count FROM items');
        if (parseInt(rows[0].count, 10) > 0) {
          return { seeded: false, count: parseInt(rows[0].count, 10) };
        }

        for (const item of SAMPLE_ITEMS) {
          await this.createItem(item);
        }
        return { seeded: true, count: SAMPLE_ITEMS.length };
      } catch (err) {
        console.warn('[Database] seedDemoData failed, using in-memory demo data:', err);
      }
    }

    return { seeded: true, count: memoryItems.length };
  }
}
