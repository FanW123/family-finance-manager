# 🔧 Vercel 环境变量设置详细指南

## 📍 步骤 3: 在 Vercel 中设置环境变量

### 第一步：进入 Vercel Dashboard

1. 打开浏览器，访问：https://vercel.com/dashboard
2. 登录你的 Vercel 账户
3. 找到你的项目 **FirePath**（或 **family-finance-manager**）
4. 点击项目名称进入项目详情页

### 第二步：进入环境变量设置

1. 在项目详情页，点击顶部导航栏的 **Settings**（设置）
2. 在左侧菜单中，找到并点击 **Environment Variables**（环境变量）

### 第三步：添加环境变量

你需要添加 **4 个环境变量**，按照以下顺序添加：

#### 变量 1: SUPABASE_URL（后端）

1. 在 "Key"（键）输入框输入：`SUPABASE_URL`
2. 在 "Value"（值）输入框输入：`https://xmxvtpuqcnysbvljdohf.supabase.co`
3. 在 "Environment"（环境）选择：**Production, Preview, Development**（全部勾选）
4. 点击 **Add**（添加）或 **Save**（保存）

#### 变量 2: SUPABASE_ANON_KEY（后端）

1. 在 "Key"（键）输入框输入：`SUPABASE_ANON_KEY`
2. 在 "Value"（值）输入框输入：`sb_publishable_YEkgua3dH6UMxx-j1-Zpaw_aNWL4GX4`
3. 在 "Environment"（环境）选择：**Production, Preview, Development**（全部勾选）
4. 点击 **Add**（添加）或 **Save**（保存）

#### 变量 3: VITE_SUPABASE_URL（前端）

1. 在 "Key"（键）输入框输入：`VITE_SUPABASE_URL`
2. 在 "Value"（值）输入框输入：`https://xmxvtpuqcnysbvljdohf.supabase.co`
3. 在 "Environment"（环境）选择：**Production, Preview, Development**（全部勾选）
4. 点击 **Add**（添加）或 **Save**（保存）

#### 变量 4: VITE_SUPABASE_ANON_KEY（前端）

1. 在 "Key"（键）输入框输入：`VITE_SUPABASE_ANON_KEY`
2. 在 "Value"（值）输入框输入：`sb_publishable_YEkgua3dH6UMxx-j1-Zpaw_aNWL4GX4`
3. 在 "Environment"（环境）选择：**Production, Preview, Development**（全部勾选）
4. 点击 **Add**（添加）或 **Save**（保存）

### 第四步：验证环境变量

添加完成后，你应该看到 4 个环境变量：

```
✅ SUPABASE_URL
✅ SUPABASE_ANON_KEY
✅ VITE_SUPABASE_URL
✅ VITE_SUPABASE_ANON_KEY
```

### 第五步：重新部署

1. 点击顶部导航栏的 **Deployments**（部署）
2. 找到最新的部署记录
3. 点击右侧的 **⋯**（三个点）菜单
4. 选择 **Redeploy**（重新部署）
5. 或者，Vercel 可能会自动触发重新部署

## 🎯 快速参考

### 环境变量列表

| 变量名 | 值 | 用途 |
|--------|-----|------|
| `SUPABASE_URL` | `https://xmxvtpuqcnysbvljdohf.supabase.co` | 后端 API |
| `SUPABASE_ANON_KEY` | `sb_publishable_YEkgua3dH6UMxx-j1-Zpaw_aNWL4GX4` | 后端 API Key |
| `VITE_SUPABASE_URL` | `https://xmxvtpuqcnysbvljdohf.supabase.co` | 前端 API |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_YEkgua3dH6UMxx-j1-Zpaw_aNWL4GX4` | 前端 API Key |

### 重要提示

- ⚠️ **注意大小写**：变量名必须完全匹配（`VITE_` 前缀很重要）
- ✅ **选择所有环境**：确保 Production、Preview、Development 都勾选
- 🔄 **重新部署**：添加环境变量后必须重新部署才能生效

## ❓ 常见问题

### Q: 找不到 Environment Variables 选项？

**A**: 
- 确保你在项目详情页，不是组织设置页
- 点击 **Settings** → 左侧菜单应该能看到 **Environment Variables**
- 如果还是没有，检查你的账户权限

### Q: 添加后还是不工作？

**A**: 
- 确认所有 4 个变量都已添加
- 确认环境选择正确（全部勾选）
- **必须重新部署**才能生效
- 检查变量名拼写（注意 `VITE_` 前缀）

### Q: 如何验证环境变量是否生效？

**A**: 
- 重新部署后，在部署日志中查看
- 如果应用正常运行，说明环境变量已生效
- 如果看到认证错误，检查环境变量是否正确

## 📝 检查清单

- [ ] 已登录 Vercel Dashboard
- [ ] 已进入项目设置页面
- [ ] 已找到 Environment Variables 选项
- [ ] 已添加 4 个环境变量
- [ ] 所有变量都选择了所有环境（Production, Preview, Development）
- [ ] 已重新部署项目
- [ ] 部署成功，应用可以正常访问

完成这些步骤后，你的应用就可以正常使用 Supabase 认证了！🎉

