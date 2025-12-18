# 🔧 firepath 项目环境变量设置

## 问题
登录功能消失了，可能是因为 Vercel 环境变量没有设置。

## 解决方案：在 firepath 项目中设置环境变量

### 步骤 1: 进入 firepath 项目设置

1. **打开 Vercel Dashboard**
   - 访问：https://vercel.com/dashboard
   - 点击 **firepath** 项目

2. **进入环境变量设置**
   - 点击顶部 **"Settings"** 标签
   - 在左侧菜单找到 **"Environment Variables"**

### 步骤 2: 添加 4 个环境变量

需要添加以下 4 个环境变量：

#### 变量 1: SUPABASE_URL（后端）
- **Key**: `SUPABASE_URL`
- **Value**: `https://xmxvtpuqcnysbvljdohf.supabase.co`
- **Environment**: 选择 **Production**, **Preview**, **Development**（全部勾选）

#### 变量 2: SUPABASE_ANON_KEY（后端）
- **Key**: `SUPABASE_ANON_KEY`
- **Value**: `sb_publishable_YEkgua3dH6UMxx-j1-Zpaw_aNWL4GX4`
- **Environment**: 选择 **Production**, **Preview**, **Development**（全部勾选）

#### 变量 3: VITE_SUPABASE_URL（前端）
- **Key**: `VITE_SUPABASE_URL`
- **Value**: `https://xmxvtpuqcnysbvljdohf.supabase.co`
- **Environment**: 选择 **Production**, **Preview**, **Development**（全部勾选）

#### 变量 4: VITE_SUPABASE_ANON_KEY（前端）
- **Key**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `sb_publishable_YEkgua3dH6UMxx-j1-Zpaw_aNWL4GX4`
- **Environment**: 选择 **Production**, **Preview**, **Development**（全部勾选）

### 步骤 3: 保存并重新部署

1. **保存环境变量**
   - 添加完所有 4 个变量后，点击 **"Save"**

2. **重新部署**
   - 点击顶部 **"Deployments"** 标签
   - 找到最新的部署
   - 点击右侧 **"..."** 菜单
   - 选择 **"Redeploy"**
   - 或者等待自动重新部署（通常会在几分钟内）

### 步骤 4: 验证

1. **等待部署完成**
   - 在 Deployments 页面查看部署状态
   - 等待状态变为 **"Ready"**（绿色）

2. **测试登录功能**
   - 访问你的应用：`firepath-livid.vercel.app`
   - 应该能看到登录/注册页面
   - 尝试登录或注册

## ✅ 检查清单

确保以下 4 个环境变量都已设置：
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`

## ⚠️ 重要提示

- 环境变量设置后，**必须重新部署**才能生效
- 如果设置后还是看不到登录页面，请等待 1-2 分钟让部署完成
- 如果还有问题，检查浏览器控制台（F12）是否有错误信息

