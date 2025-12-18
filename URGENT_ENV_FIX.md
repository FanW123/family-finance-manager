# 🚨 紧急修复：环境变量未设置

## 问题
页面空白，控制台显示：`supabaseUrl is required`

这是因为 **Vercel 环境变量没有设置**！

## ⚡ 立即修复步骤

### 步骤 1: 进入 Vercel Dashboard

1. 访问：https://vercel.com/dashboard
2. 点击 **firepath** 项目

### 步骤 2: 设置环境变量

1. 点击顶部 **"Settings"** 标签
2. 在左侧菜单找到 **"Environment Variables"**
3. 点击 **"Add New"** 按钮

### 步骤 3: 添加 4 个环境变量

**⚠️ 重要：每个变量都要选择所有环境（Production, Preview, Development）**

#### 变量 1: VITE_SUPABASE_URL
- **Key**: `VITE_SUPABASE_URL`
- **Value**: `https://xmxvtpuqcnysbvljdohf.supabase.co`
- **Environment**: ✅ Production ✅ Preview ✅ Development（全部勾选）
- 点击 **"Save"**

#### 变量 2: VITE_SUPABASE_ANON_KEY
- **Key**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `sb_publishable_YEkgua3dH6UMxx-j1-Zpaw_aNWL4GX4`
- **Environment**: ✅ Production ✅ Preview ✅ Development（全部勾选）
- 点击 **"Save"**

#### 变量 3: SUPABASE_URL（后端）
- **Key**: `SUPABASE_URL`
- **Value**: `https://xmxvtpuqcnysbvljdohf.supabase.co`
- **Environment**: ✅ Production ✅ Preview ✅ Development（全部勾选）
- 点击 **"Save"**

#### 变量 4: SUPABASE_ANON_KEY（后端）
- **Key**: `SUPABASE_ANON_KEY`
- **Value**: `sb_publishable_YEkgua3dH6UMxx-j1-Zpaw_aNWL4GX4`
- **Environment**: ✅ Production ✅ Preview ✅ Development（全部勾选）
- 点击 **"Save"**

### 步骤 4: 重新部署

**⚠️ 重要：环境变量设置后，必须重新部署才能生效！**

1. 点击顶部 **"Deployments"** 标签
2. 找到最新的部署
3. 点击右侧 **"..."** 菜单
4. 选择 **"Redeploy"**
5. **取消勾选** "Use existing Build Cache"（清除缓存）
6. 点击 **"Redeploy"**

### 步骤 5: 等待部署完成

1. 等待 1-2 分钟
2. 部署完成后，访问你的应用
3. 应该能看到登录/注册页面了！

## ✅ 验证清单

确保以下 4 个环境变量都已设置：
- ✅ `VITE_SUPABASE_URL` = `https://xmxvtpuqcnysbvljdohf.supabase.co`
- ✅ `VITE_SUPABASE_ANON_KEY` = `sb_publishable_YEkgua3dH6UMxx-j1-Zpaw_aNWL4GX4`
- ✅ `SUPABASE_URL` = `https://xmxvtpuqcnysbvljdohf.supabase.co`
- ✅ `SUPABASE_ANON_KEY` = `sb_publishable_YEkgua3dH6UMxx-j1-Zpaw_aNWL4GX4`

## 🔍 如果还是空白页面

1. **检查环境变量是否设置**
   - 在 Vercel Dashboard → Settings → Environment Variables
   - 确认 4 个变量都存在

2. **检查部署日志**
   - 在 Deployments → 点击最新部署 → 查看 Build Logs
   - 确认构建成功

3. **清除浏览器缓存**
   - 按 `Ctrl+Shift+R` (Windows) 或 `Cmd+Shift+R` (Mac) 强制刷新
   - 或者打开无痕模式测试

4. **检查浏览器控制台**
   - 按 F12 打开开发者工具
   - 查看 Console 标签页
   - 如果还有错误，把错误信息发给我

## 📝 重要提示

- **环境变量必须在构建时可用**，所以必须在 Vercel Dashboard 中设置
- **设置后必须重新部署**，环境变量才会生效
- **VITE_ 前缀的变量**会被注入到前端代码中，所以是公开的（但 Supabase 的 anon key 本来就是设计为公开的，有 RLS 保护数据）

