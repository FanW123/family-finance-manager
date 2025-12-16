# 🚀 最简单部署方法（推荐）

## 只部署前端 PWA（数据存储在浏览器）

这是最简单的方法，因为：
- ✅ 不需要后端服务器
- ✅ 数据存储在浏览器 localStorage
- ✅ 完全免费
- ✅ 部署速度快

## 步骤

### 1. 构建前端

```bash
cd client
npm run build
```

这会生成 `client/dist` 文件夹

### 2. 部署到 Vercel（3种方法选一个）

#### 方法 A: 拖拽部署（最简单）

1. 访问 https://vercel.com
2. 注册/登录账号
3. 点击 "Add New" → "Project"
4. 点击 "Browse" 或直接拖拽 `client/dist` 文件夹
5. 完成！✅

#### 方法 B: 使用 Vercel CLI

```bash
# 安装 CLI
npm install -g vercel

# 登录
vercel login

# 在 client/dist 目录部署
cd client/dist
vercel

# 部署到生产环境
vercel --prod
```

#### 方法 C: 通过 GitHub

1. 推送代码到 GitHub
2. 在 Vercel 中导入 GitHub 仓库
3. 配置：
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Deploy

### 3. 获取 URL

部署完成后，Vercel 会给你一个 URL，例如：
- `https://firepath.vercel.app`
- 或 `https://firepath-xxx.vercel.app`

### 4. 在手机上安装

1. 在手机浏览器打开 URL
2. 添加到主屏幕
3. 开始使用！

## ⚠️ 重要说明

由于只部署前端，API 请求会失败，但：
- ✅ 数据会存储在浏览器 localStorage
- ✅ 所有功能仍然可用
- ✅ PIN 码保护正常工作
- ✅ PWA 功能完整

后续如果需要多设备同步，可以：
- 添加后端 API
- 使用云数据库
- 实现数据同步

但现在这个版本完全可以独立使用！

## 🎉 完成！

部署完成后，你的应用就可以：
- 在任何设备上访问
- 安装到主屏幕
- 离线使用
- 完全私密（数据在本地）

---

**现在就试试吧！** 🚀

