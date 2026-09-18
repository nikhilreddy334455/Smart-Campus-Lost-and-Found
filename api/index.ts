import serverModule from '../backend/src/server.js';

// Unwrap Express application function cleanly for Vercel Serverless handler
const app = (serverModule as any)?.default?.default || (serverModule as any)?.default || serverModule;

export default app;
