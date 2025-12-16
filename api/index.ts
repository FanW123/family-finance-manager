// Vercel serverless function wrapper for Express app
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from '../server/src/database.js';
import expensesRouter from '../server/src/routes/expenses.js';
import investmentsRouter from '../server/src/routes/investments.js';
import rebalancingRouter from '../server/src/routes/rebalancing.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();

// Routes
app.use('/expenses', expensesRouter);
app.use('/investments', investmentsRouter);
app.use('/rebalancing', rebalancingRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Export for Vercel
export default app;

