# 🔓 解锁 Vercel Build Command 修改

## 问题

Vercel 不允许修改 Build Command，可能是因为 Framework Preset 自动锁定了。

## 解决方案

### 方法 1: 修改 Framework Preset（推荐）

1. **在 Build and Output Settings 中**
   - 找到 **Framework Preset** 选项
   - 将其改为 **"Other"** 或 **"No Framework"**
   - 这样 Build Command 就可以编辑了

2. **然后修改命令**
   - **Build Command**: `npm run build`（移除 `cd client &&`）
   - **Output Directory**: `dist`（改为 `dist`，不是 `client/dist`）
   - **Install Command**: `npm install`

### 方法 2: 通过 vercel.json 覆盖

我已经更新了 `vercel.json` 文件，它会覆盖 Dashboard 的设置。

你需要：
1. 推送更新后的 `vercel.json` 到 GitHub
2. Vercel 会自动检测并应用配置

推送命令：
```bash
cd /Users/fanwang/SideProjects
git add vercel.json
git commit -m "Fix Vercel build config"
git push origin main
```

### 方法 3: 修改 Root Directory 设置方式

如果还是不行，可以尝试：

1. **临时移除 Root Directory**
   - 将 Root Directory 清空或改为 `.`
   - 这样 Build Command 就可以编辑了
   - 修改 Build Command 为：`cd client && npm install && npm run build`
   - 修改 Output Directory 为：`client/dist`
   - 然后再设置 Root Directory 为 `client`

## ✅ 正确的最终配置

如果 Root Directory = `client`：
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

如果 Root Directory = `.`（根目录）：
- Build Command: `cd client && npm install && npm run build`
- Output Directory: `client/dist`
- Install Command: `cd client && npm install`

## 🎯 推荐操作

1. **先尝试方法 1**：修改 Framework Preset 为 "Other"
2. **如果不行，使用方法 2**：推送 vercel.json（我已经更新好了）
3. **最后尝试方法 3**：调整 Root Directory 的设置

---

**先试试修改 Framework Preset 为 "Other"！** 🔧

