# 家庭财务管理应用

一个用于管理家庭财务的 Web 应用，包括支出跟踪、投资管理和资产再平衡功能。

## 功能特性

1. **支出管理**
   - 按类别/桶跟踪每月支出
   - 预算分析和建议
   - 识别可削减的支出

2. **投资跟踪**
   - 跟踪股票、债券和现金三类资产
   - 投资组合分配可视化
   - 资产再平衡功能

3. **智能建议**
   - 连接金融 API 获取实时价格
   - 自动生成再平衡建议

## 安装

```bash
npm run install:all
```

## 开发

```bash
npm run dev
```

这将同时启动前端（http://localhost:3000）和后端（http://localhost:5001）

## 环境变量

在 `server/.env` 文件中配置（可选，如果不配置 API 密钥，市场数据查询功能将不可用）：

```
PORT=5001
ALPHA_VANTAGE_API_KEY=your_api_key_here
```

### 获取 Alpha Vantage API 密钥

1. 访问 [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. 注册免费账号
3. 获取 API 密钥
4. 将密钥添加到 `server/.env` 文件中

## 使用说明

### 支出管理
- 添加支出记录，按类别分类
- 设置月度预算
- 查看预算分析，识别超支类别
- 系统会自动提示可削减的支出

### 投资跟踪
- 添加投资记录（股票、债券、现金）
- 设置目标资产配置比例
- 查看当前资产分配情况
- 可视化投资组合分布

### 资产再平衡
- 系统自动计算当前配置与目标配置的差异
- 提供买入/卖出建议
- 查询股票实时价格（需要 API 密钥）
- 当差异超过1%时显示再平衡建议

## 技术栈

- **前端**: React 18 + TypeScript + Vite + Tailwind CSS + Recharts
- **后端**: Node.js + Express + TypeScript
- **数据库**: SQLite (better-sqlite3)
- **API**: Alpha Vantage (可选，用于市场数据)

