import serverModule from '../backend/src/server.js';

const app = (serverModule as any)?.default?.default || (serverModule as any)?.default || serverModule;

export default async function handler(req: any, res: any) {
  // Normalize req.url for Express router matching
  if (req.url && !req.url.startsWith('/api') && req.query?.path) {
    const subpath = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    const queryIndex = req.url.indexOf('?');
    const queryString = queryIndex !== -1 ? req.url.slice(queryIndex) : '';
    req.url = `/api/${subpath}${queryString}`;
  }
  return app(req, res);
}
