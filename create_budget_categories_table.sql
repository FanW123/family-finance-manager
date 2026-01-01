-- ============================================
-- Budget Categories 表创建脚本
-- ============================================
-- 在 Supabase Dashboard → SQL Editor 中运行此脚本
-- ============================================

-- 创建 budget_categories 表
CREATE TABLE IF NOT EXISTS budget_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categories JSONB NOT NULL, -- 存储完整的预算分类结构
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id) -- 每个用户只有一条记录
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_budget_categories_user_id ON budget_categories(user_id);

-- 启用 Row Level Security
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Users can view own budget categories" ON budget_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budget categories" ON budget_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget categories" ON budget_categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget categories" ON budget_categories
  FOR DELETE USING (auth.uid() = user_id);

