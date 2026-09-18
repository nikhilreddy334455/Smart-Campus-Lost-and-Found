import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import itemRoutes from './routes/item.routes.js';
import { DbService } from './services/db.service.js';

dotenv.config({ path: '../.env' });
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Strict payload limits to prevent Denial of Service (5MB)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl or same-origin)
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logger
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'campus-lost-found-backend', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', itemRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler - Never leak DB stack traces to client
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Internal Server Error]', err);
  
  if (err.type === 'entity.too.large') {
    res.status(413).json({ error: 'Payload exceeds maximum limit of 5MB' });
    return;
  }

  res.status(500).json({
    error: 'An unexpected internal server error occurred. Please try again later.'
  });
});

// Start Server & Initialize Database
async function startServer() {
  try {
    await DbService.initDb();
    // Auto-seed sample data if empty so UI has immediate rich content
    await DbService.seedDemoData();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`🚀 Smart Campus Lost & Found API running on port ${PORT}`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🤖 AI Model: gemini-2.5-flash via @google/genai`);
      console.log(`🔑 Gemini Key: ${process.env.GEMINI_API_KEY ? 'CONFIGURED' : 'UNSET (analytical fallback active)'}`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Fatal: Failed to initialize application:', err);
    process.exit(1);
  }
}

startServer();
