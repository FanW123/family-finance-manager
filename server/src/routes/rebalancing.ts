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

// Crypto symbol mapping (symbol -> CoinGecko ID)
const CRYPTO_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'DOGE': 'dogecoin',
  'SHIB': 'shiba-inu',
  'ADA': 'cardano',
  'SOL': 'solana',
  'MATIC': 'matic-network',
  'DOT': 'polkadot',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink'
};

// Get market data for stocks and crypto
router.get('/market-data/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const upperSymbol = symbol.toUpperCase();

  try {
    // Check if it's a known cryptocurrency
    if (CRYPTO_MAP[upperSymbol]) {
      const coinId = CRYPTO_MAP[upperSymbol];
      
      // Using CoinGecko API (no API key required, free tier)
      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
        params: {
          ids: coinId,
          vs_currencies: 'usd',
          include_24hr_change: 'true',
          include_24hr_vol: 'true',
          include_last_updated_at: 'true'
        }
      });

      const data = response.data[coinId];
      
      if (!data) {
        return res.status(404).json({ error: 'Cryptocurrency data not found' });
      }

      res.json({
        symbol: upperSymbol,
        price: data.usd,
        change: (data.usd * data.usd_24h_change / 100),
        changePercent: data.usd_24h_change.toFixed(2) + '%',
        volume: data.usd_24h_vol || 0,
        lastUpdated: new Date(data.last_updated_at * 1000).toISOString(),
        isCrypto: true
      });
    } else {
      // Using Yahoo Finance API for stocks
      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
        params: {
          interval: '1d',
          range: '1d'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      const data = response.data;
      
      if (data.chart.error) {
        return res.status(404).json({ 
          error: 'Symbol not found',
          message: data.chart.error.description 
        });
      }

      const result = data.chart.result[0];
      const meta = result.meta;

      if (!meta || !meta.regularMarketPrice) {
        return res.status(404).json({ error: 'No price data available for this symbol' });
      }

      res.json({
        symbol: meta.symbol,
        price: meta.regularMarketPrice,
        change: meta.regularMarketPrice - meta.previousClose,
        changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose * 100).toFixed(2) + '%',
        volume: meta.regularMarketVolume || 0,
        lastUpdated: new Date(meta.regularMarketTime * 1000).toISOString(),
        isCrypto: false
      });
    }
  } catch (error: any) {
    console.error('Error fetching market data:', error.message);
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Symbol not found' });
    }
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

