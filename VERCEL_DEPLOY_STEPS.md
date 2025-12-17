# 🚀 在 Vercel 中部署 FirePath

## 步骤 1: 打开 Vercel Dashboard

1. 访问：https://vercel.com/dashboard
2. 确保已登录

## 步骤 2: 导入 GitHub 仓库

1. **点击 "Add New" 按钮**（右上角）
2. **选择 "Project"**
3. **在 "Import Git Repository" 部分**：
   - 选择你的 GitHub 账号（FanW123）
   - 找到并选择 **`family-finance-manager`** 仓库
   - 点击 **"Import"**

## 步骤 3: 配置项目设置 ⚠️ 非常重要！

在配置页面，**必须正确设置**：

### 基本设置
- **Project Name**: `firepath`（或你喜欢的名字）
- **Framework Preset**: `Other` 或 `Vite`

### ⚠️ 关键设置（必须正确！）
- **Root Directory**: `client` ⚠️ **这个很重要！**
  - 点击 "Edit" 或 "Override"
  - 输入：`client`
  
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 环境变量（可选）
如果需要 Alpha Vantage API 密钥：
- 点击 "Environment Variables"
- 添加：
  - Name: `ALPHA_VANTAGE_API_KEY`
  - Value: 你的 API 密钥（如果有）

## 步骤 4: 部署

1. **点击 "Deploy" 按钮**
2. **等待 1-2 分钟**
   - 你会看到构建日志
   - 等待看到 "Ready" 状态
3. **完成！** ✅

## 步骤 5: 获取 URL

部署完成后：
- Vercel 会显示一个 URL
- 例如：`https://firepath.vercel.app` 或 `https://family-finance-manager-xxx.vercel.app`
- **点击 URL 即可访问你的应用！**

## 步骤 6: 测试

1. **在浏览器打开 URL**
   - 应该看到 PIN 码设置界面
   - 测试所有功能

2. **在手机上测试**
   - 用手机浏览器打开 URL
   - 添加到主屏幕
   - 测试 PIN 码功能

## ✨ 自动部署（已配置）

✅ **以后每次推送代码到 GitHub，Vercel 会自动重新部署！**

工作流程：
1. 修改代码
2. `git add .`
3. `git commit -m "更新说明"`
4. `git push origin main`
5. Vercel 自动检测并部署 ✨

## ✅ 检查清单

- [ ] 在 Vercel 中导入仓库
- [ ] **Root Directory 设置为 `client`** ⚠️
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] 部署成功
- [ ] 可以访问 URL
- [ ] PIN 码设置界面正常显示

---

**现在就打开 Vercel Dashboard 开始部署吧！** 🚀

