import { Router } from 'express';
import { getAllAccounts } from '../controllers/account.controller';

const router = Router();

// GET /api/v1/accounts
router.get('/', getAllAccounts);

export default router;
