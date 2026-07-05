import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { apiKeyAuth } from '../middleware/apiKeyAuth';

const transactionRouter = Router();

// GET /api/v1/transactions — auto-filtered to current month
transactionRouter.get('/', TransactionController.getAll);

// GET /api/v1/transactions/all — no month filter
transactionRouter.get('/all', TransactionController.getAllTime);

// GET /api/v1/transactions/summary?month=YYYY-MM — monthly P&L
transactionRouter.get('/summary', apiKeyAuth, TransactionController.summary);

transactionRouter.put('/:id', apiKeyAuth, TransactionController.update);
transactionRouter.delete('/:id', TransactionController.delete);

// POST with apiKeyAuth middleware
transactionRouter.post('/', apiKeyAuth, TransactionController.create);

export { transactionRouter };
