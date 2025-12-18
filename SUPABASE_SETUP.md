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

## 4. 配置环境变量

在 Vercel Dashboard：
1. 进入项目 → **Settings** → **Environment Variables**
2. 添加以下变量：
   - `SUPABASE_URL` = 你的 Project URL
   - `SUPABASE_ANON_KEY` = 你的 anon public key

## 5. 本地开发配置

在项目根目录创建 `.env` 文件（如果还没有）：

```env
SUPABASE_URL=你的_Project_URL
SUPABASE_ANON_KEY=你的_anon_key
```

**注意**: `.env` 文件已经在 `.gitignore` 中，不会被提交到 Git。

## 6. 重新部署

完成以上步骤后，Vercel 会自动重新部署，或者你可以手动触发部署。

## 完成！

现在你的应用应该可以正常工作了！🎉

