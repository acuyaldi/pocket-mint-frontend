import { Router } from 'express';
import { getGoals, createGoal, updateGoal, deleteGoal } from '../controllers/goal.controller';
import { apiKeyAuth } from '../middleware/apiKeyAuth';

const goalRouter = Router();

// GET /api/v1/goals
goalRouter.get('/', apiKeyAuth, getGoals);

// POST /api/v1/goals
goalRouter.post('/', apiKeyAuth, createGoal);

// PUT /api/v1/goals/:id
goalRouter.put('/:id', apiKeyAuth, updateGoal);

// DELETE /api/v1/goals/:id
goalRouter.delete('/:id', apiKeyAuth, deleteGoal);

export { goalRouter };
