// Vercel serverless function wrapper for Express app
import express from 'express';
import cors from 'cors';
import { initDatabase } from '../server/src/database.js';
import expensesRouter from '../server/src/routes/expenses.js';
import investmentsRouter from '../server/src/routes/investments.js';
import rebalancingRouter from '../server/src/routes/rebalancing.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Initialize database with error handling
try {
  initDatabase();
  console.log('Database initialized successfully');
} catch (error) {
  console.error('Database initialization failed:', error);
}

// Routes
app.use('/expenses', expensesRouter);
app.use('/investments', investmentsRouter);
app.use('/rebalancing', rebalancingRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export for Vercel serverless function
export default app;

