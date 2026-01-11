# 修复白屏问题

## 已实施的修复

1. **错误边界 (Error Boundary)**
   - 在 `App.tsx` 中添加了 `ErrorBoundary` 组件
   - 捕获 React 组件渲染错误，显示友好的错误提示而不是白屏

2. **全局错误处理**
   - 在 `main.tsx` 中添加了全局错误监听器
   - 捕获未处理的 JavaScript 错误和 Promise 拒绝

3. **改进的错误处理**
   - 在 `App.tsx` 中改进了 `getSession()` 的错误处理
   - 在 `FinanceDashboard.tsx` 中添加了 `loadData()` 的错误保护
   - 确保所有异步操作都有 try-catch 保护

## 诊断步骤

如果另一台电脑仍然出现白屏，请按以下步骤诊断：

### 1. 检查浏览器控制台

打开浏览器开发者工具（F12 或 Cmd+Option+I），查看 Console 标签：

**常见错误：**
- `ERR_CONNECTION_REFUSED` - 后端 API 无法连接
- `401 Unauthorized` - 认证失败
- `Failed to fetch` - 网络请求失败
- `Cannot read property 'xxx' of null` - 空值错误

### 2. 检查网络请求

在开发者工具的 Network 标签中：
- 查看是否有失败的请求（红色）
- 检查 `/api/expenses`、`/api/budget-categories` 等 API 请求的状态码
- 如果看到 401 错误，说明认证有问题

### 3. 检查环境变量

在浏览器控制台运行：
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '已设置' : '未设置');
```

如果显示 `undefined` 或空值，说明环境变量未正确配置。

### 4. 检查 Service Worker

Service Worker 可能缓存了旧版本。尝试：
1. 打开开发者工具 → Application → Service Workers
2. 点击 "Unregister" 注销 Service Worker
3. 清除缓存并刷新页面

### 5. 清除缓存

1. 打开开发者工具 → Application → Storage
2. 点击 "Clear site data"
3. 刷新页面

## 常见问题和解决方案

### 问题 1: 环境变量未设置

**症状：** 控制台显示 "⚠️ Supabase 环境变量未设置！"

**解决：**
1. 在 Vercel Dashboard → Settings → Environment Variables
2. 确保设置了：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. 重新部署应用

### 问题 2: 后端 API 无法连接

**症状：** Network 标签中 API 请求失败

**解决：**
1. 检查后端服务是否正常运行
2. 检查 Vercel 部署状态
3. 检查 `vercel.json` 配置是否正确

### 问题 3: 认证问题

**症状：** 401 错误，或用户状态无法获取

**解决：**
1. 清除 localStorage 和 cookies
2. 重新登录
3. 检查 Supabase 配置是否正确

### 问题 4: Service Worker 缓存问题

**症状：** 页面显示旧版本或白屏

**解决：**
1. 注销 Service Worker（见步骤 4）
2. 清除浏览器缓存
3. 硬刷新页面（Cmd+Shift+R 或 Ctrl+Shift+R）

## 调试信息

现在应用会在控制台输出详细的调试信息：

- `[App]` - App 组件的日志
- `[FinanceDashboard]` - FinanceDashboard 组件的日志
- `[ErrorBoundary]` - 错误边界捕获的错误
- `[Global Error]` - 全局错误监听器捕获的错误

如果看到白屏，请检查控制台中的这些日志，它们会帮助定位问题。

## 如果问题仍然存在

请提供以下信息：
1. 浏览器控制台的完整错误信息（截图或复制文本）
2. Network 标签中失败的请求详情
3. 环境变量检查结果
4. 浏览器类型和版本

