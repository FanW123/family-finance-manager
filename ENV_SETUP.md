# 环境变量配置指南

## 你的 Supabase 配置信息

根据你提供的信息，你的 Supabase 项目配置如下：

- **Project URL**: `https://supabase.com/dashboard/project/xmxvtpuqcnysbvljdohf`
- **API URL**: `https://xmxvtpuqcnysbvljdohf.supabase.co`
- **Publishable Key**: `sb_publishable_YEkgua3dH6UMxx-j1-Zpaw_aNWL4GX4`

## 本地开发配置

1. 在项目根目录创建 `.env` 文件：

```bash
# 在项目根目录运行
cp .env.example .env
```

2. `.env` 文件内容：

```env
# Backend (Server) - No VITE_ prefix
SUPABASE_URL=https://xmxvtpuqcnysbvljdohf.supabase.co
SUPABASE_ANON_KEY=sb_publishable_YEkgua3dH6UMxx-j1-Zpaw_aNWL4GX4

# Frontend (Client) - With VITE_ prefix
VITE_SUPABASE_URL=https://xmxvtpuqcnysbvljdohf.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_YEkgua3dH6UMxx-j1-Zpaw_aNWL4GX4
```

## Vercel 部署配置

1. 进入 Vercel Dashboard → 你的项目 → **Settings** → **Environment Variables**

2. 添加以下环境变量（选择所有环境：Production, Preview, Development）：

   **后端变量**（没有 VITE_ 前缀）：
   - `SUPABASE_URL` = `https://xmxvtpuqcnysbvljdohf.supabase.co`
   - `SUPABASE_ANON_KEY` = `sb_publishable_YEkgua3dH6UMxx-j1-Zpaw_aNWL4GX4`

   **前端变量**（有 VITE_ 前缀）：
   - `VITE_SUPABASE_URL` = `https://xmxvtpuqcnysbvljdohf.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_YEkgua3dH6UMxx-j1-Zpaw_aNWL4GX4`

3. 点击 **Save** 保存

4. 重新部署项目（Vercel 会自动触发重新部署，或手动点击 **Redeploy**）

## 验证配置

### 本地验证

1. 启动开发服务器：
   ```bash
   # 终端 1: 启动后端
   cd server && npm run dev
   
   # 终端 2: 启动前端
   cd client && npm run dev
   ```

2. 访问 `http://localhost:5173`
3. 应该看到登录/注册页面
4. 尝试注册一个新账户

### Vercel 验证

1. 访问你的 Vercel 部署 URL
2. 应该看到登录/注册页面
3. 尝试注册一个新账户
4. 检查浏览器控制台（F12）是否有错误

## 常见问题

### 问题：找不到 Project URL

**解决方案**：
- Project URL 格式：`https://[project-id].supabase.co`
- 从 Dashboard URL `https://supabase.com/dashboard/project/xmxvtpuqcnysbvljdohf` 提取项目 ID：`xmxvtpuqcnysbvljdohf`
- 完整的 API URL：`https://xmxvtpuqcnysbvljdohf.supabase.co`

### 问题：认证失败

**检查清单**：
- ✅ 环境变量名称正确（注意 `VITE_` 前缀）
- ✅ API URL 格式正确（包含 `https://` 和 `.supabase.co`）
- ✅ Publishable Key 完整（以 `sb_publishable_` 开头）
- ✅ Supabase Authentication 已启用（Dashboard → Authentication → Providers）

### 问题：401 Unauthorized

**解决方案**：
- 确认已登录（检查是否显示登录页面）
- 检查浏览器控制台的错误信息
- 确认 RLS 策略已正确设置（使用 `auth.uid()`）

