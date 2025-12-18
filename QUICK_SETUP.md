# 🚀 FirePath 快速设置指南

根据你的 Supabase 项目信息，我已经为你准备好了所有需要的文件。

## ✅ 我可以帮你做的（已完成）

1. ✅ 创建了完整的 SQL 脚本：`supabase_setup.sql`
2. ✅ 创建了环境变量配置指南：`ENV_SETUP.md`
3. ✅ 所有代码已更新并推送到 GitHub

## 📋 你需要手动完成的步骤

### 步骤 1: 创建本地 `.env` 文件（本地开发需要）

在项目根目录创建 `.env` 文件，内容如下：

```env
# Backend (Server) - No VITE_ prefix
SUPABASE_URL=https://xmxvtpuqcnysbvljdohf.supabase.co
SUPABASE_ANON_KEY=sb_publishable_YEkgua3dH6UMxx-j1-Zpaw_aNWL4GX4

# Frontend (Client) - With VITE_ prefix
VITE_SUPABASE_URL=https://xmxvtpuqcnysbvljdohf.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_YEkgua3dH6UMxx-j1-Zpaw_aNWL4GX4
```

**或者运行命令**（在项目根目录）：
```bash
cat > .env << 'EOF'
# Backend (Server) - No VITE_ prefix
SUPABASE_URL=https://xmxvtpuqcnysbvljdohf.supabase.co
SUPABASE_ANON_KEY=sb_publishable_YEkgua3dH6UMxx-j1-Zpaw_aNWL4GX4

# Frontend (Client) - With VITE_ prefix
VITE_SUPABASE_URL=https://xmxvtpuqcnysbvljdohf.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_YEkgua3dH6UMxx-j1-Zpaw_aNWL4GX4
EOF
```

### 步骤 2: 在 Supabase 中运行 SQL 脚本（必须）

1. 打开 Supabase Dashboard: https://supabase.com/dashboard/project/xmxvtpuqcnysbvljdohf
2. 点击左侧菜单 **SQL Editor**
3. 点击 **New query**
4. 打开项目中的 `supabase_setup.sql` 文件，复制全部内容
5. 粘贴到 SQL Editor 中
6. 点击 **Run** 或按 `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)
7. 应该看到 "Success. No rows returned" 或类似的成功消息

### 步骤 3: 启用 Supabase Authentication（必须）

1. 在 Supabase Dashboard，点击左侧菜单 **Authentication**
2. 点击 **Providers**
3. 确保 **Email** 提供者已启用（默认应该已启用）
4. 如果需要，可以配置其他登录方式（Google, GitHub 等）

### 步骤 4: 在 Vercel 中设置环境变量（部署需要）

1. 打开 Vercel Dashboard: https://vercel.com/dashboard
2. 找到你的项目，点击进入
3. 点击 **Settings** → **Environment Variables**
4. 添加以下 4 个变量（选择所有环境：Production, Preview, Development）：

   **后端变量**（没有 VITE_ 前缀）：
   - 名称: `SUPABASE_URL`
     值: `https://xmxvtpuqcnysbvljdohf.supabase.co`
   
   - 名称: `SUPABASE_ANON_KEY`
     值: `sb_publishable_YEkgua3dH6UMxx-j1-Zpaw_aNWL4GX4`

   **前端变量**（有 VITE_ 前缀）：
   - 名称: `VITE_SUPABASE_URL`
     值: `https://xmxvtpuqcnysbvljdohf.supabase.co`
   
   - 名称: `VITE_SUPABASE_ANON_KEY`
     值: `sb_publishable_YEkgua3dH6UMxx-j1-Zpaw_aNWL4GX4`

5. 点击 **Save**
6. 重新部署项目（Vercel 会自动触发，或手动点击 **Deployments** → **Redeploy**）

## 🧪 测试

### 本地测试

```bash
# 终端 1: 启动后端
cd server && npm run dev

# 终端 2: 启动前端
cd client && npm install  # 首次运行需要安装依赖
cd client && npm run dev
```

访问 `http://localhost:5173`，应该看到登录/注册页面。

### Vercel 测试

1. 访问你的 Vercel 部署 URL
2. 应该看到登录/注册页面
3. 点击"注册"创建账户
4. 输入邮箱和密码（至少6位）
5. 登录后尝试添加一条支出记录

## ❓ 遇到问题？

- 检查 `ENV_SETUP.md` 中的常见问题解答
- 检查浏览器控制台（F12）的错误信息
- 确认所有步骤都已完成

## 📝 检查清单

- [ ] 创建了本地 `.env` 文件
- [ ] 在 Supabase 中运行了 `supabase_setup.sql`
- [ ] 在 Supabase 中启用了 Email 认证
- [ ] 在 Vercel 中设置了 4 个环境变量
- [ ] 重新部署了 Vercel 项目
- [ ] 测试了本地开发环境
- [ ] 测试了 Vercel 部署

完成这些步骤后，你的应用就可以正常使用了！🎉

