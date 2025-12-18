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

在 Supabase Dashboard，进入 **SQL Editor**，运行以下 SQL：

```sql
-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL UNIQUE,
  monthly_limit REAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Investments table
CREATE TABLE IF NOT EXISTS investments (
  id SERIAL PRIMARY KEY,
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
  type TEXT NOT NULL UNIQUE CHECK(type IN ('stocks', 'bonds', 'cash')),
  percentage REAL NOT NULL CHECK(percentage >= 0 AND percentage <= 100),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default target allocation
INSERT INTO target_allocation (type, percentage) 
VALUES ('stocks', 60), ('bonds', 30), ('cash', 10)
ON CONFLICT (type) DO NOTHING;
```

## 4. 启用 Row Level Security (RLS)

**重要！** 为了数据安全，需要启用 RLS。在 **SQL Editor** 中运行：

```sql
-- Enable RLS on all tables
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_allocation ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for single-user app)
-- If you plan to add authentication later, modify these policies

-- Expenses policies
CREATE POLICY "Allow all operations on expenses" ON expenses
  FOR ALL USING (true) WITH CHECK (true);

-- Budgets policies
CREATE POLICY "Allow all operations on budgets" ON budgets
  FOR ALL USING (true) WITH CHECK (true);

-- Investments policies
CREATE POLICY "Allow all operations on investments" ON investments
  FOR ALL USING (true) WITH CHECK (true);

-- Target allocation policies
CREATE POLICY "Allow all operations on target_allocation" ON target_allocation
  FOR ALL USING (true) WITH CHECK (true);
```

**注意**: 当前策略允许所有操作（适合单用户应用）。如果将来要添加多用户支持，需要修改这些策略。

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

