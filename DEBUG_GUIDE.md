# 🔍 如何查看详细的错误信息

## 问题
页面加载时就出现 500 错误，需要查看服务器端的详细错误信息。

## 方法 1: 查看 Vercel Function Logs（最详细）⭐

### 步骤：

1. **打开 Vercel Dashboard**
   - 访问：https://vercel.com/dashboard
   - 登录你的账户

2. **进入项目**
   - 找到你的项目（family-finance-manager）
   - 点击进入

3. **查看 Functions**
   - 点击顶部 **"Functions"** 标签
   - 找到 **"api"** 函数（这是你的 API 路由）
   - 点击进入

4. **查看 Logs**
   - 在函数详情页面，点击 **"Logs"** 标签页
   - 这里会显示所有服务器端的日志，包括：
     - `console.log()` 输出
     - `console.error()` 输出
     - 错误堆栈信息
     - 认证失败的原因
     - 数据库查询错误

5. **筛选错误**
   - 在日志中查找红色的错误信息
   - 查找包含 "Error" 或 "Failed" 的日志
   - 复制完整的错误信息

### 你会看到类似这样的日志：

```
[ERROR] Authentication failed: No userId returned
[ERROR] Auth header: Present
[ERROR] Error getting user from token: { message: '...', status: 401 }
[ERROR] Error querying expenses: { message: '...', details: '...', hint: '...' }
```

## 方法 2: 浏览器 Network 标签页

### 步骤：

1. **打开开发者工具**
   - 按 `F12` 或右键 → "检查"
   - 切换到 **"Network"** 标签页

2. **刷新页面**
   - 按 `F5` 或点击刷新按钮
   - 确保 Network 标签页是打开的

3. **找到失败的请求**
   - 查找红色的请求（状态码 500 或 401）
   - 通常会是：
     - `/api/expenses?month=12&year=2025`
     - `/api/investments`

4. **查看详细错误**
   - 点击失败的请求
   - 切换到 **"Response"** 标签页
   - 查看服务器返回的 JSON 错误信息

### 你会看到类似这样的响应：

```json
{
  "error": "Failed to query expenses",
  "message": "JWT expired",
  "details": "...",
  "hint": "..."
}
```

## 方法 3: 浏览器 Console 标签页

### 步骤：

1. **打开开发者工具**
   - 按 `F12`
   - 切换到 **"Console"** 标签页

2. **查看错误**
   - 查找红色的错误信息
   - 现在我已经改进了错误处理，会显示更详细的错误

3. **展开错误对象**
   - 点击错误旁边的 `▶` 展开
   - 查看 `error.response.data` 中的详细信息

## 🔧 常见错误和解决方案

### 错误 1: "Unauthorized. Please log in."
**原因**：认证失败，JWT token 无效或过期

**解决方案**：
- 重新登录
- 检查 Vercel 环境变量 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 是否正确设置

### 错误 2: "Failed to query expenses"
**原因**：数据库查询失败

**可能的原因**：
- Supabase 连接失败
- RLS 策略阻止了查询
- 表不存在

**解决方案**：
- 检查 Supabase Dashboard 中的表是否存在
- 检查 RLS 策略是否正确设置
- 查看 Vercel Function Logs 中的详细错误信息

### 错误 3: "Database initialization failed"
**原因**：Supabase 客户端初始化失败

**解决方案**：
- 检查 Vercel 环境变量是否设置
- 确认 Supabase 项目 URL 和 API Key 正确

## 📝 需要提供的信息

当你找到错误信息后，请提供：

1. **Vercel Function Logs 中的完整错误信息**
2. **浏览器 Network 标签页中的 Response 内容**
3. **错误发生的时间**（页面加载时？还是点击某个按钮后？）

这样我就能准确定位问题并修复！

