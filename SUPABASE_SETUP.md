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
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Expenses table (with user_id referencing auth.users!)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  monthly_limit REAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category)
);

-- Investments table
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

-- Target allocation table
CREATE TABLE IF NOT EXISTS target_allocation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

**重要！** 为了数据安全，需要启用 RLS 并设置用户隔离策略。

### 选项 1：使用 Supabase Authentication（推荐 - 当前应用使用此方案）

应用现在使用 Supabase Authentication，支持多用户。在 **SQL Editor** 中运行：

```sql
-- Enable RLS on all tables
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_allocation ENABLE ROW LEVEL SECURITY;

-- Expenses policies (使用 auth.uid() - 自动从 JWT token 获取用户 ID)
CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" ON expenses
  FOR DELETE USING (auth.uid() = user_id);

-- Budgets policies
CREATE POLICY "Users can view own budgets" ON budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets" ON budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets" ON budgets
  FOR DELETE USING (auth.uid() = user_id);

-- Investments policies
CREATE POLICY "Users can view own investments" ON investments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investments" ON investments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investments" ON investments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investments" ON investments
  FOR DELETE USING (auth.uid() = user_id);

-- Target allocation policies
CREATE POLICY "Users can view own target_allocation" ON target_allocation
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own target_allocation" ON target_allocation
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own target_allocation" ON target_allocation
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own target_allocation" ON target_allocation
  FOR DELETE USING (auth.uid() = user_id);
```

**重要**：现在使用 Supabase Authentication，`auth.uid()` 会自动从 JWT token 中获取当前登录用户的 ID，无需手动设置 UUID。

## 5. 配置环境变量

### Vercel 环境变量

在 Vercel Dashboard：
1. 进入项目 → **Settings** → **Environment Variables**
2. 添加以下变量：
   - **后端变量**（没有 VITE_ 前缀）：
     - `SUPABASE_URL` = 你的 Project URL（例如：`https://xxxxx.supabase.co`）
     - `SUPABASE_ANON_KEY` = 你的 anon public key（例如：`sb_publishable_...`）
   - **前端变量**（有 VITE_ 前缀）：
     - `VITE_SUPABASE_URL` = 你的 Project URL（与上面相同）
     - `VITE_SUPABASE_ANON_KEY` = 你的 anon public key（与上面相同）
3. 确保选择正确的环境（Production, Preview, Development）
4. 点击 "Save"

### 本地开发配置

在项目根目录创建 `.env` 文件（如果还没有）：

```env
# 后端使用（server）
SUPABASE_URL=你的_Project_URL
SUPABASE_ANON_KEY=你的_anon_key

# 前端使用（client）
VITE_SUPABASE_URL=你的_Project_URL
VITE_SUPABASE_ANON_KEY=你的_anon_key
```

**注意**: 
- `.env` 文件已经在 `.gitignore` 中，不会被提交到 Git
- 后端使用 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`（没有 `VITE_` 前缀）
- 前端使用 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`（有 `VITE_` 前缀）
- **不再需要 `SUPABASE_USER_ID`** - 现在使用 Supabase Authentication 自动获取用户 ID

## 6. 启用 Supabase Authentication

1. 在 Supabase Dashboard，进入 **Authentication** → **Providers**
2. 确保 **Email** 提供者已启用
3. 可选：配置其他登录方式（Google, GitHub 等）

**注意**：默认情况下，Email 提供者已启用，可以直接使用邮箱和密码注册/登录。

## 7. 部署检查清单

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

## 8. 验证部署和认证

部署完成后：

1. 访问你的 Vercel URL
2. 你应该看到登录/注册页面
3. **首次使用**：点击"注册"创建账户
   - 输入邮箱和密码（至少6位）
   - 点击"注册"
   - 如果启用了邮箱验证，检查邮箱并点击验证链接
4. **登录**：输入邮箱和密码，点击"登录"
5. 登录成功后，尝试添加一条支出记录
6. 检查是否有错误

如果看到认证错误，检查：
- ✅ RLS 策略是否正确设置（使用 `auth.uid()`）
- ✅ 环境变量是否正确配置（前端和后端都需要）
- ✅ Supabase Authentication 是否启用
- ✅ 浏览器控制台是否有错误信息

## 9. 常见问题

### 问题：401 Unauthorized
**解决**: 检查 RLS 策略是否正确设置，确保有允许操作的策略。

### 问题：环境变量未找到
**解决**: 
- 确认 Vercel 环境变量名称正确（`SUPABASE_URL`、`SUPABASE_ANON_KEY` 和 `SUPABASE_USER_ID`）
- 确认已选择正确的环境（Production/Preview/Development）
- 重新部署项目

### 问题：401 Unauthorized
**解决**: 
- 确认已登录（检查浏览器是否显示登录页面）
- 确认前端环境变量 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 已设置
- 确认后端环境变量 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 已设置
- 检查浏览器控制台的错误信息

### 问题：无法注册/登录
**解决**: 
- 确认 Supabase Authentication 已启用（Settings → Authentication → Providers）
- 确认邮箱格式正确
- 确认密码至少6位
- 如果启用了邮箱验证，检查邮箱（包括垃圾邮件文件夹）

### 问题：表不存在
**解决**: 确认已在 Supabase SQL Editor 中运行了创建表的 SQL。

## 完成！

现在你的应用应该可以正常工作了！🎉

