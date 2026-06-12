import app from './app';
import dotenv from 'dotenv';
import transactionRoutes from './routes/transactionRoutes';
import accountRoutes from './routes/accountRoutes';

dotenv.config();

const PORT = process.env.PORT || 5001;

// Register transaction routes under /api/v1/transactions
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/accounts', accountRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
});