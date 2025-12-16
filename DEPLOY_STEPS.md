# 🚀 FirePath 部署步骤（已注册 Vercel）

## 方法 1: Dashboard 拖拽部署（最简单，推荐）

### 步骤：

1. **打开 Vercel Dashboard**
   - 访问 https://vercel.com/dashboard
   - 确保已登录

2. **创建新项目**
   - 点击右上角 "Add New" 按钮
   - 选择 "Project"

3. **拖拽部署**
   - 找到并打开 `client/dist` 文件夹
   - 直接拖拽整个 `dist` 文件夹到 Vercel 页面
   - 或者点击 "Browse" 选择 `client/dist` 文件夹

4. **等待部署**
   - Vercel 会自动检测并部署
   - 等待 1-2 分钟
   - 看到 "Ready" 状态即完成

5. **获取 URL**
   - 部署完成后会显示一个 URL
   - 例如：`https://firepath-xxx.vercel.app`
   - 点击 URL 即可访问

## 方法 2: 通过 GitHub（推荐用于持续部署）

如果你想把代码推送到 GitHub 并自动部署：

1. **推送代码到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - FirePath"
   git remote add origin https://github.com/你的用户名/firepath.git
   git push -u origin main
   ```

2. **在 Vercel 中导入**
   - Dashboard → "Add New" → "Project"
   - 选择你的 GitHub 仓库
   - 配置：
     - **Root Directory**: `client`
     - **Framework Preset**: Other
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - 点击 "Deploy"

3. **自动部署**
   - 以后每次推送代码，Vercel 会自动重新部署

## 方法 3: 使用 Vercel CLI

如果你想用命令行：

```bash
# 1. 确保在项目根目录
cd /Users/fanwang/SideProjects

# 2. 登录（如果还没登录）
vercel login

# 3. 部署
vercel

# 按照提示：
# - Set up and deploy? Yes
# - Which scope? 选择你的账号
# - Link to existing project? No（首次）
# - Project name: firepath
# - Directory: ./client
# - Override settings? No

# 4. 部署到生产环境
vercel --prod
```

## 📱 部署后测试

1. **在浏览器打开 URL**
   - 测试所有功能是否正常
   - 检查 Service Worker 是否注册

2. **在手机上测试**
   - 用手机浏览器打开 URL
   - 添加到主屏幕
   - 测试 PIN 码功能

## ✅ 部署检查清单

- [ ] 部署成功，看到 "Ready" 状态
- [ ] 可以访问 URL
- [ ] PIN 码设置界面正常显示
- [ ] 所有功能正常
- [ ] 在手机上可以安装

---

**推荐使用方法 1（拖拽部署），最快最简单！** 🚀

