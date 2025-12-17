# 🔧 修复 Vercel 构建错误

## 问题

Vercel 在构建时遇到错误：`tsc: command not found`

这是因为 Vercel 没有正确安装依赖。

## 解决方案

### 方法 1: 在 Vercel Dashboard 中修复配置（推荐）

1. **打开你的 Vercel 项目**
   - 在 Vercel Dashboard 中找到你的项目
   - 点击项目进入设置

2. **进入 Settings → General**
   - 找到 "Build & Development Settings"

3. **修改配置**：
   - **Root Directory**: `client` ⚠️
   - **Framework Preset**: `Vite`（或 `Other`）
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install` ⚠️ **确保这个设置了！**

4. **保存并重新部署**
   - 点击 "Save"
   - 点击 "Redeploy" 或等待自动重新部署

### 方法 2: 检查 vercel.json 配置

我已经更新了 `vercel.json` 文件，确保包含：
- `installCommand`: 先安装依赖
- `buildCommand`: 然后构建

### 方法 3: 手动触发重新部署

在 Vercel Dashboard 中：
1. 进入你的项目
2. 点击 "Deployments" 标签
3. 找到最新的部署
4. 点击 "..." → "Redeploy"

## ✅ 正确的配置应该是

- **Root Directory**: `client`
- **Framework Preset**: `Vite` 或 `Other`
- **Install Command**: `npm install`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

## 🔍 如果还是失败

检查构建日志，看看是否有其他错误：
- 依赖安装是否成功
- TypeScript 编译是否有错误
- Vite 构建是否有问题

---

**现在去 Vercel Dashboard 检查并修复配置，然后重新部署！** 🔧

