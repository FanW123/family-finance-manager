# 🚀 通过 GitHub 部署 FirePath

## 步骤 1: 提交代码到 GitHub

### 1.1 检查当前状态

```bash
cd /Users/fanwang/SideProjects
git status
```

### 1.2 添加所有更改

```bash
git add .
```

### 1.3 提交更改

```bash
git commit -m "Add PIN code security, PWA features, and deployment config"
```

### 1.4 推送到 GitHub

```bash
git push origin main
```

## 步骤 2: 在 Vercel 中导入 GitHub 仓库

### 2.1 打开 Vercel Dashboard

1. 访问 https://vercel.com/dashboard
2. 确保已登录

### 2.2 导入项目

1. 点击右上角 **"Add New"** 按钮
2. 选择 **"Project"**
3. 在 "Import Git Repository" 部分
4. 选择你的 GitHub 账号
5. 找到并选择 **firepath** 仓库（或你的仓库名）
6. 点击 **"Import"**

### 2.3 配置项目设置

在配置页面，设置：

- **Project Name**: `firepath`（或你喜欢的名字）
- **Framework Preset**: `Other` 或 `Vite`
- **Root Directory**: `client` ⚠️ **重要！**
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 2.4 环境变量（可选）

如果需要 API 密钥，可以在这里添加：
- `ALPHA_VANTAGE_API_KEY` = 你的密钥（可选）

### 2.5 部署

1. 点击 **"Deploy"** 按钮
2. 等待 1-2 分钟
3. 看到 "Ready" 状态即完成！

## 步骤 3: 获取 URL

部署完成后：
- Vercel 会显示一个 URL，例如：`https://firepath.vercel.app`
- 点击 URL 即可访问
- 可以点击 "Settings" → "Domains" 添加自定义域名（可选）

## 步骤 4: 自动部署（已配置）

✅ **以后每次推送代码到 GitHub，Vercel 会自动重新部署！**

工作流程：
1. 修改代码
2. `git add .`
3. `git commit -m "更新说明"`
4. `git push`
5. Vercel 自动检测并部署 ✨

## 📱 部署后测试

1. **在浏览器打开 URL**
   - 测试所有功能
   - 检查 PIN 码设置
   - 验证 PWA 功能

2. **在手机上测试**
   - 用手机浏览器打开 URL
   - 添加到主屏幕
   - 测试所有功能

## ✅ 检查清单

- [ ] 代码已推送到 GitHub
- [ ] 在 Vercel 中导入仓库
- [ ] 配置 Root Directory 为 `client`
- [ ] 部署成功
- [ ] 可以访问 URL
- [ ] 功能正常

---

**现在开始提交代码吧！** 🚀

