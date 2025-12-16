# 🚀 FirePath 部署指南

## 快速部署（推荐方法）

### 最简单：使用 Vercel Dashboard

1. **访问** https://vercel.com 并登录

2. **点击 "Add New" → "Project"**

3. **选择部署方式**：
   - **选项 A**: 如果代码在 GitHub，导入仓库
   - **选项 B**: 直接拖拽 `client/dist` 文件夹

4. **配置**（如果选择导入仓库）：
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **点击 Deploy**，等待完成！

## 当前状态

✅ **前端已构建**: `client/dist` 文件夹已准备好
✅ **配置文件**: `vercel.json` 已配置
✅ **PWA 功能**: Service Worker 和 Manifest 已配置
✅ **PIN 码保护**: 已实现

## 部署后步骤

1. **获取 URL**: Vercel 会提供一个 URL
2. **在手机上打开**: 使用手机浏览器访问
3. **添加到主屏幕**: 
   - iPhone: Safari → 分享 → 添加到主屏幕
   - Android: Chrome → 安装应用
4. **开始使用**: 首次打开会提示设置 PIN 码

## 功能说明

- ✅ **数据存储**: 浏览器 localStorage（完全私密）
- ✅ **PIN 码保护**: 每次打开需要验证
- ✅ **离线使用**: Service Worker 支持离线访问
- ✅ **响应式设计**: 完美适配手机和桌面

## 注意事项

- 数据存储在本地，清除浏览器数据会丢失
- PIN 码一定要记住，忘记需要清除数据重置
- 当前版本数据不会同步到云端（后续可添加）

---

**部署完成后，分享你的 URL，我可以帮你测试！** 🎉

