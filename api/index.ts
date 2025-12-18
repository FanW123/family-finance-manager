// Vercel serverless function wrapper for Express app
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('../server/src/database.js');
const expensesRouter = require('../server/src/routes/expenses.js');
const investmentsRouter = require('../server/src/routes/investments.js');
const rebalancingRouter = require('../server/src/routes/rebalancing.js');

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
// Note: In Vercel serverless, database is initialized on first request
let dbInitialized = false;

function ensureDatabase() {
  if (!dbInitialized) {
    try {
      initDatabase();
      dbInitialized = true;
      console.log('Database initialized successfully');
    } catch (error: any) {
      console.error('Database initialization failed:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  }
}

// Initialize on module load (for Vercel)
try {
  ensureDatabase();
} catch (error) {
  console.error('Failed to initialize database on module load:', error);
  // Don't throw - will retry on first request
}

// Middleware to ensure database is initialized before handling requests
app.use((req, res, next) => {
  try {
    ensureDatabase();
    next();
  } catch (error: any) {
    console.error('Database check failed:', error);
    res.status(500).json({ 
      error: 'Database initialization failed',
      message: error.message 
    });
  }
});

// Routes
app.use('/expenses', expensesRouter);
app.use('/investments', investmentsRouter);
app.use('/rebalancing', rebalancingRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export for Vercel serverless function
module.exports = app;

