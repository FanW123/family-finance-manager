import express from 'express';
import db from '../database.js';

const router = express.Router();

// Get all investments
router.get('/', (req, res) => {
  const investments = db.prepare('SELECT * FROM investments ORDER BY date DESC').all();
  res.json(investments);
});

// Get investments by type
router.get('/by-type', (req, res) => {
  const query = `
    SELECT 
      type,
      SUM(amount) as total_amount,
      COUNT(*) as count
    FROM investments
    GROUP BY type
  `;

  const summary = db.prepare(query).all();
  res.json(summary);
});

// Get current portfolio allocation
router.get('/allocation', async (req, res) => {
  const investments = db.prepare(`
    SELECT type, SUM(amount) as total
    FROM investments
    GROUP BY type
  `).all() as Array<{ type: string; total: number }>;

  const totalValue = investments.reduce((sum, inv) => sum + inv.total, 0);

  const allocation = investments.map(inv => ({
    type: inv.type,
    amount: inv.total,
    percentage: totalValue > 0 ? (inv.total / totalValue) * 100 : 0
  }));

  // Add missing types with 0
  const types = ['stocks', 'bonds', 'cash'];
  types.forEach(type => {
    if (!allocation.find(a => a.type === type)) {
      allocation.push({
        type,
        amount: 0,
        percentage: 0
      });
    }
  });

  const targetAllocation = db.prepare('SELECT * FROM target_allocation').all() as Array<{
    type: string;
    percentage: number;
  }>;

  res.json({
    current: allocation,
    target: targetAllocation,
    totalValue
  });
});

// Add investment
router.post('/', (req, res) => {
  const { type, symbol, name, amount, price, quantity, account, date } = req.body;

  if (!type || !name || amount === undefined || !date) {
    return res.status(400).json({ error: 'Type, name, amount, and date are required' });
  }

  if (!['stocks', 'bonds', 'cash', 'crypto'].includes(type)) {
    return res.status(400).json({ error: 'Type must be stocks, bonds, cash, or crypto' });
  }

  const insert = db.prepare(`
    INSERT INTO investments (type, symbol, name, amount, price, quantity, account, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(type, symbol || null, name, amount, price || null, quantity || null, account || null, date);
  res.json({ id: result.lastInsertRowid, message: 'Investment added successfully' });
});

// Update target allocation (must be before /:id route to avoid route conflict)
router.put('/target-allocation', (req, res) => {
  const { allocations } = req.body;

  if (!Array.isArray(allocations)) {
    return res.status(400).json({ error: 'Allocations must be an array' });
  }

  const total = allocations.reduce((sum: number, a: { percentage: number }) => sum + a.percentage, 0);
  if (Math.abs(total - 100) > 0.01) {
    return res.status(400).json({ error: 'Total allocation must equal 100%' });
  }

  const update = db.prepare(`
    UPDATE target_allocation
    SET percentage = ?, updated_at = CURRENT_TIMESTAMP
    WHERE type = ?
  `);

  allocations.forEach((alloc: { type: string; percentage: number }) => {
    update.run(alloc.percentage, alloc.type);
  });

  res.json({ message: 'Target allocation updated successfully' });
});

// Update investment
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { type, symbol, name, amount, price, quantity, account, date } = req.body;

  const update = db.prepare(`
    UPDATE investments
    SET type = ?, symbol = ?, name = ?, amount = ?, price = ?, quantity = ?, account = ?, date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const result = update.run(type, symbol, name, amount, price, quantity, account, date, id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Investment not found' });
  }

  res.json({ message: 'Investment updated successfully' });
});

// Delete investment
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const del = db.prepare('DELETE FROM investments WHERE id = ?');
  const result = del.run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Investment not found' });
  }

  res.json({ message: 'Investment deleted successfully' });
});

export default router;

