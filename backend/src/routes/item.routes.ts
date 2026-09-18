import { Router } from 'express';
import { ItemController } from '../controllers/item.controller.js';

const router = Router();

// Stats route
router.get('/stats', ItemController.getStats);

// Seed data route
router.post('/seed', ItemController.seedData);

// Items CRUD
router.get('/items', ItemController.getItems);
router.get('/items/:id', ItemController.getItemById);
router.post('/items', ItemController.createItem);

// AI Matches routes
router.get('/items/:id/matches', ItemController.getItemMatches);
router.post('/trigger-match/:id', ItemController.triggerMatch);

export default router;
