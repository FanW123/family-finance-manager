# 🚀 立即部署 FirePath

## ✅ 准备工作已完成

- ✅ 前端已构建成功 (`client/dist`)
- ✅ Vercel 配置文件已准备好
- ✅ 所有代码已就绪

## 📋 部署步骤（3选1）

### 方法 1: Vercel Dashboard（最简单，推荐）

1. **访问 Vercel**
   - 打开 https://vercel.com
   - 登录/注册账号（可以用 GitHub 账号）

2. **创建新项目**
   - 点击 "Add New" → "Project"
   - 如果已连接 GitHub，选择导入仓库
   - 如果没有，点击 "Browse" 或直接拖拽文件夹

3. **配置项目**
   - **Root Directory**: 留空或填 `client`
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **部署**
   - 点击 "Deploy"
   - 等待 1-2 分钟
   - 完成！✅

### 方法 2: Vercel CLI（命令行）

在终端执行：

```bash
# 1. 确保在项目根目录
cd /Users/fanwang/SideProjects

# 2. 登录 Vercel（如果还没登录）
vercel login

# 3. 部署（首次会询问配置）
vercel

# 4. 按照提示完成：
#    - Set up and deploy? Yes
#    - Which scope? 选择你的账号
#    - Link to existing project? No
#    - Project name: firepath
#    - Directory: ./client
#    - Override settings? No

# 5. 部署到生产环境
vercel --prod
```

### 方法 3: 直接拖拽 dist 文件夹

1. **打开 Vercel Dashboard**
   - https://vercel.com/dashboard

2. **拖拽部署**
   - 直接拖拽 `client/dist` 文件夹到页面
   - 完成！

## 🎯 部署后

部署完成后，你会得到一个 URL，例如：
- `https://firepath.vercel.app`
- 或 `https://firepath-xxx.vercel.app`

## 📱 在手机上安装

1. **在手机浏览器打开 URL**
2. **添加到主屏幕**
   - iPhone: Safari → 分享 → 添加到主屏幕
   - Android: Chrome → 菜单 → 安装应用
3. **开始使用！**

## ⚠️ 重要说明

由于当前只部署前端：
- ✅ 所有功能都可用
- ✅ 数据存储在浏览器 localStorage
- ✅ PIN 码保护正常工作
- ✅ PWA 功能完整
- ⚠️ API 请求会失败（但数据在本地，不影响使用）

## 🐛 如果遇到问题

### 构建失败
- 检查 Node.js 版本（需要 18+）
- 查看构建日志

### 部署后无法访问
- 检查 URL 是否正确
- 查看 Vercel 部署日志

### Service Worker 不工作
- 确保使用 HTTPS（Vercel 自动提供）
- 检查浏览器控制台

---

**现在就试试吧！选择最简单的方法开始部署！** 🚀

