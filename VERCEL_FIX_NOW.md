# 🔧 立即修复 Vercel 构建错误

## 问题

Vercel 在运行 `npm run build` 之前没有先安装依赖，导致 `tsc: command not found` 错误。

## 解决方案（2个步骤）

### 步骤 1: 在 Vercel Dashboard 中修复配置

1. **打开你的 Vercel 项目**
   - 访问 https://vercel.com/dashboard
   - 找到你的项目（family-finance-manager 或 firepath）
   - 点击进入项目

2. **进入 Settings**
   - 点击顶部 "Settings" 标签
   - 在左侧菜单找到 "General"

3. **修改 Build & Development Settings** ⚠️ 重要！

   找到以下设置并确保正确：

   - **Root Directory**: `client` ⚠️ **必须设置！**
     - 点击 "Edit" 或 "Override"
     - 输入：`client`
   
   - **Framework Preset**: `Vite`（推荐）或 `Other`
   
   - **Build Command**: `npm run build`
   
   - **Output Directory**: `dist`
   
   - **Install Command**: `npm install` ⚠️ **这个很重要！**
     - 确保这个设置了，不是空的
     - 应该是：`npm install`

4. **保存**
   - 滚动到底部
   - 点击 "Save" 按钮

### 步骤 2: 重新部署

1. **触发重新部署**
   - 方法 A: 点击顶部 "Deployments" 标签
   - 找到最新的部署（失败的）
   - 点击右侧 "..." 菜单
   - 选择 "Redeploy"
   
   - 或方法 B: 推送新的代码（我已经更新了 vercel.json）

2. **等待构建完成**
   - 查看构建日志
   - 应该看到：
     ```
     Running "install" command: npm install
     Installing dependencies...
     Running "build" command: npm run build
     ```

## ✅ 正确的配置应该是

```
Root Directory: client
Framework Preset: Vite
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

## 🔍 如果还是失败

检查构建日志：
1. 是否成功运行了 `npm install`？
2. 是否安装了所有依赖（包括 TypeScript）？
3. 构建过程中是否有其他错误？

## 📝 我已经更新了 vercel.json

我已经更新了 `vercel.json` 文件，添加了 `installCommand`。你可以：
1. 在 Vercel Dashboard 中手动设置（推荐，更可靠）
2. 或者等待我推送更新后的配置

---

**现在就去 Vercel Dashboard 检查并修复配置！** 🔧

