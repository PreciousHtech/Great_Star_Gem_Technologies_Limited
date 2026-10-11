import app from '../server';

export default function handler(req: any, res: any) {
  // If Vercel rewrites strip /api prefix or rewrite to /api/index, normalize req.url
  if (req.originalUrl && req.originalUrl.startsWith('/api') && req.url !== req.originalUrl) {
    req.url = req.originalUrl;
  } else if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
}
