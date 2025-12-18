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

// Get all investments
router.get('/', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error querying investments:', error);
      return res.status(500).json({ error: 'Failed to query investments' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error querying investments:', error);
    res.status(500).json({ error: 'Failed to query investments' });
  }
});

// Get investments by type
router.get('/by-type', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { data, error } = await supabase
      .from('investments')
      .select('type, amount')
      .eq('user_id', userId);

    if (error) {
      console.error('Error querying investments by type:', error);
      return res.status(500).json({ error: 'Failed to query investments' });
    }

    // Group by type
    const summaryMap = new Map<string, { total_amount: number; count: number }>();
    
    data?.forEach(inv => {
      const existing = summaryMap.get(inv.type) || { total_amount: 0, count: 0 };
      summaryMap.set(inv.type, {
        total_amount: existing.total_amount + inv.amount,
        count: existing.count + 1
      });
    });

    const summary = Array.from(summaryMap.entries()).map(([type, stats]) => ({
      type,
      total_amount: stats.total_amount,
      count: stats.count
    }));

    res.json(summary);
  } catch (error) {
    console.error('Error querying investments by type:', error);
    res.status(500).json({ error: 'Failed to query investments' });
  }
});

// Get current portfolio allocation
router.get('/allocation', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { data, error } = await supabase
      .from('investments')
      .select('type, amount')
      .eq('user_id', userId);

    if (error) {
      console.error('Error querying investments:', error);
      return res.status(500).json({ error: 'Failed to query investments' });
    }

    // Group by type
    const typeMap = new Map<string, number>();
    data?.forEach(inv => {
      const current = typeMap.get(inv.type) || 0;
      typeMap.set(inv.type, current + inv.amount);
    });

    const investments = Array.from(typeMap.entries()).map(([type, total]) => ({
      type,
      total
    }));

    const totalValue = investments.reduce((sum, inv) => sum + inv.total, 0);

    const allocation = investments.map(inv => ({
      type: inv.type,
      amount: inv.total,
      percentage: totalValue > 0 ? (inv.total / totalValue * 100) : 0
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

    // Get target allocation
    const { data: targetData, error: targetError } = await supabase
      .from('target_allocation')
      .select('*')
      .eq('user_id', userId);

    if (targetError) {
      console.error('Error querying target allocation:', targetError);
      return res.status(500).json({ error: 'Failed to query target allocation' });
    }

    const targetAllocation = (targetData || []).map(item => ({
      type: item.type,
      percentage: item.percentage
    }));

    res.json({
      current: allocation,
      target: targetAllocation,
      totalValue
    });
  } catch (error) {
    console.error('Error getting allocation:', error);
    res.status(500).json({ error: 'Failed to get allocation' });
  }
});

// Add investment
router.post('/', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { type, symbol, name, amount, price, quantity, account, date } = req.body;

    console.log('Add investment request:', { type, symbol, name, amount, price, quantity, account, date });

    if (!type || !name || name.trim() === '' || amount === undefined || !date) {
      console.error('Validation failed: missing required fields', { type, name, amount, date });
      return res.status(400).json({ error: 'Type, name, amount, and date are required' });
    }

    if (!['stocks', 'bonds', 'cash', 'crypto'].includes(type)) {
      console.error('Validation failed: invalid type', type);
      return res.status(400).json({ error: 'Type must be stocks, bonds, cash, or crypto' });
    }

    const { data, error } = await supabase
      .from('investments')
      .insert([{
        user_id: userId,
        type,
        symbol: symbol || null,
        name,
        amount,
        price: price || null,
        quantity: quantity || null,
        account: account || null,
        date
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding investment:', error);
      return res.status(500).json({ 
        error: 'Failed to add investment',
        message: error.message
      });
    }

    console.log('Investment added successfully:', data.id);
    res.json({ id: data.id, message: 'Investment added successfully' });
  } catch (error: any) {
    console.error('Error adding investment:', error);
    res.status(500).json({ 
      error: 'Failed to add investment',
      message: error.message
    });
  }
});

// Get target allocation
router.get('/target-allocation', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { data, error } = await supabase
      .from('target_allocation')
      .select('type, percentage')
      .eq('user_id', userId);

    if (error) {
      console.error('Error querying target allocation:', error);
      return res.status(500).json({ error: 'Failed to query target allocation' });
    }

    // Convert array to object format { stocks: 60, bonds: 30, cash: 10 }
    const result = (data || []).reduce((acc: any, item) => {
      acc[item.type] = item.percentage;
      return acc;
    }, {});

    res.json(result);
  } catch (error) {
    console.error('Error querying target allocation:', error);
    res.status(500).json({ error: 'Failed to query target allocation' });
  }
});

// Update target allocation
router.post('/target-allocation', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { stocks, bonds, cash } = req.body;

    // Validate
    if (stocks === undefined || bonds === undefined || cash === undefined) {
      return res.status(400).json({ error: 'stocks, bonds, and cash are required' });
    }

    const total = stocks + bonds + cash;
    if (Math.abs(total - 100) > 0.01) {
      return res.status(400).json({ error: 'Total allocation must equal 100%' });
    }

    const allocations = [
      { user_id: userId, type: 'stocks', percentage: stocks },
      { user_id: userId, type: 'bonds', percentage: bonds },
      { user_id: userId, type: 'cash', percentage: cash }
    ];

    const { error } = await supabase
      .from('target_allocation')
      .upsert(allocations, {
        onConflict: 'user_id,type'
      });

    if (error) {
      console.error('Error updating target allocation:', error);
      return res.status(500).json({ error: 'Failed to update target allocation' });
    }

    res.json({ message: 'Target allocation updated successfully' });
  } catch (error) {
    console.error('Error updating target allocation:', error);
    res.status(500).json({ error: 'Failed to update target allocation' });
  }
});

// Legacy PUT endpoint for backward compatibility
router.put('/target-allocation', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { allocations } = req.body;

    if (!Array.isArray(allocations)) {
      return res.status(400).json({ error: 'Allocations must be an array' });
    }

    const total = allocations.reduce((sum: number, a: { percentage: number }) => sum + a.percentage, 0);
    if (Math.abs(total - 100) > 0.01) {
      return res.status(400).json({ error: 'Total allocation must equal 100%' });
    }

    // Add user_id to each allocation
    const allocationsWithUserId = allocations.map((alloc: { type: string; percentage: number }) => ({
      user_id: userId,
      ...alloc
    }));

    const { error } = await supabase
      .from('target_allocation')
      .upsert(allocationsWithUserId, {
        onConflict: 'user_id,type'
      });

    if (error) {
      console.error('Error updating target allocation:', error);
      return res.status(500).json({ error: 'Failed to update target allocation' });
    }

    res.json({ message: 'Target allocation updated successfully' });
  } catch (error) {
    console.error('Error updating target allocation:', error);
    res.status(500).json({ error: 'Failed to update target allocation' });
  }
});

// Update investment
router.put('/:id', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { type, symbol, name, amount, price, quantity, account, date } = req.body;

    const { data, error } = await supabase
      .from('investments')
      .update({
        type,
        symbol,
        name,
        amount,
        price,
        quantity,
        account,
        date,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId) // Ensure user can only update their own investments
      .select()
      .single();

    if (error) {
      console.error('Error updating investment:', error);
      return res.status(500).json({ error: 'Failed to update investment' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    res.json({ message: 'Investment updated successfully' });
  } catch (error) {
    console.error('Error updating investment:', error);
    res.status(500).json({ error: 'Failed to update investment' });
  }
});

// Delete investment
router.delete('/:id', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const { error } = await supabase
      .from('investments')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Ensure user can only delete their own investments

    if (error) {
      console.error('Error deleting investment:', error);
      return res.status(500).json({ error: 'Failed to delete investment' });
    }

    res.json({ message: 'Investment deleted successfully' });
  } catch (error) {
    console.error('Error deleting investment:', error);
    res.status(500).json({ error: 'Failed to delete investment' });
  }
});

export default router;
