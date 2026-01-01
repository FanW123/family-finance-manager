// Vercel serverless function wrapper for Express app using Supabase (no local database files)
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// ---------- Supabase Client ----------

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY in environment variables.');
  console.error('Current values:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
  });
  throw new Error('Supabase environment variables are missing.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper: get per-request supabase client with user token for RLS
function getSupabaseClient(req: Request) {
  return (req as any).supabase || supabase;
}

// Helper: get user id from Authorization header (JWT from Supabase Auth)
async function getUserFromRequest(req: Request): Promise<string | null> {
  try {
    const authHeader = req.headers.authorization;
    console.log('[Auth] Checking authorization header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Auth] No valid authorization header found');
      return null;
    }

    const token = authHeader.substring(7);
    console.log('[Auth] Token extracted (first 20 chars):', token.substring(0, 20) + '...');
    console.log('[Auth] Supabase URL configured:', supabaseUrl ? 'Yes' : 'No');
    console.log('[Auth] Supabase Key configured:', supabaseKey ? 'Yes' : 'No');

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      console.error('[Auth] Error getting user from token:', {
        message: error?.message,
        status: error?.status,
        name: error?.name,
        hasUser: !!data?.user,
      });
      return null;
    }

    console.log('[Auth] User authenticated successfully:', data.user.id);
    return data.user.id;
  } catch (error: any) {
    console.error('[Auth] Exception getting user from token:', {
      message: error.message,
      stack: error.stack,
    });
    return null;
  }
}

// ---------- Express App ----------

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
// Request logger to debug routing on Vercel
app.use((req, _res, next) => {
  console.log('[REQ]', req.method, req.url);
  next();
});
// Strip /api prefix when deployed under Vercel /api function
app.use((req, _res, next) => {
  if (req.url === '/api') {
    console.log('[REQ] Rewriting /api -> /');
    req.url = '/';
  } else if (req.url.startsWith('/api/')) {
    console.log('[REQ] Rewriting', req.url, '->', req.url.slice(4));
    req.url = req.url.slice(4);
  }
  next();
});

// Health check (no auth)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth middleware
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.substring(7)
      : '';
    const userId = await getUserFromRequest(req);
    if (!userId) {
      console.error('Authentication failed: No userId returned');
      console.error('Auth header:', req.headers.authorization ? 'Present' : 'Missing');
      return res.status(401).json({
        error: 'Unauthorized. Please log in.',
        details: 'Failed to authenticate user. Please check your session.',
      });
    }
    (req as any).userId = userId;
    // Attach per-request supabase client with user token so RLS sees auth.uid()
    (req as any).supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: error.message,
    });
  }
}

// Apply auth middleware to all API routes below
app.use(requireAuth);

// ---------- Expenses Routes ----------

// Get all expenses
app.get('/expenses', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { month, year, category } = req.query;

    const sb = getSupabaseClient(req);
    let query = sb.from('expenses').select('*').eq('user_id', userId);

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
      return res.status(500).json({
        error: 'Failed to query expenses',
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error querying expenses:', error);
    res.status(500).json({ error: 'Failed to query expenses' });
  }
});

// Get expenses summary
app.get('/expenses/summary', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const sb = getSupabaseClient(req);
    const { data, error } = await sb
      .from('expenses')
      .select('category, amount')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      console.error('Error querying expenses summary:', error);
      return res.status(500).json({ error: 'Failed to query expenses summary' });
    }

    const summaryMap = new Map<string, { total: number; count: number }>();
    let total = 0;

    data?.forEach(expense => {
      const existing = summaryMap.get(expense.category) || { total: 0, count: 0 };
      summaryMap.set(expense.category, {
        total: existing.total + expense.amount,
        count: existing.count + 1,
      });
      total += expense.amount;
    });

    const summary = Array.from(summaryMap.entries())
      .map(([category, stats]) => ({
        category,
        total: stats.total,
        count: stats.count,
      }))
      .sort((a, b) => b.total - a.total);

    res.json({ summary, total });
  } catch (error) {
    console.error('Error querying expenses summary:', error);
    res.status(500).json({ error: 'Failed to query expenses summary' });
  }
});

// Add expense
app.post('/expenses', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { amount, category, description, date } = req.body;

    if (!amount || !category || !date) {
      return res.status(400).json({ 
        error: 'Amount, category, and date are required',
        message: '金额、分类和日期都是必填项'
      });
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ 
        error: 'Invalid amount',
        message: '金额必须是正数'
      });
    }

    const sb = getSupabaseClient(req);
    const { data, error } = await sb
      .from('expenses')
      .insert([
        {
          user_id: userId,
          amount: amountNum,
          category,
          description: description || '',
          date,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding expense:', error);
      
      let errorMessage = error.message;
      let hint = '请检查数据格式或稍后重试';
      
      if (error.code === '23505' || error.message.includes('unique')) {
        errorMessage = '数据已存在';
        hint = '该记录可能已存在';
      } else if (error.message.includes('relation') || error.message.includes('does not exist')) {
        errorMessage = '数据库表不存在';
        hint = '请确保expenses表已创建';
      } else if (error.code === '23514' || error.message.includes('check constraint')) {
        errorMessage = '数据验证失败';
        hint = '请检查金额是否在有效范围内';
      }
      
      return res.status(500).json({ 
        error: 'Failed to add expense',
        message: errorMessage,
        details: error.details,
        hint: error.hint || hint,
        code: error.code
      });
    }

    res.json({ id: data.id, message: 'Expense added successfully' });
  } catch (error: any) {
    console.error('Error adding expense:', error);
    res.status(500).json({ 
      error: 'Failed to add expense',
      message: error?.message || '未知错误'
    });
  }
});

// Get all incomes
app.get('/incomes', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { month, year } = req.query;

    const sb = getSupabaseClient(req);
    let query = sb.from('incomes').select('*').eq('user_id', userId);

    if (month && year) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      query = query.gte('date', startDate).lte('date', endDate);
    }

    query = query.order('date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error querying incomes:', error);
      return res.status(500).json({
        error: 'Failed to query incomes',
        message: error.message,
      });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error querying incomes:', error);
    res.status(500).json({ error: 'Failed to query incomes' });
  }
});

// Add income
app.post('/incomes', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { amount, source, description, date } = req.body;

    if (!amount || !source || !date) {
      return res.status(400).json({ error: 'Amount, source, and date are required' });
    }

    // Validate amount is a valid number
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Invalid amount. Must be a positive number.' });
    }

    // Check if amount is too large (DECIMAL(15,2) max is 9999999999999.99)
    if (amountNum > 9999999999999.99) {
      return res.status(400).json({ 
        error: 'Amount too large',
        message: `金额过大。最大支持：$9,999,999,999,999.99`,
        maxAmount: 9999999999999.99
      });
    }

    const sb = getSupabaseClient(req);
    
    // First check if table exists by trying to query it
    const tableCheck = await sb.from('incomes').select('id').limit(1);
    if (tableCheck.error && tableCheck.error.code === '42P01') {
      return res.status(500).json({ 
        error: 'Table does not exist',
        message: 'incomes表不存在',
        hint: '请在Supabase中执行create_incomes_table.sql脚本创建表'
      });
    }

    const { data, error } = await sb
      .from('incomes')
      .insert([
        {
          user_id: userId,
          amount: amountNum,
          source,
          description: description || '',
          date,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding income:', error);
      
      // Check for specific error types
      let errorMessage = error.message;
      let hint = '请确保数据库中的incomes表已创建';
      
      if (error.code === '23514' || error.message.includes('check constraint')) {
        errorMessage = '数据验证失败：金额可能超出范围';
        hint = '请确保金额在有效范围内（最大：$9,999,999,999,999.99）';
      } else if (error.code === '23505' || error.message.includes('unique')) {
        errorMessage = '数据已存在';
        hint = '该记录可能已存在';
      } else if (error.message.includes('relation') || error.message.includes('does not exist')) {
        errorMessage = '数据库表不存在';
        hint = '请在Supabase中执行create_incomes_table.sql脚本创建表';
      }
      
      return res.status(500).json({ 
        error: 'Failed to add income',
        message: errorMessage,
        details: error.details,
        hint: error.hint || hint,
        code: error.code
      });
    }

    res.json({ id: data.id, message: 'Income added successfully' });
  } catch (error: any) {
    console.error('Error adding income:', error);
    res.status(500).json({ 
      error: 'Failed to add income',
      message: error?.message || '未知错误',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    });
  }
});

// Update income
app.put('/incomes/:id', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { amount, source, description, date } = req.body;

    if (!amount || !source || !date) {
      return res.status(400).json({ error: 'Amount, source, and date are required' });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Invalid amount. Must be a positive number.' });
    }

    if (amountNum > 9999999999999.99) {
      return res.status(400).json({ 
        error: 'Amount too large',
        message: `金额过大。最大支持：$9,999,999,999,999.99`
      });
    }

    const sb = getSupabaseClient(req);
    const { data, error } = await sb
      .from('incomes')
      .update({
        amount: amountNum,
        source,
        description: description || '',
        date,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating income:', error);
      return res.status(500).json({ 
        error: 'Failed to update income',
        message: error.message
      });
    }

    res.json({ id: data.id, message: 'Income updated successfully' });
  } catch (error: any) {
    console.error('Error updating income:', error);
    res.status(500).json({ 
      error: 'Failed to update income',
      message: error?.message || '未知错误'
    });
  }
});

// Delete income
app.delete('/incomes/:id', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const sb = getSupabaseClient(req);
    const { error } = await sb
      .from('incomes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting income:', error);
      return res.status(500).json({ error: 'Failed to delete income' });
    }

    res.json({ message: 'Income deleted successfully' });
  } catch (error) {
    console.error('Error deleting income:', error);
    res.status(500).json({ error: 'Failed to delete income' });
  }
});

// Update expense
app.put('/expenses/:id', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { amount, category, description, date } = req.body;

    const sb = getSupabaseClient(req);
    const { data, error} = await sb
      .from('expenses')
      .update({
        amount,
        category,
        description,
        date,
      })
      .eq('id', id)
      .eq('user_id', userId)
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
app.delete('/expenses/:id', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const sb = getSupabaseClient(req);
    const { error } = await sb
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

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

// ---------- Investments Routes ----------

// Get all investments
app.get('/investments', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const sb = getSupabaseClient(req);
    const { data, error } = await sb
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error querying investments:', error);
      return res.status(500).json({
        error: 'Failed to query investments',
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
    }

    res.json(data || []);
  } catch (error: any) {
    console.error('Error querying investments:', error);
    res.status(500).json({
      error: 'Failed to query investments',
      message: error.message,
    });
  }
});

// Get investments by type
app.get('/investments/by-type', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const sb = getSupabaseClient(req);
    const { data, error } = await sb.from('investments').select('type, amount').eq('user_id', userId);

    if (error) {
      console.error('Error querying investments by type:', error);
      return res.status(500).json({ error: 'Failed to query investments' });
    }

    const summaryMap = new Map<string, { total_amount: number; count: number }>();

    data?.forEach(inv => {
      const existing = summaryMap.get(inv.type) || { total_amount: 0, count: 0 };
      summaryMap.set(inv.type, {
        total_amount: existing.total_amount + inv.amount,
        count: existing.count + 1,
      });
    });

    const summary = Array.from(summaryMap.entries()).map(([type, stats]) => ({
      type,
      total_amount: stats.total_amount,
      count: stats.count,
    }));

    res.json(summary);
  } catch (error) {
    console.error('Error querying investments by type:', error);
    res.status(500).json({ error: 'Failed to query investments' });
  }
});

// Get current portfolio allocation
app.get('/investments/allocation', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const sb = getSupabaseClient(req);
    const { data, error } = await sb.from('investments').select('type, amount').eq('user_id', userId);

    if (error) {
      console.error('Error querying investments:', error);
      return res.status(500).json({ error: 'Failed to query investments' });
    }

    const typeMap = new Map<string, number>();
    data?.forEach(inv => {
      const current = typeMap.get(inv.type) || 0;
      typeMap.set(inv.type, current + inv.amount);
    });

    const investments = Array.from(typeMap.entries()).map(([type, total]) => ({
      type,
      total,
    }));

    const totalValue = investments.reduce((sum, inv) => sum + inv.total, 0);

    const allocation = investments.map(inv => ({
      type: inv.type,
      amount: inv.total,
      percentage: totalValue > 0 ? (inv.total / totalValue) * 100 : 0,
    }));

    const types = ['stocks', 'bonds', 'cash'];
    types.forEach(type => {
      if (!allocation.find(a => a.type === type)) {
        allocation.push({
          type,
          amount: 0,
          percentage: 0,
        });
      }
    });

    const { data: targetData, error: targetError } = await sb
      .from('target_allocation')
      .select('*')
      .eq('user_id', userId);

    if (targetError) {
      console.error('Error querying target allocation:', targetError);
      return res.status(500).json({ error: 'Failed to query target allocation' });
    }

    const targetAllocation = (targetData || []).map(item => ({
      type: item.type,
      percentage: item.percentage,
    }));

    res.json({
      current: allocation,
      target: targetAllocation,
      totalValue,
    });
  } catch (error) {
    console.error('Error getting allocation:', error);
    res.status(500).json({ error: 'Failed to get allocation' });
  }
});

// Add investment
app.post('/investments', async (req, res) => {
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

    const sb = getSupabaseClient(req);
    const { data, error } = await sb
      .from('investments')
      .insert([
        {
          user_id: userId,
          type,
          symbol: symbol || null,
          name,
          amount,
          price: price || null,
          quantity: quantity || null,
          account: account || null,
          date,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding investment:', error);
      return res.status(500).json({
        error: 'Failed to add investment',
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    }

    console.log('Investment added successfully:', data.id);
    res.json({ id: data.id, message: 'Investment added successfully' });
  } catch (error: any) {
    console.error('Error adding investment:', error);
    res.status(500).json({
      error: 'Failed to add investment',
      message: error.message,
    });
  }
});

// Update investment
app.put('/investments/:id', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { type, symbol, name, amount, price, quantity, account, date } = req.body;

    const sb = getSupabaseClient(req);
    const { data, error } = await sb
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
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
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
app.delete('/investments/:id', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const sb = getSupabaseClient(req);
    const { error } = await sb
      .from('investments')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

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

// Target allocation (GET object format)
app.get('/investments/target-allocation', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const sb = getSupabaseClient(req);
    const { data, error } = await sb
      .from('target_allocation')
      .select('type, percentage')
      .eq('user_id', userId);

    if (error) {
      console.error('Error querying target allocation:', error);
      return res.status(500).json({ error: 'Failed to query target allocation' });
    }

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

// Target allocation (POST simple stocks/bonds/cash)
app.post('/investments/target-allocation', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { stocks, bonds, cash } = req.body;

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
      { user_id: userId, type: 'cash', percentage: cash },
    ];

    const sb = getSupabaseClient(req);
    const { error } = await sb.from('target_allocation').upsert(allocations, {
      onConflict: 'user_id,type',
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

// ---------- Rebalancing Routes ----------

// Get rebalancing suggestions
app.get('/rebalancing/suggestions', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const sb = getSupabaseClient(req);
    const { data: investmentsData, error: investmentsError } = await sb
      .from('investments')
      .select('type, amount')
      .eq('user_id', userId);

    if (investmentsError) {
      console.error('Error querying investments:', investmentsError);
      return res.status(500).json({ error: 'Failed to query investments' });
    }

    const typeMap = new Map<string, number>();
    investmentsData?.forEach(inv => {
      const current = typeMap.get(inv.type) || 0;
      typeMap.set(inv.type, current + inv.amount);
    });

    const investments = Array.from(typeMap.entries()).map(([type, total]) => ({
      type,
      total,
    }));

    const totalValue = investments.reduce((sum, inv) => sum + inv.total, 0);

    if (totalValue === 0) {
      return res.json({
        suggestions: [],
        message: 'No investments found',
      });
    }

    const { data: targetData, error: targetError } = await sb
      .from('target_allocation')
      .select('*')
      .eq('user_id', userId);

    if (targetError) {
      console.error('Error querying target allocation:', targetError);
      return res.status(500).json({ error: 'Failed to query target allocation' });
    }

    const targetAllocation = (targetData || []) as Array<{ type: string; percentage: number }>;

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

      if (Math.abs(difference) > totalValue * 0.01) {
        suggestions.push({
          type,
          currentAmount,
          currentPercentage: Math.round(currentPercentage * 100) / 100,
          targetPercentage,
          targetAmount: Math.round(targetAmount * 100) / 100,
          difference: Math.round(difference * 100) / 100,
          action: difference > 0 ? 'buy' : 'sell',
        });
      }
    });

    suggestions.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

    res.json({
      suggestions,
      totalValue: Math.round(totalValue * 100) / 100,
    });
  } catch (error) {
    console.error('Error generating rebalancing suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Crypto symbol mapping
const CRYPTO_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  DOGE: 'dogecoin',
  SHIB: 'shiba-inu',
  ADA: 'cardano',
  SOL: 'solana',
  MATIC: 'matic-network',
  DOT: 'polkadot',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
};

// Get market data for stocks and crypto
app.get('/rebalancing/market-data/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const upperSymbol = symbol.toUpperCase();

  try {
    if (CRYPTO_MAP[upperSymbol]) {
      const coinId = CRYPTO_MAP[upperSymbol];

      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: coinId,
          vs_currencies: 'usd',
          include_24hr_change: 'true',
          include_24hr_vol: 'true',
          include_last_updated_at: 'true',
        },
      });

      const data = response.data[coinId];

      if (!data) {
        return res.status(404).json({ error: 'Cryptocurrency data not found' });
      }

      res.json({
        symbol: upperSymbol,
        price: data.usd,
        change: (data.usd * data.usd_24h_change) / 100,
        changePercent: data.usd_24h_change.toFixed(2) + '%',
        volume: data.usd_24h_vol || 0,
        lastUpdated: new Date(data.last_updated_at * 1000).toISOString(),
        isCrypto: true,
      });
    } else {
      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
        params: {
          interval: '1d',
          range: '1d',
        },
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });

      const data = response.data;

      if (data.chart.error) {
        return res.status(404).json({
          error: 'Symbol not found',
          message: data.chart.error.description,
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
        changePercent:
          (((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100).toFixed(2) + '%',
        volume: meta.regularMarketVolume || 0,
        lastUpdated: new Date(meta.regularMarketTime * 1000).toISOString(),
        isCrypto: false,
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

// Calculate rebalancing trades (validation only)
app.post('/rebalancing/calculate-trades', (req, res) => {
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
      percentage: alloc.percentage,
    });
  });

  res.json({ trades });
});

// Get budget categories
app.get('/budget-categories', async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const sb = getSupabaseClient(req);
    const { data, error } = await sb
      .from('budget_categories')
      .select('categories')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no record found, return null (not an error)
      if (error.code === 'PGRST116') {
        return res.json({ categories: null });
      }
      console.error('Error fetching budget categories:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch budget categories',
        message: error.message
      });
    }

    res.json({ categories: data?.categories || null });
  } catch (error: any) {
    console.error('Error fetching budget categories:', error);
    res.status(500).json({ 
      error: 'Failed to fetch budget categories',
      message: error?.message || '未知错误'
    });
  }
});

// Save budget categories
app.post('/budget-categories', async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { categories } = req.body;

    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'categories must be an array'
      });
    }

    const sb = getSupabaseClient(req);
    
    // Use upsert to insert or update
    const { data, error } = await sb
      .from('budget_categories')
      .upsert({
        user_id: userId,
        categories: categories,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving budget categories:', error);
      
      let errorMessage = error.message;
      let hint = '请检查数据格式或稍后重试';
      
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        errorMessage = '数据库表不存在';
        hint = '请在Supabase中执行create_budget_categories_table.sql脚本创建表';
      }
      
      return res.status(500).json({ 
        error: 'Failed to save budget categories',
        message: errorMessage,
        details: error.details,
        hint: error.hint || hint,
        code: error.code
      });
    }

    res.json({ 
      id: data.id, 
      message: 'Budget categories saved successfully' 
    });
  } catch (error: any) {
    console.error('Error saving budget categories:', error);
    res.status(500).json({ 
      error: 'Failed to save budget categories',
      message: error?.message || '未知错误'
    });
  }
});

// Global error handler (last)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Export for Vercel serverless function
// Vercel expects a request handler, not just the Express app
export default app;

