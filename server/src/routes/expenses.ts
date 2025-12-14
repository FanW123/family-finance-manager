import express from 'express';
import db from '../database.js';

const router = express.Router();

// Get all expenses
router.get('/', (req, res) => {
  const { month, year, category } = req.query;
  
  let query = 'SELECT * FROM expenses WHERE 1=1';
  const params: any[] = [];

  if (month && year) {
    const monthStr = String(month).padStart(2, '0');
    query += ' AND strftime(\'%m\', date) = ? AND strftime(\'%Y\', date) = ?';
    params.push(monthStr, String(year));
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY date DESC';

  try {
    const expenses = db.prepare(query).all(...params);
    res.json(expenses);
  } catch (error) {
    console.error('Error querying expenses:', error);
    res.status(500).json({ error: 'Failed to query expenses' });
  }
});

// Get expenses by month summary
router.get('/summary', (req, res) => {
  const { month, year } = req.query;
  
  if (!month || !year) {
    return res.status(400).json({ error: 'Month and year are required' });
  }

  const monthStr = String(month).padStart(2, '0');
  const yearStr = String(year);
  
  const query = `
    SELECT 
      category,
      SUM(amount) as total,
      COUNT(*) as count
    FROM expenses
    WHERE strftime('%m', date) = ? AND strftime('%Y', date) = ?
    GROUP BY category
    ORDER BY total DESC
  `;

  const summary = db.prepare(query).all(monthStr, yearStr);

  const totalQuery = `
    SELECT SUM(amount) as total
    FROM expenses
    WHERE strftime('%m', date) = ? AND strftime('%Y', date) = ?
  `;

  const total = db.prepare(totalQuery).get(monthStr, yearStr) as { total: number | null };

  res.json({
    summary,
    total: total.total || 0
  });
});

// Add expense
router.post('/', (req, res) => {
  const { amount, category, description, date } = req.body;

  if (!amount || !category || !date) {
    return res.status(400).json({ error: 'Amount, category, and date are required' });
  }

  const insert = db.prepare(`
    INSERT INTO expenses (amount, category, description, date)
    VALUES (?, ?, ?, ?)
  `);

  const result = insert.run(amount, category, description || '', date);
  res.json({ id: result.lastInsertRowid, message: 'Expense added successfully' });
});

// Update expense
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { amount, category, description, date } = req.body;

  const update = db.prepare(`
    UPDATE expenses
    SET amount = ?, category = ?, description = ?, date = ?
    WHERE id = ?
  `);

  const result = update.run(amount, category, description, date, id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  res.json({ message: 'Expense updated successfully' });
});

// Delete expense
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const del = db.prepare('DELETE FROM expenses WHERE id = ?');
  const result = del.run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  res.json({ message: 'Expense deleted successfully' });
});

// Budget routes
router.get('/budgets', (req, res) => {
  const budgets = db.prepare('SELECT * FROM budgets ORDER BY category').all();
  res.json(budgets);
});

router.post('/budgets', (req, res) => {
  const { category, monthly_limit } = req.body;

  if (!category || monthly_limit === undefined) {
    return res.status(400).json({ error: 'Category and monthly_limit are required' });
  }

  const insert = db.prepare(`
    INSERT INTO budgets (category, monthly_limit)
    VALUES (?, ?)
    ON CONFLICT(category) DO UPDATE SET
      monthly_limit = excluded.monthly_limit,
      updated_at = CURRENT_TIMESTAMP
  `);

  insert.run(category, monthly_limit);
  res.json({ message: 'Budget saved successfully' });
});

// Get budget analysis
router.get('/budget-analysis', (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ error: 'Month and year are required' });
  }

  const budgets = db.prepare('SELECT * FROM budgets').all() as Array<{
    category: string;
    monthly_limit: number;
  }>;

  const monthStr = String(month).padStart(2, '0');
  const yearStr = String(year);
  
  const expenses = db.prepare(`
    SELECT category, SUM(amount) as spent
    FROM expenses
    WHERE strftime('%m', date) = ? AND strftime('%Y', date) = ?
    GROUP BY category
  `).all(monthStr, yearStr) as Array<{
    category: string;
    spent: number;
  }>;

  const expenseMap = new Map(expenses.map(e => [e.category, e.spent]));

  const analysis = budgets.map(budget => {
    const spent = expenseMap.get(budget.category) || 0;
    const remaining = budget.monthly_limit - spent;
    const percentage = (spent / budget.monthly_limit) * 100;

    return {
      category: budget.category,
      budget: budget.monthly_limit,
      spent,
      remaining,
      percentage: Math.round(percentage * 100) / 100,
      overBudget: spent > budget.monthly_limit
    };
  });

  // Add categories that have expenses but no budget
  expenses.forEach(expense => {
    if (!budgets.find(b => b.category === expense.category)) {
      analysis.push({
        category: expense.category,
        budget: 0,
        spent: expense.spent,
        remaining: -expense.spent,
        percentage: 0,
        overBudget: false
      });
    }
  });

  res.json(analysis);
});

export default router;

