import { Request, Response } from 'express';
import { ItemSchema, ItemQuerySchema } from '../schemas/item.schema.js';
import { DbService } from '../services/db.service.js';
import { AiService } from '../services/ai.service.js';

export class ItemController {
  /**
   * GET /api/items - Retrieve all items with optional query filters
   */
  static async getItems(req: Request, res: Response): Promise<void> {
    try {
      const parsedQuery = ItemQuerySchema.safeParse(req.query);
      if (!parsedQuery.success) {
        res.status(400).json({
          error: 'Invalid query parameters',
          details: parsedQuery.error.issues.map(i => i.message)
        });
        return;
      }

      const items = await DbService.getItems(parsedQuery.data);
      res.status(200).json({ success: true, data: items });
    } catch (err) {
      console.error('[ItemController.getItems]', err);
      res.status(500).json({ error: 'Failed to retrieve items. Please try again later.' });
    }
  }

  /**
   * GET /api/items/:id - Retrieve a single item by ID
   */
  static async getItemById(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(400).json({ error: 'Invalid item ID format' });
        return;
      }

      const item = await DbService.getItemById(id);
      if (!item) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }

      res.status(200).json({ success: true, data: item });
    } catch (err) {
      console.error('[ItemController.getItemById]', err);
      res.status(500).json({ error: 'Failed to retrieve item.' });
    }
  }

  /**
   * POST /api/items - Create a new item report and trigger AI matching engine
   */
  static async createItem(req: Request, res: Response): Promise<void> {
    try {
      const parsed = ItemSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          issues: parsed.error.issues.map(i => ({
            field: i.path.join('.'),
            message: i.message
          }))
        });
        return;
      }

      const newItem = await DbService.createItem(parsed.data);

      // Trigger AI Matching Engine in background without blocking response
      setImmediate(async () => {
        try {
          console.log(`[AI Matching Engine] Starting match computation for item: ${newItem.id} (${newItem.title})`);
          const result = await AiService.processMatchesForItem(newItem);
          console.log(`[AI Matching Engine] Finished: processed ${result.matchesFound} candidates, top score: ${result.topScore}%`);
        } catch (matchErr) {
          console.error('[AI Matching Engine] Error during async matching processing:', matchErr);
        }
      });

      res.status(201).json({
        success: true,
        message: 'Item reported successfully. AI matching initiated.',
        data: newItem
      });
    } catch (err) {
      console.error('[ItemController.createItem]', err);
      res.status(500).json({ error: 'Failed to create item report.' });
    }
  }

  /**
   * GET /api/items/:id/matches - Fetch AI matches for an item
   */
  static async getItemMatches(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(400).json({ error: 'Invalid item ID format' });
        return;
      }

      const item = await DbService.getItemById(id);
      if (!item) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }

      const matches = await DbService.getMatchesForItem(id);
      res.status(200).json({ success: true, count: matches.length, data: matches });
    } catch (err) {
      console.error('[ItemController.getItemMatches]', err);
      res.status(500).json({ error: 'Failed to retrieve item matches.' });
    }
  }

  /**
   * POST /api/trigger-match/:id - Manually trigger AI matching for an item
   */
  static async triggerMatch(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(400).json({ error: 'Invalid item ID format' });
        return;
      }

      const item = await DbService.getItemById(id);
      if (!item) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }

      const matchingSummary = await AiService.processMatchesForItem(item);
      const updatedMatches = await DbService.getMatchesForItem(id);

      res.status(200).json({
        success: true,
        message: 'AI matching completed successfully',
        summary: matchingSummary,
        matches: updatedMatches
      });
    } catch (err) {
      console.error('[ItemController.triggerMatch]', err);
      res.status(500).json({ error: 'Failed to process AI matching.' });
    }
  }

  /**
   * POST /api/seed - Seed sample campus data for demo and testing
   */
  static async seedData(req: Request, res: Response): Promise<void> {
    try {
      const result = await DbService.seedDemoData();
      // Also run AI matching on all sample items if newly seeded
      if (result.seeded) {
        const allItems = await DbService.getItems({});
        for (const item of allItems) {
          await AiService.processMatchesForItem(item);
        }
      }

      res.status(200).json({
        success: true,
        message: result.seeded ? `Successfully seeded ${result.count} campus items and computed AI matches!` : 'Database already contains data.',
        ...result
      });
    } catch (err) {
      console.error('[ItemController.seedData]', err);
      res.status(500).json({ error: 'Failed to seed sample data.' });
    }
  }

  /**
   * GET /api/stats - Quick stats for homepage
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const allItems = await DbService.getItems({});
      const lostCount = allItems.filter(i => i.report_type === 'lost').length;
      const foundCount = allItems.filter(i => i.report_type === 'found').length;
      const resolvedCount = allItems.filter(i => i.status === 'resolved').length;

      // Count total matches recorded
      const matchesRes = await DbService.getMatchesForItem(allItems[0]?.id || '00000000-0000-0000-0000-000000000000').catch(() => []);

      res.status(200).json({
        success: true,
        data: {
          total: allItems.length,
          lost: lostCount,
          found: foundCount,
          resolved: resolvedCount,
          active: allItems.length - resolvedCount
        }
      });
    } catch (err) {
      console.error('[ItemController.getStats]', err);
      res.status(500).json({ error: 'Failed to retrieve stats.' });
    }
  }
}
