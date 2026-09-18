import serverModule from '../backend/src/server.js';

const app = (serverModule as any)?.default?.default || (serverModule as any)?.default || serverModule;

export default async function handler(req: any, res: any) {
  return app(req, res);
}
