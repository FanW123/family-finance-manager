import express from 'express';
import supabase, { getUserFromRequest } from '../database.js';

const router = express.Router();

// Middleware to require authentication
async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userId = await getUserFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  (req as any).userId = userId;
  next();
}

// Apply auth middleware to all routes
router.use(requireAuth);

// Get all expenses
router.get('/', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { month, year, category } = req.query;
    
    let query = supabase.from('expenses').select('*').eq('user_id', userId);

    if (month && year) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      query = query.gte('date', startDate).lte('date', endDate);
    }

    if (category) {
      query = query.eq('category', category as string);
    }

    query = query.order('date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error querying expenses:', error);
      return res.status(500).json({ error: 'Failed to query expenses' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error querying expenses:', error);
    res.status(500).json({ error: 'Failed to query expenses' });
  }
});

// Get expenses by month summary
router.get('/summary', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const { data, error } = await supabase
      .from('expenses')
      .select('category, amount')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      console.error('Error querying expenses summary:', error);
      return res.status(500).json({ error: 'Failed to query expenses summary' });
    }

    // Group by category
    const summaryMap = new Map<string, { total: number; count: number }>();
    let total = 0;

    data?.forEach(expense => {
      const existing = summaryMap.get(expense.category) || { total: 0, count: 0 };
      summaryMap.set(expense.category, {
        total: existing.total + expense.amount,
        count: existing.count + 1
      });
      total += expense.amount;
    });

    const summary = Array.from(summaryMap.entries())
      .map(([category, stats]) => ({
        category,
        total: stats.total,
        count: stats.count
      }))
      .sort((a, b) => b.total - a.total);

    res.json({ summary, total });
  } catch (error) {
    console.error('Error querying expenses summary:', error);
    res.status(500).json({ error: 'Failed to query expenses summary' });
  }
});

// Add expense
router.post('/', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { amount, category, description, date } = req.body;

    if (!amount || !category || !date) {
      return res.status(400).json({ error: 'Amount, category, and date are required' });
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert([{
        user_id: userId,
        amount,
        category,
        description: description || '',
        date
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding expense:', error);
      return res.status(500).json({ error: 'Failed to add expense' });
    }

    res.json({ id: data.id, message: 'Expense added successfully' });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

// Update expense
router.put('/:id', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { amount, category, description, date } = req.body;

    const { data, error } = await supabase
      .from('expenses')
      .update({
        amount,
        category,
        description,
        date
      })
      .eq('id', id)
      .eq('user_id', userId) // Ensure user can only update their own expenses
      .select()
      .single();

    if (error) {
      console.error('Error updating expense:', error);
      return res.status(500).json({ error: 'Failed to update expense' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Expense updated successfully' });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Ensure user can only delete their own expenses

    if (error) {
      console.error('Error deleting expense:', error);
      return res.status(500).json({ error: 'Failed to delete expense' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Budget routes
router.get('/budgets', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .order('category');

    if (error) {
      console.error('Error querying budgets:', error);
      return res.status(500).json({ error: 'Failed to query budgets' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error querying budgets:', error);
    res.status(500).json({ error: 'Failed to query budgets' });
  }
});

router.post('/budgets', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { category, monthly_limit } = req.body;

    if (!category || monthly_limit === undefined) {
      return res.status(400).json({ error: 'Category and monthly_limit are required' });
    }

    const { error } = await supabase
      .from('budgets')
      .upsert({
        user_id: userId,
        category,
        monthly_limit,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,category'
      });

    if (error) {
      console.error('Error saving budget:', error);
      return res.status(500).json({ error: 'Failed to save budget' });
    }

    res.json({ message: 'Budget saved successfully' });
  } catch (error) {
    console.error('Error saving budget:', error);
    res.status(500).json({ error: 'Failed to save budget' });
  }
});

// Delete budget
router.post('/budgets/delete', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('category', category)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting budget:', error);
      return res.status(500).json({ error: 'Failed to delete budget' });
    }

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

// Get budget analysis
router.get('/budget-analysis', async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    const userId = (req as any).userId;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    // Get budgets
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId);

    if (budgetsError) {
      console.error('Error querying budgets:', budgetsError);
      return res.status(500).json({ error: 'Failed to query budgets' });
    }

    // Get expenses for the month
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('category, amount')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (expensesError) {
      console.error('Error querying expenses:', expensesError);
      return res.status(500).json({ error: 'Failed to query expenses' });
    }

    // Group expenses by category
    const expenseMap = new Map<string, number>();
    expenses?.forEach(expense => {
      const current = expenseMap.get(expense.category) || 0;
      expenseMap.set(expense.category, current + expense.amount);
    });

    // Build analysis
    const analysis = (budgets || []).map(budget => {
      const spent = expenseMap.get(budget.category) || 0;
      const remaining = budget.monthly_limit - spent;
      const percentage = (spent / budget.monthly_limit) * 100;

      return {
        category: budget.category,
        budget: budget.monthly_limit,
        spent,
        remaining,
        percentage: Math.round(percentage * 100) / 100,
        overBudget: spent > budget.monthly_limit,
        hasNoBudget: false
      };
    });

    // Add categories that have expenses but no budget
    expenseMap.forEach((spent, category) => {
      if (!budgets?.find(b => b.category === category)) {
        analysis.push({
          category,
          budget: 0,
          spent,
          remaining: -spent,
          percentage: 0,
          overBudget: false,
          hasNoBudget: true
        });
      }
    });

    res.json(analysis);
  } catch (error) {
    console.error('Error generating budget analysis:', error);
    res.status(500).json({ error: 'Failed to generate budget analysis' });
  }
});

export default router;
