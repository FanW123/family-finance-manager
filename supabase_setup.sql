-- ============================================
-- FirePath Supabase 数据库设置脚本
-- ============================================
-- 在 Supabase Dashboard → SQL Editor 中运行此脚本
-- ============================================

-- 1. 启用 UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 创建 Expenses 表
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 创建 Budgets 表
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  monthly_limit REAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category)
);

-- 4. 创建 Investments 表
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('stocks', 'bonds', 'cash', 'crypto')),
  symbol TEXT,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  price REAL,
  quantity REAL,
  account TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. 创建 Target Allocation 表
CREATE TABLE IF NOT EXISTS target_allocation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('stocks', 'bonds', 'cash')),
  percentage REAL NOT NULL CHECK(percentage >= 0 AND percentage <= 100),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, type)
);

-- 6. 创建索引以提高性能
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_target_allocation_user_id ON target_allocation(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- ============================================
-- 7. 启用 Row Level Security (RLS)
-- ============================================
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_allocation ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. 创建 RLS 策略 - Expenses
-- ============================================
CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" ON expenses
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 9. 创建 RLS 策略 - Budgets
-- ============================================
CREATE POLICY "Users can view own budgets" ON budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets" ON budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets" ON budgets
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 10. 创建 RLS 策略 - Investments
-- ============================================
CREATE POLICY "Users can view own investments" ON investments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investments" ON investments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investments" ON investments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investments" ON investments
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 11. 创建 RLS 策略 - Target Allocation
-- ============================================
CREATE POLICY "Users can view own target_allocation" ON target_allocation
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own target_allocation" ON target_allocation
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own target_allocation" ON target_allocation
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own target_allocation" ON target_allocation
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 完成！
-- ============================================
-- 现在可以：
-- 1. 在 Supabase Dashboard → Authentication → Providers 中启用 Email 认证
-- 2. 在 Vercel 中设置环境变量
-- 3. 部署并测试应用
-- ============================================

