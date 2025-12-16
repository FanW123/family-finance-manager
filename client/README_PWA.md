# PWA 安装说明

## 已实现的功能

1. ✅ Web App Manifest - 应用配置
2. ✅ Service Worker - 离线支持和缓存
3. ✅ 安装提示组件 - 引导用户安装
4. ✅ iOS Safari 优化 - 支持添加到主屏幕

## 需要手动完成的事项

### 1. 安装依赖（可选，用于更好的 PWA 支持）

如果你想使用更强大的 PWA 功能，可以安装：

```bash
cd client
npm install vite-plugin-pwa --save-dev
```

然后更新 `vite.config.ts` 使用插件（已准备好配置，取消注释即可）。

### 2. 创建应用图标

需要创建两个图标文件：
- `/client/public/icon-192.png` (192x192 像素)
- `/client/public/icon-512.png` (512x512 像素)

可以使用在线工具生成：
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

或者使用设计工具创建，建议：
- 使用 FirePath 的 logo
- 背景色：#1a1a2e 或 #0a0a14
- 包含 "FP" 或火焰图标

### 3. 测试 PWA 功能

1. **本地测试**：
   ```bash
   npm run dev
   ```
   在浏览器中打开，查看是否显示安装提示

2. **生产环境测试**：
   ```bash
   npm run build
   npm run preview
   ```
   使用 HTTPS 访问（PWA 需要 HTTPS）

3. **手机测试**：
   - iOS Safari: 打开网站 → 分享 → 添加到主屏幕
   - Android Chrome: 会显示安装横幅

### 4. 部署到生产环境

PWA 需要 HTTPS，建议使用：
- Vercel (免费，自动 HTTPS)
- Netlify (免费，自动 HTTPS)
- GitHub Pages (需要配置)
- 自己的服务器 (需要配置 SSL)

## 当前功能

- ✅ 离线访问（Service Worker 缓存）
- ✅ 添加到主屏幕
- ✅ 独立窗口模式
- ✅ 自动更新提示
- ✅ 安装引导

## 下一步优化

1. 添加数据同步功能
2. 实现推送通知
3. 优化离线体验
4. 添加更新提示

