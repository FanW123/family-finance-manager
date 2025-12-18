# Supabase 设置指南

## 1. 创建 Supabase 项目

1. 访问 [https://supabase.com](https://supabase.com)
2. 注册/登录账户
3. 点击 "New Project"
4. 填写项目信息：
   - Project Name: `firepath` (或你喜欢的名字)
   - Database Password: 设置一个强密码（**保存好！**）
   - Region: 选择离你最近的区域
5. 点击 "Create new project"
6. 等待项目创建完成（约 2 分钟）

## 2. 获取 API 密钥

1. 在 Supabase Dashboard，进入 **Settings** → **API**
2. 复制以下信息：
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_ANON_KEY)

## 3. 创建数据库表

**⚠️ 重要：所有表都包含 `user_id` 字段用于数据隔离！**

在 Supabase Dashboard，进入 **SQL Editor**，运行以下 SQL：

```sql
-- Enable UUID extension (for user_id)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  monthly_limit REAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category)
);

-- Investments table
CREATE TABLE IF NOT EXISTS investments (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('stocks', 'bonds', 'cash', 'crypto')),
  symbol TEXT,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  price REAL,
  quantity REAL,
  account TEXT,
  date TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Target allocation table
CREATE TABLE IF NOT EXISTS target_allocation (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('stocks', 'bonds', 'cash')),
  percentage REAL NOT NULL CHECK(percentage >= 0 AND percentage <= 100),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_target_allocation_user_id ON target_allocation(user_id);
```

## 4. 启用 Row Level Security (RLS) 和用户隔离策略

**重要！** 为了数据安全，需要启用 RLS 并设置用户隔离策略。在 **SQL Editor** 中运行：

```sql
-- Enable RLS on all tables
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_allocation ENABLE ROW LEVEL SECURITY;

-- Option 1: 单用户应用 - 使用固定的 user_id
-- 如果你只是自己用，可以创建一个固定的 UUID 并硬编码
-- 生成一个 UUID: SELECT gen_random_uuid();
-- 然后替换下面的 'YOUR-USER-ID-HERE' 为你的 UUID

-- Expenses policies (单用户版本 - 使用固定 UUID)
CREATE POLICY "Allow all operations on expenses" ON expenses
  FOR ALL 
  USING (user_id = 'YOUR-USER-ID-HERE'::uuid) 
  WITH CHECK (user_id = 'YOUR-USER-ID-HERE'::uuid);

-- Budgets policies
CREATE POLICY "Allow all operations on budgets" ON budgets
  FOR ALL 
  USING (user_id = 'YOUR-USER-ID-HERE'::uuid) 
  WITH CHECK (user_id = 'YOUR-USER-ID-HERE'::uuid);

-- Investments policies
CREATE POLICY "Allow all operations on investments" ON investments
  FOR ALL 
  USING (user_id = 'YOUR-USER-ID-HERE'::uuid) 
  WITH CHECK (user_id = 'YOUR-USER-ID-HERE'::uuid);

-- Target allocation policies
CREATE POLICY "Allow all operations on target_allocation" ON target_allocation
  FOR ALL 
  USING (user_id = 'YOUR-USER-ID-HERE'::uuid) 
  WITH CHECK (user_id = 'YOUR-USER-ID-HERE'::uuid);

-- Option 2: 多用户应用 - 使用 Supabase Auth
-- 如果你要支持多用户登录，使用以下策略（需要先设置 Authentication）：
/*
-- Expenses policies (多用户版本 - 使用 auth.uid())
CREATE POLICY "Users can only see their own expenses" ON expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own expenses" ON expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own expenses" ON expenses
  FOR DELETE USING (auth.uid() = user_id);

-- 对 budgets, investments, target_allocation 应用相同的策略模式
*/
```

**重要步骤**：
1. 生成你的用户 UUID：在 SQL Editor 运行 `SELECT gen_random_uuid();`
2. 复制生成的 UUID
3. 将上面所有 `'YOUR-USER-ID-HERE'` 替换为你的 UUID
4. 运行更新后的 SQL

## 5. 配置环境变量

### Vercel 环境变量

在 Vercel Dashboard：
1. 进入项目 → **Settings** → **Environment Variables**
2. 添加以下变量（**注意：没有 VITE_ 前缀**）：
   - `SUPABASE_URL` = 你的 Project URL
   - `SUPABASE_ANON_KEY` = 你的 anon public key
3. 确保选择正确的环境（Production, Preview, Development）
4. 点击 "Save"

### 本地开发配置

在项目根目录创建 `.env` 文件（如果还没有）：

```env
SUPABASE_URL=你的_Project_URL
SUPABASE_ANON_KEY=你的_anon_key
```

**注意**: 
- `.env` 文件已经在 `.gitignore` 中，不会被提交到 Git
- 后端使用 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`（不是 `VITE_` 前缀）
- 前端如果需要直接访问 Supabase，可以使用 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`

## 6. 部署检查清单

部署到 Vercel 前：

```bash
# 1. 本地测试
npm run dev

# 2. 构建测试
npm run build
npm run preview

# 3. 确认 .env 不在 git 里
cat .gitignore | grep .env
```

## 7. 验证部署

部署完成后：

1. 访问你的 Vercel URL
2. 打开浏览器控制台（F12）
3. 尝试添加一条支出记录
4. 检查是否有错误

如果看到认证错误，检查：
- ✅ RLS 策略是否正确设置
- ✅ 环境变量是否正确配置
- ✅ Supabase 项目是否激活

## 8. 常见问题

### 问题：401 Unauthorized
**解决**: 检查 RLS 策略是否正确设置，确保有允许操作的策略。

### 问题：环境变量未找到
**解决**: 
- 确认 Vercel 环境变量名称正确（`SUPABASE_URL` 和 `SUPABASE_ANON_KEY`）
- 确认已选择正确的环境（Production/Preview/Development）
- 重新部署项目

### 问题：表不存在
**解决**: 确认已在 Supabase SQL Editor 中运行了创建表的 SQL。

## 完成！

现在你的应用应该可以正常工作了！🎉

