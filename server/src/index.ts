import express from 'express';
import cors from 'cors';
import { initDatabase } from './database.js';
import expensesRouter from './routes/expenses.js';
import investmentsRouter from './routes/investments.js';
import rebalancingRouter from './routes/rebalancing.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();

// Routes
app.use('/api/expenses', expensesRouter);
app.use('/api/investments', investmentsRouter);
app.use('/api/rebalancing', rebalancingRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

