import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

/**
 * Middleware to protect routes using an `x-api-key` header.
 * If the key matches `process.env.API_KEY`, the request is allowed.
 * Additionally, it injects a default `userId` into `req.query` based on the first user
 * found in the database (used for n8n‑style calls that bypass normal auth).
 */
export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }

  try {
    // Grab a default user – we pick the first existing user in the DB.
    const user = await prisma.user.findFirst({ select: { id: true } });
    if (user?.id) {
      // Persist the userId for downstream handlers (as a query param).
      // Using `any` to extend the Request type safely.
      (req.query as any).userId = user.id;
    }
    next();
  } catch (err) {
    console.error('apiKeyAuth middleware error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
