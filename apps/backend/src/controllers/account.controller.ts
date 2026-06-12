import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';

/**
 * GET /api/v1/accounts
 * Returns list of accounts for a given user (optional userId query).
 */
export const getAllAccounts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.query as { userId?: string };
    const accounts = await prisma.account.findMany({
      where: userId ? { userId } : undefined,
      include: {
        user: { select: { id: true, name: true, email: true } },
        transactions: { select: { id: true } },
      },
    });
    sendSuccess(res, accounts, 'Fetched accounts');
  } catch (err) {
    next(err);
  }
};
