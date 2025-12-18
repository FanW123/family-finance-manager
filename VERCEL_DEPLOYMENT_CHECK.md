# 🚀 Vercel 部署检查清单

## ✅ Vercel 部署应该已经包含所有依赖

因为 `package.json` 中已经包含了 `@supabase/supabase-js`，Vercel 在构建时会自动安装。

## 🔍 检查 Vercel 部署状态

### 1. 检查部署是否成功

1. 打开 Vercel Dashboard: https://vercel.com/dashboard
2. 进入你的项目
3. 点击 **Deployments**（部署）
4. 查看最新的部署状态：
   - ✅ **Ready** = 部署成功
   - ⏳ **Building** = 正在构建
   - ❌ **Error** = 部署失败（点击查看错误详情）

### 2. 检查构建日志

如果部署失败：
1. 点击失败的部署
2. 查看 **Build Logs**（构建日志）
3. 查找错误信息

常见错误：
- `Cannot find module '@supabase/supabase-js'` → 需要检查 package.json
- `Environment variable not found` → 需要检查环境变量设置

## 🔧 解决邮箱验证问题

### 选项 1: 禁用邮箱验证（推荐用于测试）

1. 打开 Supabase Dashboard: https://supabase.com/dashboard/project/xmxvtpuqcnysbvljdohf
2. 进入 **Authentication** → **Providers** → **Email**
3. 找到 **"Confirm email"** 选项
4. **取消勾选** "Enable email confirmations"
5. 点击 **Save**

这样注册后可以直接登录，不需要验证邮箱。

### 选项 2: 配置邮箱验证（生产环境）

如果启用了邮箱验证：
1. 注册后检查邮箱（包括垃圾邮件文件夹）
2. 点击验证链接
3. 应该会跳转回应用并自动登录

## 🧪 测试步骤

### 1. 访问 Vercel 部署

1. 在 Vercel Dashboard → **Deployments**
2. 找到最新的部署（状态为 **Ready**）
3. 点击 **Visit** 或复制 URL
4. 在浏览器中打开

### 2. 测试注册流程

1. 应该看到登录/注册页面
2. 点击 "还没有账户？注册"
3. 输入邮箱和密码（至少6位）
4. 点击 "注册"
5. 如果禁用了邮箱验证，应该直接登录成功
6. 如果启用了邮箱验证，检查邮箱并点击验证链接

### 3. 测试登录流程

1. 如果已注册，输入邮箱和密码
2. 点击 "登录"
3. 应该进入主应用界面

### 4. 测试核心功能

登录后测试：
- ✅ 添加支出记录
- ✅ 查看投资组合
- ✅ 查看 FIRE 进度

## ❓ 常见问题

### Q: Vercel 部署失败

**A**: 
- 检查构建日志中的错误
- 确认 `package.json` 中包含所有依赖
- 确认环境变量已正确设置

### Q: 注册后无法登录

**A**: 
- 检查是否启用了邮箱验证
- 如果启用了，检查邮箱并点击验证链接
- 或者禁用邮箱验证（开发测试用）

### Q: 401 Unauthorized 错误

**A**: 
- 确认 Supabase RLS 策略已正确设置
- 确认环境变量已正确配置
- 检查浏览器控制台的错误信息

## 📝 快速检查清单

- [ ] Vercel 部署状态为 **Ready**
- [ ] 环境变量已设置（4个变量）
- [ ] Supabase RLS 策略已设置
- [ ] 邮箱验证已配置（禁用或启用）
- [ ] 可以访问应用 URL
- [ ] 可以成功注册
- [ ] 可以成功登录
- [ ] 登录后可以正常使用功能

## 🎯 下一步

1. 检查 Vercel 部署状态
2. 在 Supabase 中禁用邮箱验证（如果还没禁用）
3. 测试注册和登录流程
4. 测试核心功能

完成这些步骤后，你的应用应该就可以正常使用了！

