# 🚀 FirePath 部署指南

## 快速部署到 Vercel（推荐）

### 方法 1: 使用 Vercel CLI（最简单）

```bash
# 1. 安装 Vercel CLI（如果还没安装）
npm install -g vercel

# 2. 登录 Vercel
vercel login

# 3. 在项目根目录部署
vercel

# 4. 按照提示完成部署
# - 是否要部署到现有项目？选择 No（首次部署）
# - 项目名称：firepath（或你喜欢的名字）
# - 目录：./client（前端）或根目录（全栈）

# 5. 部署到生产环境
vercel --prod
```

### 方法 2: 通过 GitHub（推荐用于持续部署）

1. **推送代码到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/你的用户名/firepath.git
   git push -u origin main
   ```

2. **在 Vercel 中导入项目**
   - 访问 https://vercel.com
   - 点击 "New Project"
   - 导入你的 GitHub 仓库
   - 配置：
     - Framework Preset: Other
     - Root Directory: `client`
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - 点击 Deploy

### 方法 3: 使用部署脚本

```bash
# 运行一键部署脚本
./deploy.sh
```

## 📋 部署前检查清单

- [ ] 代码已提交到 Git
- [ ] 已测试本地构建：`cd client && npm run build`
- [ ] 已创建应用图标（可选，但推荐）
- [ ] 已测试 PWA 功能

## 🔧 环境变量配置（如果需要）

如果后端需要 API 密钥，在 Vercel 项目设置中添加：

1. 进入 Vercel 项目设置
2. 找到 "Environment Variables"
3. 添加：
   - `ALPHA_VANTAGE_API_KEY` = 你的API密钥（可选）

## 📱 部署后步骤

1. **获取部署 URL**
   - Vercel 会提供一个 URL，例如：`https://firepath.vercel.app`

2. **在手机上测试**
   - 在手机浏览器中打开 URL
   - 添加到主屏幕
   - 测试所有功能

3. **自定义域名（可选）**
   - 在 Vercel 项目设置中添加自定义域名
   - 配置 DNS 记录

## ⚠️ 注意事项

### SQLite 数据库限制

当前使用 SQLite，在 serverless 环境（如 Vercel）可能有限制：
- SQLite 文件需要持久化存储
- Vercel 的 serverless 函数是临时性的

**解决方案：**
1. 暂时只部署前端（PWA），数据存储在浏览器 localStorage
2. 后续迁移到云数据库（如 Supabase、PlanetScale）

### 当前部署方案

由于 SQLite 的限制，建议：
1. **先部署前端 PWA**（数据使用 localStorage）
2. 后续再考虑后端 API 部署

## 🎯 推荐部署流程

### 第一步：只部署前端（PWA）

```bash
# 1. 构建前端
cd client
npm run build

# 2. 部署到 Vercel（只部署 client/dist）
vercel --cwd client/dist
```

或者使用 Vercel Dashboard：
1. 拖拽 `client/dist` 文件夹到 Vercel
2. 完成！

### 第二步：测试 PWA

1. 打开部署的 URL
2. 测试所有功能
3. 在手机上安装

### 第三步：后续优化（可选）

- 添加后端 API（需要云数据库）
- 配置自定义域名
- 添加分析统计

## 🐛 常见问题

### 构建失败

**检查：**
- Node.js 版本是否兼容
- 依赖是否完整安装
- 查看构建日志

### API 请求失败

**原因：** 如果只部署前端，API 请求会失败

**解决：** 数据会使用 localStorage，功能仍可用

### Service Worker 不工作

**检查：**
- 是否使用 HTTPS（PWA 需要 HTTPS）
- Service Worker 文件是否正确部署
- 浏览器控制台是否有错误

---

**部署完成后，分享你的 URL，我可以帮你测试！** 🎉

