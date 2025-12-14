import express from 'express';
import db from '../database.js';
import axios from 'axios';

const router = express.Router();

// Get rebalancing suggestions
router.get('/suggestions', async (req, res) => {
  try {
    // Get current allocation
    const investments = db.prepare(`
      SELECT type, SUM(amount) as total
      FROM investments
      GROUP BY type
    `).all() as Array<{ type: string; total: number }>;

    const totalValue = investments.reduce((sum, inv) => sum + inv.total, 0);

    if (totalValue === 0) {
      return res.json({
        suggestions: [],
        message: 'No investments found'
      });
    }

    // Get target allocation
    const targetAllocation = db.prepare('SELECT * FROM target_allocation').all() as Array<{
      type: string;
      percentage: number;
    }>;

    const targetMap = new Map(targetAllocation.map(t => [t.type, t.percentage]));
    const currentMap = new Map(investments.map(i => [i.type, i.total]));

    const suggestions: Array<{
      type: string;
      currentAmount: number;
      currentPercentage: number;
      targetPercentage: number;
      targetAmount: number;
      difference: number;
      action: string;
    }> = [];

    const types = ['stocks', 'bonds', 'cash'];

    types.forEach(type => {
      const currentAmount = currentMap.get(type) || 0;
      const currentPercentage = (currentAmount / totalValue) * 100;
      const targetPercentage = targetMap.get(type) || 0;
      const targetAmount = (totalValue * targetPercentage) / 100;
      const difference = targetAmount - currentAmount;

      // Only suggest if difference is significant (more than 1% of total)
      if (Math.abs(difference) > totalValue * 0.01) {
        suggestions.push({
          type,
          currentAmount,
          currentPercentage: Math.round(currentPercentage * 100) / 100,
          targetPercentage,
          targetAmount: Math.round(targetAmount * 100) / 100,
          difference: Math.round(difference * 100) / 100,
          action: difference > 0 ? 'buy' : 'sell'
        });
      }
    });

    // Sort by absolute difference (largest first)
    suggestions.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

    res.json({
      suggestions,
      totalValue: Math.round(totalValue * 100) / 100
    });
  } catch (error) {
    console.error('Error generating rebalancing suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Get market data for stocks (using Alpha Vantage or similar)
router.get('/market-data/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    return res.status(503).json({ 
      error: 'API key not configured',
      message: 'Please set ALPHA_VANTAGE_API_KEY in environment variables'
    });
  }

  try {
    // Using Alpha Vantage API
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: symbol,
        apikey: apiKey
      }
    });

    if (response.data['Error Message']) {
      return res.status(400).json({ error: response.data['Error Message'] });
    }

    if (response.data['Note']) {
      return res.status(429).json({ 
        error: 'API rate limit exceeded',
        message: 'Please try again later'
      });
    }

    const quote = response.data['Global Quote'];
    if (!quote) {
      return res.status(404).json({ error: 'Symbol not found' });
    }

    res.json({
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: quote['10. change percent'],
      volume: quote['06. volume'],
      lastUpdated: quote['07. latest trading day']
    });
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// Calculate rebalancing trades
router.post('/calculate-trades', (req, res) => {
  const { totalValue, targetAllocations } = req.body;

  if (!totalValue || !targetAllocations) {
    return res.status(400).json({ error: 'Total value and target allocations are required' });
  }

  const trades: Array<{
    type: string;
    action: string;
    amount: number;
    percentage: number;
  }> = [];

  // This would typically compare with current holdings
  // For now, we'll just validate the allocations
  const total = targetAllocations.reduce((sum: number, a: { percentage: number }) => sum + a.percentage, 0);
  if (Math.abs(total - 100) > 0.01) {
    return res.status(400).json({ error: 'Total allocation must equal 100%' });
  }

  targetAllocations.forEach((alloc: { type: string; percentage: number }) => {
    const targetAmount = (totalValue * alloc.percentage) / 100;
    trades.push({
      type: alloc.type,
      action: 'allocate',
      amount: Math.round(targetAmount * 100) / 100,
      percentage: alloc.percentage
    });
  });

  res.json({ trades });
});

export default router;

