# 修复邮箱验证链接问题

## 问题
新用户注册后，点击邮箱验证链接时出现 `ERR_CONNECTION_REFUSED` 错误，因为链接指向了 `localhost:3000`。

## 解决方案

### 步骤 1: 在 Supabase Dashboard 中配置重定向 URL

1. **打开 Supabase Dashboard**
   - 访问：https://supabase.com/dashboard/project/xmxvtpuqcnysbvljdohf

2. **进入 Authentication 设置**
   - 点击左侧菜单 **Authentication**
   - 点击 **URL Configuration**

3. **配置 Site URL**
   - 找到 **Site URL** 字段
   - 输入你的 Vercel 部署 URL（例如：`https://firepath-app-git-main-fans-projects-fd2f7f59.vercel.app`）
   - 或者你的自定义域名（如果有）

4. **配置 Redirect URLs**
   - 找到 **Redirect URLs** 字段
   - 点击 **Add URL**
   - 添加以下 URL（每行一个）：
     ```
     https://firepath-app-git-main-fans-projects-fd2f7f59.vercel.app
     https://firepath-app-git-main-fans-projects-fd2f7f59.vercel.app/
     https://firepath-app-git-main-fans-projects-fd2f7f59.vercel.app/**
     http://localhost:5173
     http://localhost:5173/
     http://localhost:5173/**
     ```
   - 注意：将 `firepath-app-git-main-fans-projects-fd2f7f59.vercel.app` 替换为你的实际 Vercel URL

5. **保存设置**
   - 点击 **Save** 按钮

### 步骤 2: 获取你的 Vercel 部署 URL

1. **打开 Vercel Dashboard**
   - 访问：https://vercel.com/dashboard
   - 找到你的项目

2. **查看部署 URL**
   - 在项目页面，你会看到部署的 URL
   - 例如：`https://firepath-app-git-main-fans-projects-fd2f7f59.vercel.app`
   - 或者你的自定义域名

### 步骤 3: 验证修复

1. **等待代码部署完成**（如果修改了代码）
2. **注册一个新账户**
3. **检查邮箱**（包括垃圾邮件文件夹）
4. **点击验证链接**
5. **应该会跳转到你的 Vercel 应用并自动登录**

## 临时解决方案（如果不想配置）

如果暂时不想配置 Supabase，可以：

1. **禁用邮箱验证**（仅用于测试）
   - 在 Supabase Dashboard → Authentication → Providers → Email
   - 取消勾选 **"Enable email confirmations"**
   - 点击 **Save**
   - 这样注册后可以直接登录，不需要验证邮箱

## 注意事项

- 每次部署到新的 Vercel URL 时，都需要在 Supabase 中添加新的 Redirect URL
- 如果使用自定义域名，也要添加到 Redirect URLs 中
- 本地开发时，`localhost:5173` 应该已经在 Redirect URLs 中

