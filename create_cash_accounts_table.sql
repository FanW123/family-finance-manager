-- ============================================
-- Cash Accounts 表创建脚本
-- ============================================
-- 在 Supabase Dashboard → SQL Editor 中运行此脚本
-- ============================================

-- 创建 cash_accounts 表
CREATE TABLE IF NOT EXISTS cash_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accounts JSONB NOT NULL, -- 存储现金账户数组 [{id, name, amount}, ...]
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id) -- 每个用户只有一条记录
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_cash_accounts_user_id ON cash_accounts(user_id);

-- 启用 Row Level Security
ALTER TABLE cash_accounts ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Users can view own cash accounts" ON cash_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cash accounts" ON cash_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cash accounts" ON cash_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cash accounts" ON cash_accounts
  FOR DELETE USING (auth.uid() = user_id);

