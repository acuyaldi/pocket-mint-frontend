import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { apiKeyAuth } from '../middleware/apiKeyAuth';

const router = Router();

// GET /api/v1/transactions
router.get('/', TransactionController.getAll);
// POST /api/v1/transactions
router.post('/', apiKeyAuth, TransactionController.create);
// DELETE /api/v1/transactions/:id
router.delete('/:id', TransactionController.delete);

export default router;
