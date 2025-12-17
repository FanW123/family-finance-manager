import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../apiClient';

const COLORS = {
  primary: '#1a1a2e',
  secondary: '#16213e',
  accent: '#0f3460',
  highlight: '#e94560',
  success: '#00d9ff',
  warning: '#ffd369',
  stocks: '#e94560',
  bonds: '#00d9ff',
  cash: '#ffd369',
  background: '#0a0a14',
  card: '#16213e',
  text: '#eee',
  textMuted: '#a0a0b0'
};

// FIRE-focused expense categories
const EXPENSE_CATEGORIES = {
  essential: {
    label: '必需支出（退休后继续）',
    color: '#e94560',
    categories: [
      { value: 'housing', label: '住房 - 房贷/租金' },
      { value: 'utilities', label: '水电煤网' },
      { value: 'food_groceries', label: '食品杂货' },
      { value: 'insurance_health', label: '医疗保险' },
      { value: 'insurance_other', label: '汽车/人身保险' },
      { value: 'property_tax', label: '房产税' }
    ]
  },
  workRelated: {
    label: '工作相关（退休后消失）',
    color: '#00d9ff',
    categories: [
      { value: 'commute', label: '通勤交通' },
      { value: 'work_meals', label: '工作餐饮' },
      { value: 'work_clothing', label: '职业装' },
      { value: 'work_tools', label: '职业发展/培训' }
    ]
  },
  discretionary: {
    label: '可选支出',
    color: '#ffd369',
    categories: [
      { value: 'dining_out', label: '外出就餐' },
      { value: 'entertainment', label: '娱乐休闲' },
      { value: 'travel', label: '旅行度假' },
      { value: 'shopping', label: '购物消费' },
      { value: 'subscriptions', label: '订阅服务' }
    ]
  },
  savingsInvestment: {
    label: '储蓄与投资',
    color: '#06ffa5',
    categories: [
      { value: 'savings_401k', label: '401(k)供款' },
      { value: 'savings_ira', label: 'IRA供款' },
      { value: 'savings_taxable', label: '应税投资账户' },
      { value: 'savings_hsa', label: 'HSA供款' },
      { value: 'savings_emergency', label: '紧急储备金' }
    ]
  },
  debt: {
    label: '债务偿还',
    color: '#9d4edd',
    categories: [
      { value: 'debt_student', label: '学生贷款' },
      { value: 'debt_car', label: '车贷' },
      { value: 'debt_credit', label: '信用卡还款' },
      { value: 'debt_other', label: '其他债务' }
    ]
  }
};

interface Expense {
  id: number;
  category: string;
  amount: number;
  description: string;
  date: string;
}

interface Investment {
  id: number;
  type: 'stocks' | 'bonds' | 'cash' | 'crypto';
  amount: number;
  symbol?: string | null;
  name: string;
  price?: number | null;
  quantity?: number | null;
  account?: string | null; // 新增账户字段
  date: string;
}

const FinanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [fireMultiplier, setFireMultiplier] = useState(28.6);
  const [retirementYears, setRetirementYears] = useState(50);
  const [targetAllocation, setTargetAllocation] = useState({
    stocks: 40,
    bonds: 40,
    cash: 20
  });
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: '', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'current' | 'trends'>('current');
  
  // Investment management states
  const [showAddInvestment, setShowAddInvestment] = useState(false);
  const [editingInvestmentId, setEditingInvestmentId] = useState<number | null>(null);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string | null>(null);
  const [newInvestment, setNewInvestment] = useState({
    type: 'stocks',
    symbol: '',
    name: '',
    amount: '',
    price: '',
    quantity: '',
    account: '', // 新增账户字段
    date: new Date().toISOString().split('T')[0],
  });
  const [editingInvestment, setEditingInvestment] = useState({
    type: '',
    symbol: '',
    name: '',
    amount: '',
    price: '',
    quantity: '',
    account: '', // 添加账户字段
    date: '',
  });
  const [showCashCalculator, setShowCashCalculator] = useState(false);
  const [cashAccounts, setCashAccounts] = useState(() => {
    // 从 localStorage 恢复现金账户数据
    const savedAccounts = localStorage.getItem('cashAccounts');
    if (savedAccounts) {
      try {
        return JSON.parse(savedAccounts);
      } catch (e) {
        console.error('Failed to parse saved cash accounts:', e);
      }
    }
    return [{ id: 1, name: '', amount: '' }];
  });

  // Load data from API
  useEffect(() => {
    loadData();
    checkAndRefreshPrices();
    
    // Load last update time
    const lastUpdate = localStorage.getItem('lastPriceUpdate');
    if (lastUpdate) {
      setLastPriceUpdate(lastUpdate);
    }
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load expenses
      const expensesRes = await api.get(`/expenses?month=${selectedMonth}&year=${selectedYear}`);
      setExpenses(expensesRes.data);

      // Load investments
      const investmentsRes = await api.get('/investments');
      setInvestments(investmentsRes.data);

      // Load target allocation
      const targetRes = await api.get('/investments/target-allocation');
      if (targetRes.data) {
        setTargetAllocation(targetRes.data);
      }

      // Load monthly income from localStorage (or could be from API)
      const savedIncome = localStorage.getItem('monthlyIncome');
      if (savedIncome) {
        setMonthlyIncome(parseFloat(savedIncome));
      }

      const savedMultiplier = localStorage.getItem('fireMultiplier');
      if (savedMultiplier) {
        setFireMultiplier(parseFloat(savedMultiplier));
      }

      const savedYears = localStorage.getItem('retirementYears');
      if (savedYears) {
        setRetirementYears(parseInt(savedYears));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async () => {
    if (newExpense.category && newExpense.amount && newExpense.date) {
      try {
        await api.post('/expenses', {
          category: newExpense.category,
          amount: parseFloat(newExpense.amount),
          description: newExpense.description || '',
          date: newExpense.date
        });
        await loadData();
        setNewExpense({ category: '', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
        setShowAddExpense(false);
      } catch (error) {
        console.error('Error adding expense:', error);
        alert('添加支出失败');
      }
    }
  };

  const deleteExpense = async (id: number) => {
    if (!confirm('确定要删除这条支出吗？')) return;
    try {
      await api.delete(`/expenses/${id}`);
      await loadData();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('删除失败');
    }
  };

  // Investment management functions
  const checkAndRefreshPrices = async () => {
    const lastUpdate = localStorage.getItem('lastPriceUpdate');
    if (!lastUpdate) {
      return;
    }

    const lastUpdateTime = new Date(lastUpdate);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60);

    if (hoursDiff >= 24) {
      await refreshStockPrices();
    }
  };

  const refreshStockPrices = async () => {
    setRefreshingPrices(true);
    try {
      const stocksWithSymbols = investments.filter(inv => inv.type === 'stocks' && inv.symbol);
      
      if (stocksWithSymbols.length === 0) {
        alert('没有找到需要更新价格的股票（需要有股票代码）');
        setRefreshingPrices(false);
        return;
      }

      console.log(`准备更新 ${stocksWithSymbols.length} 只股票的价格...`);
      let successCount = 0;
      let failCount = 0;
      let apiKeyMissing = false;
      
      for (const stock of stocksWithSymbols) {
        try {
          console.log(`正在获取 ${stock.symbol} 的价格...`);
          const res = await api.get(`/rebalancing/market-data/${stock.symbol}`);
          if (res.data && res.data.price) {
            await api.put(`/investments/${stock.id}`, {
              type: stock.type,
              symbol: stock.symbol,
              name: stock.name || stock.symbol,
              price: res.data.price,
              quantity: stock.quantity,
              amount: res.data.price * (stock.quantity || 0),
              date: stock.date,
            });
            console.log(`${stock.symbol} 价格已更新: ¥${res.data.price}`);
            successCount++;
          } else {
            console.warn(`${stock.symbol} 未返回价格数据`);
            failCount++;
          }
        } catch (error: any) {
          console.error(`更新 ${stock.symbol} 价格失败:`, error);
          if (error.response?.status === 503) {
            apiKeyMissing = true;
          } else if (error.response?.status === 404) {
            console.warn(`${stock.symbol}: 股票代码未找到，可能不是有效的股票代码`);
          } else if (error.response?.status === 429) {
            console.warn(`${stock.symbol}: API 速率限制，请稍后再试`);
          }
          failCount++;
        }
      }

      const now = new Date().toISOString();
      localStorage.setItem('lastPriceUpdate', now);
      setLastPriceUpdate(now);

      await loadData();
      
      if (apiKeyMissing) {
        alert(`⚠️ Alpha Vantage API Key 未配置\n\n自动价格更新需要 API Key。\n\n临时方案：可以点击"编辑"按钮手动更新价格。\n\n获取免费 API Key：\nhttps://www.alphavantage.co/support/#api-key\n\n然后在服务器的 .env 文件中设置：\nALPHA_VANTAGE_API_KEY=your_key`);
      } else if (failCount > 0) {
        alert(`价格更新完成！\n✅ 成功: ${successCount} 只\n❌ 失败: ${failCount} 只\n\n失败原因可能：\n1. 股票代码无效（如 VRT、ONDS）\n2. 加密货币（DOGE、SHIB）不支持\n3. API 速率限制\n\n💡 建议：\n- 点击"编辑"按钮手动更新价格\n- 或检查浏览器控制台查看详细错误`);
      } else {
        alert(`✅ 价格更新完成！成功更新 ${successCount} 只股票`);
      }
    } catch (error) {
      console.error('更新价格时出错:', error);
      alert('更新价格失败，请检查API配置或网络连接');
    } finally {
      setRefreshingPrices(false);
    }
  };

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const quantity = parseFloat(newInvestment.quantity);
      const price = parseFloat(newInvestment.price);
      const amount = quantity * price;
      
      await api.post('/investments', {
        type: newInvestment.type,
        symbol: newInvestment.symbol || null,
        name: newInvestment.symbol || '', // Use symbol as name
        amount: amount,
        price: price,
        quantity: quantity,
        account: newInvestment.account || null, // 添加账户字段
        date: newInvestment.date,
      });
      setNewInvestment({
        type: 'stocks',
        symbol: '',
        name: '',
        amount: '',
        price: '',
        quantity: '',
        account: '', // 重置账户字段
        date: new Date().toISOString().split('T')[0],
      });
      setShowAddInvestment(false);
      loadData();
    } catch (error) {
      console.error('Error adding investment:', error);
      alert('添加投资失败');
    }
  };

  const handleStartEditInvestment = (investment: Investment) => {
    setEditingInvestmentId(investment.id);
    setEditingInvestment({
      type: investment.type,
      symbol: investment.symbol || '',
      name: investment.name,
      amount: investment.amount.toString(),
      price: investment.price ? investment.price.toString() : '',
      quantity: investment.quantity ? investment.quantity.toString() : '',
      account: investment.account || '', // 添加账户字段
      date: investment.date || new Date().toISOString().split('T')[0],
    });
  };

  const handleCancelEditInvestment = () => {
    setEditingInvestmentId(null);
    setEditingInvestment({
      type: '',
      symbol: '',
      name: '',
      amount: '',
      price: '',
      quantity: '',
      account: '', // 添加账户字段
      date: '',
    });
  };

  const handleSaveEditInvestment = async (id: number) => {
    try {
      await api.put(`/investments/${id}`, {
        ...editingInvestment,
        amount: parseFloat(editingInvestment.amount),
        price: editingInvestment.price ? parseFloat(editingInvestment.price) : null,
        quantity: editingInvestment.quantity ? parseFloat(editingInvestment.quantity) : null,
        symbol: editingInvestment.symbol || null,
        account: editingInvestment.account || null, // 添加账户字段
      });
      setEditingInvestmentId(null);
      loadData();
    } catch (error) {
      console.error('Error updating investment:', error);
      alert('更新失败');
    }
  };

  const handleDeleteInvestment = async (id: number) => {
    if (!confirm('确定要删除这条投资记录吗？')) return;
    try {
      await api.delete(`/investments/${id}`);
      loadData();
    } catch (error) {
      console.error('Error deleting investment:', error);
      alert('删除失败');
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'stocks' ? '股票' : type === 'bonds' ? '债券' : '现金';
  };

  const updateTargetAllocation = async (type: 'stocks' | 'bonds' | 'cash', value: number) => {
    const updated = { ...targetAllocation, [type]: value };
    setTargetAllocation(updated);
    try {
      await api.post('/investments/target-allocation', updated);
    } catch (error) {
      console.error('Error updating target allocation:', error);
    }
  };

  // Calculate expense categories
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalExpenses = Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0);

  // Calculate FIRE metrics
  const getCategoryGroup = (category: string) => {
    for (const [groupKey, group] of Object.entries(EXPENSE_CATEGORIES)) {
      if (group.categories.some(cat => cat.value === category)) {
        return groupKey;
      }
    }
    return 'other';
  };

  // Filter expenses by selected month/year
  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() + 1 === selectedMonth && expenseDate.getFullYear() === selectedYear;
  });

  // Calculate monthly aggregations
  const getMonthlyAggregation = () => {
    const monthlyData: Record<string, {
      total: number;
      byGroup: Record<string, number>;
      count: number;
      month: number;
      year: number;
    }> = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          total: 0,
          byGroup: {},
          count: 0,
          month: date.getMonth() + 1,
          year: date.getFullYear()
        };
      }
      
      monthlyData[monthKey].total += expense.amount;
      monthlyData[monthKey].count += 1;
      
      const group = getCategoryGroup(expense.category);
      monthlyData[monthKey].byGroup[group] = (monthlyData[monthKey].byGroup[group] || 0) + expense.amount;
    });
    
    return monthlyData;
  };

  const monthlyAggregation = getMonthlyAggregation();
  
  // Get trend data for last 12 months
  const getTrendData = () => {
    const trends: Array<{
      month: string;
      monthKey: string;
      total: number;
      essential: number;
      workRelated: number;
      discretionary: number;
      savings: number;
      debt: number;
    }> = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('zh-CN', { month: 'short', year: '2-digit' });
      
      const monthData = monthlyAggregation[monthKey];
      
      trends.push({
        month: monthName,
        monthKey: monthKey,
        total: monthData?.total || 0,
        essential: monthData?.byGroup?.essential || 0,
        workRelated: monthData?.byGroup?.workRelated || 0,
        discretionary: monthData?.byGroup?.discretionary || 0,
        savings: monthData?.byGroup?.savingsInvestment || 0,
        debt: monthData?.byGroup?.debt || 0
      });
    }
    
    return trends;
  };

  const trendData = getTrendData();
  
  // Current month vs previous month comparison
  const currentMonthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const currentMonthTotal = monthlyAggregation[currentMonthKey]?.total || 0;
  
  const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
  const prevMonthKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  const prevMonthTotal = monthlyAggregation[prevMonthKey]?.total || 0;
  
  const monthOverMonthChange = prevMonthTotal > 0 ? ((currentMonthTotal - prevMonthTotal) / prevMonthTotal * 100) : 0;

  // Calculate expenses for filtered month
  const expensesByGroup = filteredExpenses.reduce((acc, expense) => {
    const group = getCategoryGroup(expense.category);
    acc[group] = (acc[group] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const essentialExpenses = expensesByGroup.essential || 0;
  const workRelatedExpenses = expensesByGroup.workRelated || 0;
  const discretionaryExpenses = expensesByGroup.discretionary || 0;
  const savingsInvestment = expensesByGroup.savingsInvestment || 0;
  const debtPayments = expensesByGroup.debt || 0;

  const retirementExpenses = essentialExpenses + discretionaryExpenses;
  const savingsRate = monthlyIncome > 0 ? ((savingsInvestment / monthlyIncome) * 100) : 0;

  const currentWithdrawalRate = fireMultiplier > 0 ? (100 / fireMultiplier) : 0;
  const fireNumber = retirementExpenses * 12 * fireMultiplier;

  // Calculate portfolio metrics
  const portfolio = investments.reduce((acc, inv) => {
    // For cash, use amount directly; for stocks/bonds/crypto, calculate from quantity * price
    const amount = inv.type === 'cash' 
      ? (inv.amount || 0)
      : ((inv.quantity || 0) * (inv.price || 0));
    acc[inv.type] = (acc[inv.type] || 0) + amount;
    return acc;
  }, { stocks: 0, bonds: 0, cash: 0, crypto: 0 } as Record<string, number>);

  const totalPortfolio = portfolio.stocks + portfolio.bonds + portfolio.cash + (portfolio.crypto || 0);
  
  const currentAllocation = {
    stocks: totalPortfolio > 0 ? (portfolio.stocks / totalPortfolio * 100) : 0,
    bonds: totalPortfolio > 0 ? (portfolio.bonds / totalPortfolio * 100) : 0,
    cash: totalPortfolio > 0 ? (portfolio.cash / totalPortfolio * 100) : 0
  };

  const portfolioChartData = [
    { name: 'Stocks', current: portfolio.stocks, target: totalPortfolio * targetAllocation.stocks / 100 },
    { name: 'Bonds', current: portfolio.bonds, target: totalPortfolio * targetAllocation.bonds / 100 },
    { name: 'Cash', current: portfolio.cash, target: totalPortfolio * targetAllocation.cash / 100 }
  ];

  // Rebalancing suggestions
  const getRebalanceSuggestions = () => {
    const suggestions: Array<{
      asset: string;
      action: 'Reduce' | 'Increase';
      amount: number;
      currentPct: number;
      targetPct: number;
    }> = [];
    const threshold = 5;

    Object.keys(targetAllocation).forEach(asset => {
      const diff = currentAllocation[asset as keyof typeof currentAllocation] - targetAllocation[asset as keyof typeof targetAllocation];
      if (Math.abs(diff) > threshold) {
        const amountDiff = (diff / 100) * totalPortfolio;
        suggestions.push({
          asset,
          action: diff > 0 ? 'Reduce' : 'Increase',
          amount: Math.abs(amountDiff),
          currentPct: currentAllocation[asset as keyof typeof currentAllocation],
          targetPct: targetAllocation[asset as keyof typeof targetAllocation]
        });
      }
    });

    return suggestions;
  };

  const rebalanceSuggestions = getRebalanceSuggestions();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.background} 0%, ${COLORS.primary} 100%)`,
        color: COLORS.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Outfit", -apple-system, sans-serif'
      }}>
        <div>加载中...</div>
      </div>
    );
  }

  return (
    <div className="finance-dashboard-main" style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.background} 0%, ${COLORS.primary} 100%)`,
      color: COLORS.text,
      fontFamily: '"Outfit", -apple-system, sans-serif',
      padding: '2rem'
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
      <style>{`
        @media (max-width: 768px) {
          /* 减少主容器padding */
          .finance-dashboard-main {
            padding: 1rem 0.5rem !important;
          }
          
          .tab-navigation-mobile {
            display: flex !important;
            flex-wrap: nowrap !important;
            gap: 0.25rem !important;
            overflow-x: hidden !important;
            width: 100% !important;
            justify-content: space-between !important;
          }
          .tab-button-mobile {
            flex: 1 1 0 !important;
            min-width: 0 !important;
            padding: 0.75rem 0.5rem !important;
            font-size: clamp(1rem, 3.5vw, 1.3rem) !important;
            white-space: nowrap !important;
            text-align: center !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          /* FIRE支出分析 - 两列布局改为单列 */
          .fire-expense-analysis-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          /* 图表容器在移动端 */
          .fire-chart-container {
            width: 100% !important;
            height: 250px !important;
          }
          /* 趋势分析表格优化 */
          .trends-table-container {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .trends-table {
            font-size: 0.85rem !important;
            min-width: 600px !important;
          }
          .trends-table th,
          .trends-table td {
            padding: 0.75rem 0.5rem !important;
          }
          /* 卡片padding减少 */
          .card-mobile {
            padding: 1rem !important;
          }
        }
        @media (max-width: 480px) {
          .finance-dashboard-main {
            padding: 0.75rem 0.25rem !important;
          }
          .tab-button-mobile {
            padding: 0.5rem 0.25rem !important;
            font-size: clamp(0.95rem, 3.2vw, 1.2rem) !important;
          }
          .fire-chart-container {
            height: 200px !important;
          }
          .trends-table {
            font-size: 0.75rem !important;
            min-width: 550px !important;
          }
          .trends-table th,
          .trends-table td {
            padding: 0.5rem 0.25rem !important;
          }
          .card-mobile {
            padding: 0.75rem !important;
          }
        }
      `}</style>
      
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{
                fontSize: '3.5rem',
                fontWeight: '700',
                margin: '0 0 0.5rem 0',
                background: `linear-gradient(135deg, ${COLORS.highlight} 0%, ${COLORS.success} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em'
              }}>
                FirePath
              </h1>
              <p style={{
                fontSize: '1.1rem',
                color: COLORS.textMuted,
                margin: 0,
                fontWeight: '300'
              }}>
                自由之路 · 通往财务自由的每一步
              </p>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="tab-navigation-mobile" style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: `1px solid ${COLORS.accent}`
        }}>
          {['dashboard', 'expenses', 'portfolio', 'rebalance'].map(tab => (
            <button
              key={tab}
              className="tab-button-mobile"
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === tab ? COLORS.highlight : COLORS.textMuted,
                padding: '1rem 1.5rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                borderBottom: activeTab === tab ? `3px solid ${COLORS.highlight}` : 'none',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit'
              }}
            >
              {tab === 'dashboard' ? 'FIRE进度' : tab === 'expenses' ? '月度支出' : tab === 'portfolio' ? '投资组合' : '再平衡建议'}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            {/* FIRE Key Metrics Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                border: `2px solid ${COLORS.success}`
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                  储蓄率 (Savings Rate)
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: COLORS.success }}>
                  {savingsRate.toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginTop: '0.5rem' }}>
                  目标: ≥50% for FIRE
                </div>
                {savingsRate >= 50 && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.25rem 0.5rem',
                    background: `${COLORS.success}20`,
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    color: COLORS.success,
                    fontWeight: '600'
                  }}>
                    ✓ 目标达成
                  </div>
                )}
              </div>

              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                  必需支出/月
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: COLORS.highlight }}>
                  ¥{essentialExpenses.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginTop: '0.5rem' }}>
                  退休后继续
                </div>
              </div>

              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                  退休后总支出
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                  ¥{retirementExpenses.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginTop: '0.5rem' }}>
                  年需求: ¥{(retirementExpenses * 12).toLocaleString()}
                </div>
              </div>

              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                  FIRE数字 ({fireMultiplier.toFixed(1)}x)
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: COLORS.warning }}>
                  ¥{fireNumber.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginTop: '0.5rem' }}>
                  {currentWithdrawalRate.toFixed(2)}% 提取率
                </div>
              </div>
            </div>

            {/* FIRE Progress Section */}
            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>FIRE 进度追踪</h3>
              
              {/* Current Portfolio vs FIRE Number */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: COLORS.textMuted }}>当前总资产</span>
                  <span style={{ fontSize: '0.9rem', color: COLORS.textMuted }}>FIRE目标</span>
                </div>
                <div style={{
                  background: COLORS.accent,
                  borderRadius: '0.5rem',
                  height: '2rem',
                  position: 'relative',
                  overflow: 'hidden',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    background: `linear-gradient(90deg, ${COLORS.success} 0%, ${COLORS.highlight} 100%)`,
                    height: '100%',
                    width: `${Math.min((totalPortfolio / fireNumber) * 100, 100)}%`,
                    transition: 'width 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: COLORS.text,
                    fontWeight: '600',
                    fontSize: '0.85rem'
                  }}>
                    {totalPortfolio > 0 && `${((totalPortfolio / fireNumber) * 100).toFixed(1)}%`}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: COLORS.textMuted }}>
                  <span>¥{totalPortfolio.toLocaleString()}</span>
                  <span>¥{fireNumber.toLocaleString()}</span>
                </div>
                {totalPortfolio >= fireNumber && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: `${COLORS.success}20`,
                    border: `1px solid ${COLORS.success}`,
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: COLORS.success
                  }}>
                    🎉 恭喜！您已达到 FIRE 目标！
                  </div>
                )}
                {totalPortfolio < fireNumber && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: `${COLORS.warning}20`,
                    border: `1px solid ${COLORS.warning}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem'
                  }}>
                    <strong>距离 FIRE 目标还差:</strong> ¥{(fireNumber - totalPortfolio).toLocaleString()}
                    {monthlyIncome > 0 && savingsRate > 0 && (
                      <div style={{ marginTop: '0.5rem', color: COLORS.textMuted }}>
                        按当前储蓄率，预计还需: {Math.ceil((fireNumber - totalPortfolio) / (monthlyIncome * savingsRate / 100))} 个月
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Expense Recommendations based on FIRE Progress */}
              {monthlyIncome > 0 && totalPortfolio < fireNumber && (
                <div style={{
                  background: `${COLORS.success}10`,
                  border: `1px solid ${COLORS.success}`,
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem', color: COLORS.success }}>
                    💡 基于 FIRE 进度的支出建议
                  </h4>
                  
                  {/* Calculate recommended monthly expenses */}
                  {(() => {
                    const remainingAmount = fireNumber - totalPortfolio;
                    const targetMonths = retirementYears * 12; // 假设还有这么多月
                    const requiredMonthlySavings = remainingAmount / targetMonths;
                    const recommendedMaxExpenses = monthlyIncome - requiredMonthlySavings;
                    const currentTotalExpenses = totalExpenses;
                    const recommendedSavingsRate = (requiredMonthlySavings / monthlyIncome) * 100;
                    const canAffordExpenses = recommendedMaxExpenses > 0;

                    return (
                      <div>
                        {canAffordExpenses ? (
                          <>
                            <div style={{ marginBottom: '1rem' }}>
                              <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                                为实现 FIRE 目标，建议:
                              </div>
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '1rem',
                                marginBottom: '1rem'
                              }}>
                                <div style={{
                                  padding: '0.75rem',
                                  background: COLORS.accent,
                                  borderRadius: '0.5rem',
                                  borderLeft: `4px solid ${COLORS.success}`
                                }}>
                                  <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginBottom: '0.25rem' }}>
                                    建议月度储蓄
                                  </div>
                                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: COLORS.success }}>
                                    ¥{requiredMonthlySavings.toLocaleString()}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, marginTop: '0.25rem' }}>
                                    储蓄率: {recommendedSavingsRate.toFixed(1)}%
                                  </div>
                                </div>
                                <div style={{
                                  padding: '0.75rem',
                                  background: COLORS.accent,
                                  borderRadius: '0.5rem',
                                  borderLeft: `4px solid ${COLORS.warning}`
                                }}>
                                  <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginBottom: '0.25rem' }}>
                                    建议最大支出
                                  </div>
                                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: COLORS.warning }}>
                                    ¥{recommendedMaxExpenses.toLocaleString()}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, marginTop: '0.25rem' }}>
                                    当前: ¥{currentTotalExpenses.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {currentTotalExpenses > recommendedMaxExpenses && (
                              <div style={{
                                padding: '0.75rem',
                                background: `${COLORS.highlight}20`,
                                border: `1px solid ${COLORS.highlight}`,
                                borderRadius: '0.5rem',
                                marginBottom: '1rem',
                                fontSize: '0.85rem'
                              }}>
                                <strong>⚠️ 当前支出超出建议:</strong> 超出 ¥{(currentTotalExpenses - recommendedMaxExpenses).toLocaleString()}
                                <div style={{ marginTop: '0.5rem', color: COLORS.textMuted }}>
                                  建议削减支出以提高储蓄率，加速 FIRE 进度
                                </div>
                              </div>
                            )}
                            
                            {currentTotalExpenses <= recommendedMaxExpenses && (
                              <div style={{
                                padding: '0.75rem',
                                background: `${COLORS.success}20`,
                                border: `1px solid ${COLORS.success}`,
                                borderRadius: '0.5rem',
                                marginBottom: '1rem',
                                fontSize: '0.85rem',
                                color: COLORS.success
                              }}>
                                ✓ 当前支出在建议范围内，保持当前节奏即可
                              </div>
                            )}

                            <div style={{
                              padding: '0.75rem',
                              background: COLORS.accent,
                              borderRadius: '0.5rem',
                              fontSize: '0.85rem',
                              marginBottom: '1rem'
                            }}>
                              <div style={{ marginBottom: '0.5rem', fontWeight: '600' }}>优化建议:</div>
                              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: COLORS.textMuted }}>
                                <li>优先削减"可选支出"类别（当前: ¥{discretionaryExpenses.toLocaleString()}）</li>
                                <li>工作相关支出退休后会消失，无需过度优化</li>
                                <li>保持必需支出在合理范围（当前: ¥{essentialExpenses.toLocaleString()}）</li>
                                {savingsRate < 50 && (
                                  <li style={{ color: COLORS.warning }}>
                                    <strong>目标储蓄率 ≥50%，当前 {savingsRate.toFixed(1)}%，需要提高 {(50 - savingsRate).toFixed(1)}%</strong>
                                  </li>
                                )}
                              </ul>
                            </div>

                            {/* Auto-update button */}
                            <button
                              onClick={async () => {
                                if (confirm(`确定要将建议的最大支出 ¥${recommendedMaxExpenses.toLocaleString()} 应用到月度预算吗？\n\n这将帮助您更好地控制支出，加速 FIRE 进度。`)) {
                                  try {
                                    // 为必需支出和可选支出设置预算
                                    if (essentialExpenses > 0) {
                                      await api.post('/expenses/budgets', {
                                        category: 'housing', // 使用一个通用类别作为示例
                                        monthly_limit: essentialExpenses * 1.1 // 留10%缓冲
                                      });
                                    }
                                    
                                    alert('预算建议已应用！请前往"月度支出"标签页查看和调整详细预算。');
                                    // 刷新数据
                                    await loadData();
                                  } catch (error) {
                                    console.error('Error applying budget suggestions:', error);
                                    alert('应用预算建议失败，请手动设置预算');
                                  }
                                }
                              }}
                              style={{
                                width: '100%',
                                background: `linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.highlight} 100%)`,
                                border: 'none',
                                color: 'white',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                marginTop: '0.5rem'
                              }}
                            >
                              📊 应用支出建议到月度预算
                            </button>
                          </>
                        ) : (
                          <div style={{
                            padding: '0.75rem',
                            background: `${COLORS.highlight}20`,
                            border: `1px solid ${COLORS.highlight}`,
                            borderRadius: '0.5rem',
                            fontSize: '0.85rem'
                          }}>
                            <strong>⚠️ 收入不足:</strong> 当前收入无法在预期时间内达到 FIRE 目标
                            <div style={{ marginTop: '0.5rem', color: COLORS.textMuted }}>
                              建议: 增加收入或延长退休时间
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
              </div>

            {/* Expense Breakdown Summary */}
            {totalExpenses > 0 && (
              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '2rem',
                marginBottom: '2rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>本月支出概览</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {[
                    { label: '必需支出', value: essentialExpenses, color: COLORS.highlight },
                    { label: '工作相关', value: workRelatedExpenses, color: COLORS.bonds },
                    { label: '可选支出', value: discretionaryExpenses, color: COLORS.warning },
                    { label: '储蓄投资', value: savingsInvestment, color: COLORS.success },
                    { label: '债务偿还', value: debtPayments, color: '#9d4edd' }
                  ].filter(item => item.value > 0).map((item, idx) => (
                    <div key={idx} style={{
                      padding: '1rem',
                      background: COLORS.accent,
                      borderRadius: '0.5rem',
                      borderLeft: `4px solid ${item.color}`
                    }}>
                      <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginBottom: '0.25rem' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '1.3rem', fontWeight: '700', color: item.color }}>
                        ¥{item.value.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: COLORS.accent,
                  borderRadius: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1rem', fontWeight: '600' }}>本月总支出（{selectedYear}年{selectedMonth}月）</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.highlight }}>
                      ¥{currentMonthTotal.toLocaleString()}
                    </span>
                  </div>
                  {prevMonthTotal > 0 && (
                    <div style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: COLORS.textMuted }}>
                      <span>vs 上月:</span>
                      <span style={{ 
                        color: monthOverMonthChange > 0 ? COLORS.highlight : COLORS.success,
                        fontWeight: '600'
                      }}>
                        {monthOverMonthChange > 0 ? '↑' : '↓'} {Math.abs(monthOverMonthChange).toFixed(1)}%
                      </span>
                      <span style={{ fontSize: '0.85rem' }}>
                        (¥{prevMonthTotal.toLocaleString()})
                      </span>
                    </div>
                  )}
                  <div style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                    {filteredExpenses.length} 笔交易
                  </div>
                </div>
              </div>
            )}

            {/* Portfolio Summary */}
            {totalPortfolio > 0 && (
              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '2rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>投资组合概览</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  <div style={{
                    padding: '1rem',
                    background: COLORS.accent,
                    borderRadius: '0.5rem',
                    border: `2px solid ${COLORS.stocks}`
                  }}>
                    <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginBottom: '0.25rem' }}>股票</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '700', color: COLORS.stocks }}>
                      ¥{portfolio.stocks.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
                      {currentAllocation.stocks.toFixed(1)}%
                    </div>
                  </div>
                  <div style={{
                    padding: '1rem',
                    background: COLORS.accent,
                    borderRadius: '0.5rem',
                    border: `2px solid ${COLORS.bonds}`
                  }}>
                    <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginBottom: '0.25rem' }}>债券</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '700', color: COLORS.bonds }}>
                      ¥{portfolio.bonds.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
                      {currentAllocation.bonds.toFixed(1)}%
                    </div>
                  </div>
                  <div style={{
                    padding: '1rem',
                    background: COLORS.accent,
                    borderRadius: '0.5rem',
                    border: `2px solid ${COLORS.cash}`
                  }}>
                    <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginBottom: '0.25rem' }}>现金</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '700', color: COLORS.cash }}>
                      ¥{portfolio.cash.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
                      {currentAllocation.cash.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: COLORS.accent,
                  borderRadius: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '1rem', fontWeight: '600' }}>总资产</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                    ¥{totalPortfolio.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div>
            {/* Month/Year Selector and View Switcher */}
            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.9rem', color: COLORS.textMuted }}>选择月份:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  style={{
                    padding: '0.6rem 1rem',
                    background: COLORS.accent,
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: COLORS.text,
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                    <option key={m} value={m}>{m}月</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  style={{
                    padding: '0.6rem 1rem',
                    background: COLORS.accent,
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: COLORS.text,
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028].map(y => (
                    <option key={y} value={y}>{y}年</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setViewMode('current')}
                  style={{
                    padding: '0.6rem 1.2rem',
                    background: viewMode === 'current' ? `linear-gradient(135deg, ${COLORS.highlight} 0%, ${COLORS.success} 100%)` : COLORS.accent,
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: COLORS.text,
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  当月详情
                </button>
                <button
                  onClick={() => setViewMode('trends')}
                  style={{
                    padding: '0.6rem 1.2rem',
                    background: viewMode === 'trends' ? `linear-gradient(135deg, ${COLORS.highlight} 0%, ${COLORS.success} 100%)` : COLORS.accent,
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: COLORS.text,
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  趋势分析
                </button>
              </div>
            </div>

            {/* Current Month View */}
            {viewMode === 'current' && (
              <>

            {/* Monthly Income Input */}
            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLORS.textMuted }}>
                月收入（税后）
              </label>
              <input
                type="number"
                value={monthlyIncome || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setMonthlyIncome(isNaN(value) ? 0 : value);
                  localStorage.setItem('monthlyIncome', (isNaN(value) ? 0 : value).toString());
                }}
                placeholder="输入月收入..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: COLORS.accent,
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: COLORS.text,
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* FIRE Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                border: `2px solid ${COLORS.success}`
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                  储蓄率
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: COLORS.success }}>
                  {savingsRate.toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginTop: '0.5rem' }}>
                  目标: ≥50%
                </div>
              </div>

              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                  必需支出/月
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: COLORS.highlight }}>
                  ¥{essentialExpenses.toLocaleString()}
                </div>
              </div>

              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                  退休后总支出
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                  ¥{retirementExpenses.toLocaleString()}
                </div>
              </div>

              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                  FIRE数字 ({fireMultiplier.toFixed(1)}x)
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: COLORS.warning }}>
                  ¥{fireNumber.toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '2rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                  本月总支出
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: COLORS.highlight }}>
                  ¥{totalExpenses.toLocaleString()}
                </div>
              </div>

              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '2rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <button
                  onClick={() => setShowAddExpense(!showAddExpense)}
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.highlight} 0%, ${COLORS.success} 100%)`,
                    border: 'none',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%',
                    fontFamily: 'inherit'
                  }}
                >
                  {showAddExpense ? '取消' : '+ 添加支出'}
                </button>

                {showAddExpense && (
                  <div style={{ marginTop: '1rem' }}>
                    <select
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                        background: COLORS.accent,
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: COLORS.text,
                        fontFamily: 'inherit',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="">选择类别...</option>
                      {Object.entries(EXPENSE_CATEGORIES).map(([key, group]) => (
                        <optgroup key={key} label={group.label}>
                          {group.categories.map(cat => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="金额"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                        background: COLORS.accent,
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: COLORS.text,
                        fontFamily: 'inherit'
                      }}
                    />
                    <input
                      type="date"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                        background: COLORS.accent,
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: COLORS.text,
                        fontFamily: 'inherit'
                      }}
                    />
                    <button
                      onClick={addExpense}
                      style={{
                        background: COLORS.success,
                        border: 'none',
                        color: COLORS.background,
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        width: '100%',
                        fontFamily: 'inherit'
                      }}
                    >
                      确认添加
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Expense Chart by FIRE Groups */}
            {currentMonthTotal > 0 && (
              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '2rem',
                marginBottom: '2rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>FIRE支出分析</h3>
                
                <div className="fire-expense-analysis-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                  <div className="fire-chart-container">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: '必需支出', value: essentialExpenses, color: COLORS.highlight },
                            { name: '工作相关', value: workRelatedExpenses, color: COLORS.bonds },
                            { name: '可选支出', value: discretionaryExpenses, color: COLORS.warning },
                            { name: '储蓄投资', value: savingsInvestment, color: COLORS.success },
                            { name: '债务偿还', value: debtPayments, color: '#9d4edd' }
                          ].filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: '必需支出', value: essentialExpenses, color: COLORS.highlight },
                            { name: '工作相关', value: workRelatedExpenses, color: COLORS.bonds },
                            { name: '可选支出', value: discretionaryExpenses, color: COLORS.warning },
                            { name: '储蓄投资', value: savingsInvestment, color: COLORS.success },
                            { name: '债务偿还', value: debtPayments, color: '#9d4edd' }
                          ].filter(item => item.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ background: COLORS.accent, border: 'none', borderRadius: '0.5rem' }}
                          formatter={(value) => `¥${value}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem' }}>
                    {[
                      { label: '必需支出（退休后继续）', value: essentialExpenses, color: COLORS.highlight },
                      { label: '工作相关（退休后消失）', value: workRelatedExpenses, color: COLORS.bonds },
                      { label: '可选支出（可削减）', value: discretionaryExpenses, color: COLORS.warning },
                      { label: '储蓄投资', value: savingsInvestment, color: COLORS.success },
                      { label: '债务偿还', value: debtPayments, color: '#9d4edd' }
                    ].filter(item => item.value > 0).map((item, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        background: COLORS.accent,
                        borderRadius: '0.5rem',
                        borderLeft: `4px solid ${item.color}`
                      }}>
                        <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
                        <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>¥{item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Expense List */}
            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>
                支出明细（{selectedYear}年{selectedMonth}月）
              </h3>
              {filteredExpenses.length === 0 ? (
                <p style={{ color: COLORS.textMuted }}>本月暂无支出记录</p>
              ) : (
                <div>
                  {filteredExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => {
                    const group = getCategoryGroup(expense.category);
                    const groupInfo = EXPENSE_CATEGORIES[group as keyof typeof EXPENSE_CATEGORIES];
                    const groupColor = groupInfo?.color || COLORS.textMuted;
                    const groupLabel = groupInfo?.label || '其他';
                    
                    return (
                      <div key={expense.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        marginBottom: '0.5rem',
                        background: COLORS.accent,
                        borderRadius: '0.5rem',
                        borderLeft: `4px solid ${groupColor}`
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600' }}>{expense.description || expense.category}</div>
                          <div style={{ fontSize: '0.75rem', color: groupColor, marginTop: '0.25rem' }}>
                            {groupLabel}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>{expense.date}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>¥{expense.amount}</div>
                          <button
                            onClick={() => deleteExpense(expense.id)}
                            style={{
                              background: 'none',
                              border: `1px solid ${COLORS.highlight}`,
                              color: COLORS.highlight,
                              padding: '0.4rem 0.8rem',
                              borderRadius: '0.3rem',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontFamily: 'inherit'
                            }}
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
              </>
            )}

            {/* Trends View */}
            {viewMode === 'trends' && (
              <>
                {/* Monthly Trend Chart */}
                <div className="card-mobile" style={{
                  background: COLORS.card,
                  borderRadius: '1rem',
                  padding: '2rem',
                  marginBottom: '2rem',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>
                    月度支出趋势（最近12个月）
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <XAxis dataKey="month" stroke={COLORS.textMuted} />
                      <YAxis stroke={COLORS.textMuted} />
                      <Tooltip 
                        contentStyle={{ background: COLORS.accent, border: 'none', borderRadius: '0.5rem' }}
                        formatter={(value: number) => `¥${value.toLocaleString()}`}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke={COLORS.highlight} strokeWidth={3} name="总支出" />
                      <Line type="monotone" dataKey="essential" stroke={COLORS.bonds} strokeWidth={2} name="必需" />
                      <Line type="monotone" dataKey="discretionary" stroke={COLORS.warning} strokeWidth={2} name="可选" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Monthly Breakdown Table */}
                <div className="card-mobile" style={{
                  background: COLORS.card,
                  borderRadius: '1rem',
                  padding: '2rem',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>
                    月度汇总
                  </h3>
                  <div className="trends-table-container" style={{ overflowX: 'auto' }}>
                    <table className="trends-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${COLORS.accent}` }}>
                          <th style={{ padding: '1rem', textAlign: 'left', color: COLORS.textMuted, fontSize: '0.9rem' }}>月份</th>
                          <th style={{ padding: '1rem', textAlign: 'right', color: COLORS.textMuted, fontSize: '0.9rem' }}>总支出</th>
                          <th style={{ padding: '1rem', textAlign: 'right', color: COLORS.textMuted, fontSize: '0.9rem' }}>必需</th>
                          <th style={{ padding: '1rem', textAlign: 'right', color: COLORS.textMuted, fontSize: '0.9rem' }}>可选</th>
                          <th style={{ padding: '1rem', textAlign: 'right', color: COLORS.textMuted, fontSize: '0.9rem' }}>储蓄</th>
                          <th style={{ padding: '1rem', textAlign: 'center', color: COLORS.textMuted, fontSize: '0.9rem' }}>笔数</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trendData.slice().reverse().map((monthData, idx) => (
                          <tr key={idx} style={{ borderBottom: `1px solid ${COLORS.accent}` }}>
                            <td style={{ padding: '1rem', fontWeight: '600' }}>{monthData.month}</td>
                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '700', fontSize: '1.1rem' }}>
                              ¥{monthData.total.toLocaleString()}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right', color: COLORS.bonds }}>
                              ¥{monthData.essential.toLocaleString()}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right', color: COLORS.warning }}>
                              ¥{monthData.discretionary.toLocaleString()}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right', color: COLORS.success }}>
                              ¥{monthData.savings.toLocaleString()}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center', color: COLORS.textMuted }}>
                              {monthlyAggregation[monthData.monthKey]?.count || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Average Analysis */}
                <div className="card-mobile" style={{
                  background: COLORS.card,
                  borderRadius: '1rem',
                  padding: '2rem',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>
                    平均分析（最近12个月）
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    {(() => {
                      const validMonths = trendData.filter(m => m.total > 0);
                      const avgTotal = validMonths.length > 0 ? validMonths.reduce((sum, m) => sum + m.total, 0) / validMonths.length : 0;
                      const avgEssential = validMonths.length > 0 ? validMonths.reduce((sum, m) => sum + m.essential, 0) / validMonths.length : 0;
                      const avgDiscretionary = validMonths.length > 0 ? validMonths.reduce((sum, m) => sum + m.discretionary, 0) / validMonths.length : 0;
                      
                      return (
                        <>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>月均总支出</div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: COLORS.highlight }}>
                              ¥{avgTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>月均必需支出</div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: COLORS.bonds }}>
                              ¥{avgEssential.toLocaleString(undefined, {maximumFractionDigits: 0})}
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>月均可选支出</div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: COLORS.warning }}>
                              ¥{avgDiscretionary.toLocaleString(undefined, {maximumFractionDigits: 0})}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div>
            {/* Portfolio Summary - Moved to top */}
            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>投资组合汇总</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem'
              }}>
                <div style={{
                  background: COLORS.accent,
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: `2px solid ${COLORS.secondary}`
                }}>
                  <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>总资产</div>
                  <div style={{ fontSize: '2rem', fontWeight: '700' }}>¥{totalPortfolio.toLocaleString()}</div>
                </div>
                <div style={{
                  background: COLORS.accent,
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: `2px solid ${COLORS.stocks}`
                }}>
                  <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>股票</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.stocks }}>
                    ¥{portfolio.stocks.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                    {currentAllocation.stocks.toFixed(1)}%
                  </div>
                </div>
                <div style={{
                  background: COLORS.accent,
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: `2px solid ${COLORS.bonds}`
                }}>
                  <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>债券</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.bonds }}>
                    ¥{portfolio.bonds.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                    {currentAllocation.bonds.toFixed(1)}%
                  </div>
                </div>
                <div style={{
                  background: COLORS.accent,
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: `2px solid ${COLORS.cash}`,
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  position: 'relative'
                }}
                onClick={() => setShowCashCalculator(true)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                    现金 
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>🧮 点击计算</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.cash }}>
                    ¥{portfolio.cash.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                    {currentAllocation.cash.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Cash Calculator Modal */}
            {showCashCalculator && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}
              onClick={() => setShowCashCalculator(false)}
              >
                <div style={{
                  background: COLORS.card,
                  borderRadius: '1rem',
                  padding: '2rem',
                  maxWidth: '500px',
                  width: '90%',
                  maxHeight: '80vh',
                  overflowY: 'auto',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
                }}
                onClick={(e) => e.stopPropagation()}
                >
                  <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>🧮 现金账户计算器</h3>
                  
                  {cashAccounts.map((account, index) => (
                    <div key={index} style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={account.name}
                        onChange={(e) => {
                          const newAccounts = [...cashAccounts];
                          newAccounts[index].name = e.target.value;
                          setCashAccounts(newAccounts);
                          // 实时保存到 localStorage
                          localStorage.setItem('cashAccounts', JSON.stringify(newAccounts));
                        }}
                        placeholder="账户名称"
                        style={{
                          flex: '1',
                          padding: '0.75rem',
                          background: COLORS.accent,
                          border: `1px solid ${COLORS.secondary}`,
                          borderRadius: '0.5rem',
                          color: COLORS.text,
                          fontSize: '0.9rem',
                          fontFamily: 'inherit'
                        }}
                      />
                      <input
                        type="number"
                        value={account.amount}
                        onChange={(e) => {
                          const newAccounts = [...cashAccounts];
                          newAccounts[index].amount = e.target.value;
                          setCashAccounts(newAccounts);
                          // 实时保存到 localStorage
                          localStorage.setItem('cashAccounts', JSON.stringify(newAccounts));
                        }}
                        placeholder="金额"
                        step="0.01"
                        style={{
                          flex: '1',
                          padding: '0.75rem',
                          background: COLORS.accent,
                          border: `1px solid ${COLORS.secondary}`,
                          borderRadius: '0.5rem',
                          color: COLORS.text,
                          fontSize: '0.9rem',
                          fontFamily: 'inherit'
                        }}
                      />
                      {cashAccounts.length > 1 && (
                        <button
                          onClick={() => {
                            const newAccounts = cashAccounts.filter((_, i) => i !== index);
                            setCashAccounts(newAccounts);
                            // 立即保存到 localStorage
                            localStorage.setItem('cashAccounts', JSON.stringify(newAccounts));
                          }}
                          style={{
                            background: 'none',
                            color: COLORS.highlight,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            padding: '0.5rem',
                            fontFamily: 'inherit'
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => {
                      const newAccounts = [...cashAccounts, { id: Date.now(), name: `账户${cashAccounts.length + 1}`, amount: '' }];
                      setCashAccounts(newAccounts);
                      // 立即保存到 localStorage
                      localStorage.setItem('cashAccounts', JSON.stringify(newAccounts));
                    }}
                    style={{
                      background: 'none',
                      color: COLORS.success,
                      border: `1px dashed ${COLORS.success}`,
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      width: '100%',
                      marginBottom: '1.5rem',
                      fontFamily: 'inherit'
                    }}
                  >
                    + 添加账户
                  </button>

                  <div style={{
                    background: COLORS.accent,
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    border: `2px solid ${COLORS.cash}`
                  }}>
                    <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>总计</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: COLORS.cash }}>
                      ¥{cashAccounts.reduce((sum, acc) => sum + (parseFloat(acc.amount) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      onClick={() => setShowCashCalculator(false)}
                      style={{
                        flex: 1,
                        background: 'none',
                        color: COLORS.textMuted,
                        border: `1px solid ${COLORS.textMuted}`,
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        fontFamily: 'inherit'
                      }}
                    >
                      取消
                    </button>
                    <button
                      onClick={async () => {
                        const totalCash = cashAccounts.reduce((sum, acc) => sum + (parseFloat(acc.amount) || 0), 0);
                        
                        if (totalCash === 0) {
                          alert('请输入现金金额');
                          return;
                        }

                        try {
                          const cashInvestment = investments.find(inv => inv.type === 'cash');
                          console.log('Current cash investment:', cashInvestment);
                          console.log('Total cash to save:', totalCash);

                          if (cashInvestment) {
                            console.log('Updating existing cash investment...');
                            const response = await api.put(`/investments/${cashInvestment.id}`, {
                              type: 'cash',
                              name: '现金账户总计',
                              symbol: null,
                              amount: totalCash,
                              price: null,
                              quantity: null,
                              date: new Date().toISOString().split('T')[0]
                            });
                            console.log('Update response:', response.data);
                          } else {
                            console.log('Creating new cash investment...');
                            const response = await api.post('/investments', {
                              type: 'cash',
                              name: '现金账户总计',
                              symbol: null,
                              amount: totalCash,
                              price: null,
                              quantity: null,
                              date: new Date().toISOString().split('T')[0]
                            });
                            console.log('Create response:', response.data);
                          }
                          
                          console.log('Reloading data...');
                          await loadData();
                          console.log('Data reloaded successfully');
                          
                          // 保存现金账户到 localStorage
                          localStorage.setItem('cashAccounts', JSON.stringify(cashAccounts));
                          
                          setShowCashCalculator(false);
                          alert(`现金总额已更新为 ¥${totalCash.toLocaleString()}！`);
                        } catch (error: any) {
                          console.error('Error updating cash:', error);
                          console.error('Error details:', error.response?.data);
                          alert(`更新失败：${error.response?.data?.error || error.message}`);
                        }
                      }}
                      style={{
                        flex: 1,
                        background: COLORS.success,
                        color: COLORS.text,
                        border: 'none',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        fontFamily: 'inherit'
                      }}
                    >
                      保存
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>目标配置 (%)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                {(['stocks', 'bonds', 'cash'] as const).map(type => (
                  <div key={type}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLORS.textMuted }}>
                      {type === 'stocks' ? '股票' : type === 'bonds' ? '债券' : '现金'}
                    </label>
                    <input
                      type="number"
                      value={targetAllocation[type]}
                      onChange={(e) => updateTargetAllocation(type, parseFloat(e.target.value))}
                      min="0"
                      max="100"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: COLORS.accent,
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: COLORS.text,
                        fontSize: '1rem',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: COLORS.textMuted }}>
                总计: {(targetAllocation.stocks + targetAllocation.bonds + targetAllocation.cash).toFixed(0)}% 
                {(targetAllocation.stocks + targetAllocation.bonds + targetAllocation.cash) !== 100 && (
                  <span style={{ color: COLORS.warning, marginLeft: '0.5rem' }}>⚠ 应为100%</span>
                )}
              </div>
            </div>

            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>当前 vs 目标配置</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={portfolioChartData}>
                  <XAxis dataKey="name" stroke={COLORS.textMuted} />
                  <YAxis stroke={COLORS.textMuted} />
                  <Tooltip 
                    contentStyle={{ background: COLORS.accent, border: 'none', borderRadius: '0.5rem' }}
                    formatter={(value) => `¥${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Bar dataKey="current" fill={COLORS.highlight} name="当前" />
                  <Bar dataKey="target" fill={COLORS.success} name="目标" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Investment List - Moved after chart */}
            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              overflowX: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>投资明细</h3>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {lastPriceUpdate && (
                    <span style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                      上次更新: {new Date(lastPriceUpdate).toLocaleString('zh-CN')}
                    </span>
                  )}
                  <button
                    onClick={refreshStockPrices}
                    disabled={refreshingPrices}
                    style={{
                      background: refreshingPrices ? COLORS.accent : COLORS.success,
                      color: COLORS.text,
                      border: 'none',
                      padding: '0.6rem 1.2rem',
                      borderRadius: '0.5rem',
                      cursor: refreshingPrices ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      fontFamily: 'inherit',
                      opacity: refreshingPrices ? 0.6 : 1
                    }}
                  >
                    {refreshingPrices ? '更新中...' : '🔄 刷新价格'}
                  </button>
                  <button
                    onClick={() => setShowAddInvestment(true)}
                    style={{
                      background: COLORS.highlight,
                      color: COLORS.text,
                      border: 'none',
                      padding: '0.6rem 1.2rem',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      fontFamily: 'inherit'
                    }}
                  >
                    + 添加投资
                  </button>
                </div>
              </div>

              {/* Add Investment Form */}
              {showAddInvestment && (
                <div style={{
                  background: COLORS.accent,
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  border: `1px solid ${COLORS.secondary}`
                }}>
                  <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>添加新投资</h4>
                  <form onSubmit={handleAddInvestment} style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLORS.textMuted }}>类型</label>
                        <select
                          value={newInvestment.type}
                          onChange={(e) => setNewInvestment({ ...newInvestment, type: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: COLORS.card,
                            border: `1px solid ${COLORS.secondary}`,
                            borderRadius: '0.5rem',
                            color: COLORS.text,
                            fontSize: '0.9rem',
                            fontFamily: 'inherit'
                          }}
                        >
                          <option value="stocks">股票</option>
                          <option value="bonds">债券</option>
                          <option value="cash">现金</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLORS.textMuted }}>代码</label>
                        <input
                          type="text"
                          value={newInvestment.symbol}
                          onChange={(e) => setNewInvestment({ ...newInvestment, symbol: e.target.value.toUpperCase() })}
                          required
                          placeholder="如：AAPL"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: COLORS.card,
                            border: `1px solid ${COLORS.secondary}`,
                            borderRadius: '0.5rem',
                            color: COLORS.text,
                            fontSize: '0.9rem',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLORS.textMuted }}>股数</label>
                        <input
                          type="number"
                          value={newInvestment.quantity}
                          onChange={(e) => setNewInvestment({ ...newInvestment, quantity: e.target.value })}
                          required
                          step="0.01"
                          placeholder="持有股数"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: COLORS.card,
                            border: `1px solid ${COLORS.secondary}`,
                            borderRadius: '0.5rem',
                            color: COLORS.text,
                            fontSize: '0.9rem',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLORS.textMuted }}>当前价格</label>
                        <input
                          type="number"
                          value={newInvestment.price}
                          onChange={(e) => setNewInvestment({ ...newInvestment, price: e.target.value })}
                          required
                          step="0.01"
                          placeholder="每股价格"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: COLORS.card,
                            border: `1px solid ${COLORS.secondary}`,
                            borderRadius: '0.5rem',
                            color: COLORS.text,
                            fontSize: '0.9rem',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLORS.textMuted }}>
                          账户 <span style={{ color: COLORS.textMuted, fontSize: '0.8rem' }}>(选填)</span>
                        </label>
                        <input
                          type="text"
                          value={newInvestment.account}
                          onChange={(e) => setNewInvestment({ ...newInvestment, account: e.target.value })}
                          placeholder="如：Fidelity"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: COLORS.card,
                            border: `1px solid ${COLORS.secondary}`,
                            borderRadius: '0.5rem',
                            color: COLORS.text,
                            fontSize: '0.9rem',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLORS.textMuted }}>日期</label>
                        <input
                          type="date"
                          value={newInvestment.date}
                          onChange={(e) => setNewInvestment({ ...newInvestment, date: e.target.value })}
                          required
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: COLORS.card,
                            border: `1px solid ${COLORS.secondary}`,
                            borderRadius: '0.5rem',
                            color: COLORS.text,
                            fontSize: '0.9rem',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setShowAddInvestment(false)}
                        style={{
                          background: 'none',
                          color: COLORS.textMuted,
                          border: `1px solid ${COLORS.textMuted}`,
                          padding: '0.6rem 1.2rem',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          fontFamily: 'inherit'
                        }}
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        style={{
                          background: COLORS.success,
                          color: COLORS.text,
                          border: 'none',
                          padding: '0.6rem 1.2rem',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          fontFamily: 'inherit'
                        }}
                      >
                        添加
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {investments.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${COLORS.accent}` }}>
                        <th style={{ padding: '1rem', textAlign: 'left', color: COLORS.textMuted, fontSize: '0.9rem', minWidth: '110px' }}>日期</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: COLORS.textMuted, fontSize: '0.9rem', minWidth: '80px' }}>类型</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: COLORS.textMuted, fontSize: '0.9rem', minWidth: '90px' }}>代码</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: COLORS.textMuted, fontSize: '0.9rem', minWidth: '120px' }}>账户</th>
                        <th style={{ padding: '1rem', textAlign: 'right', color: COLORS.textMuted, fontSize: '0.9rem', minWidth: '90px' }}>股数</th>
                        <th style={{ padding: '1rem', textAlign: 'right', color: COLORS.textMuted, fontSize: '0.9rem', minWidth: '100px' }}>当前价格</th>
                        <th style={{ padding: '1rem', textAlign: 'right', color: COLORS.textMuted, fontSize: '0.9rem', minWidth: '120px' }}>总金额</th>
                        <th style={{ padding: '1rem', textAlign: 'center', color: COLORS.textMuted, fontSize: '0.9rem', minWidth: '150px' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investments.map((investment) => (
                        <tr key={investment.id} style={{ borderBottom: `1px solid ${COLORS.accent}` }}>
                          {editingInvestmentId === investment.id ? (
                            <>
                              <td style={{ padding: '1rem' }}>
                                <input
                                  type="date"
                                  value={editingInvestment.date}
                                  onChange={(e) => setEditingInvestment({ ...editingInvestment, date: e.target.value })}
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    background: COLORS.accent,
                                    border: `1px solid ${COLORS.secondary}`,
                                    borderRadius: '0.3rem',
                                    color: COLORS.text,
                                    fontFamily: 'inherit'
                                  }}
                                />
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <select
                                  value={editingInvestment.type}
                                  onChange={(e) => setEditingInvestment({ ...editingInvestment, type: e.target.value })}
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    background: COLORS.accent,
                                    border: `1px solid ${COLORS.secondary}`,
                                    borderRadius: '0.3rem',
                                    color: COLORS.text,
                                    fontFamily: 'inherit'
                                  }}
                                >
                                  <option value="stocks">股票</option>
                                  <option value="bonds">债券</option>
                                  <option value="cash">现金</option>
                                </select>
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <input
                                  type="text"
                                  value={editingInvestment.symbol}
                                  onChange={(e) => setEditingInvestment({ ...editingInvestment, symbol: e.target.value.toUpperCase() })}
                                  placeholder="代码"
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    background: COLORS.accent,
                                    border: `1px solid ${COLORS.secondary}`,
                                    borderRadius: '0.3rem',
                                    color: COLORS.text,
                                    fontFamily: 'inherit'
                                  }}
                                />
                              </td>
                              <td style={{ padding: '1rem', minWidth: '120px' }}>
                                <input
                                  type="text"
                                  value={editingInvestment.account || ''}
                                  onChange={(e) => setEditingInvestment({ ...editingInvestment, account: e.target.value })}
                                  placeholder="账户名"
                                  style={{
                                    width: '100%',
                                    minWidth: '100px',
                                    padding: '0.5rem',
                                    background: COLORS.accent,
                                    border: `1px solid ${COLORS.secondary}`,
                                    borderRadius: '0.3rem',
                                    color: COLORS.text,
                                    fontSize: '0.9rem',
                                    fontFamily: 'inherit'
                                  }}
                                />
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'right' }}>
                                <input
                                  type="number"
                                  value={editingInvestment.quantity}
                                  onChange={(e) => setEditingInvestment({ ...editingInvestment, quantity: e.target.value })}
                                  step="0.01"
                                  placeholder="股数"
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    background: COLORS.accent,
                                    border: `1px solid ${COLORS.secondary}`,
                                    borderRadius: '0.3rem',
                                    color: COLORS.text,
                                    textAlign: 'right',
                                    fontFamily: 'inherit'
                                  }}
                                />
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'right' }}>
                                <input
                                  type="number"
                                  value={editingInvestment.price}
                                  onChange={(e) => setEditingInvestment({ ...editingInvestment, price: e.target.value })}
                                  step="0.01"
                                  placeholder="价格"
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    background: COLORS.accent,
                                    border: `1px solid ${COLORS.secondary}`,
                                    borderRadius: '0.3rem',
                                    color: COLORS.text,
                                    textAlign: 'right',
                                    fontFamily: 'inherit'
                                  }}
                                />
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.9rem', textAlign: 'right', fontWeight: '700' }}>
                                ¥{((parseFloat(editingInvestment.quantity) || 0) * (parseFloat(editingInvestment.price) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'center' }}>
                                <button
                                  onClick={() => handleSaveEditInvestment(investment.id)}
                                  style={{
                                    background: COLORS.success,
                                    color: COLORS.text,
                                    border: 'none',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '0.3rem',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    marginRight: '0.5rem',
                                    fontFamily: 'inherit'
                                  }}
                                >
                                  保存
                                </button>
                                <button
                                  onClick={handleCancelEditInvestment}
                                  style={{
                                    background: 'none',
                                    color: COLORS.textMuted,
                                    border: `1px solid ${COLORS.textMuted}`,
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '0.3rem',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'inherit'
                                  }}
                                >
                                  取消
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{investment.date}</td>
                              <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{getTypeLabel(investment.type)}</td>
                              <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: '600' }}>{investment.symbol || '-'}</td>
                              <td style={{ padding: '1rem', fontSize: '0.9rem', color: COLORS.textMuted }}>
                                {investment.account || '-'}
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.9rem', textAlign: 'right' }}>
                                {(investment.quantity || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.9rem', textAlign: 'right' }}>
                                ¥{(investment.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.9rem', textAlign: 'right', fontWeight: '700' }}>
                                ¥{((investment.quantity || 0) * (investment.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'center' }}>
                                <button
                                  onClick={() => handleStartEditInvestment(investment)}
                                  style={{
                                    background: 'none',
                                    color: COLORS.success,
                                    border: `1px solid ${COLORS.success}`,
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '0.3rem',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    marginRight: '0.5rem',
                                    fontFamily: 'inherit'
                                  }}
                                >
                                  编辑
                                </button>
                                <button
                                  onClick={() => handleDeleteInvestment(investment.id)}
                                  style={{
                                    background: 'none',
                                    color: COLORS.highlight,
                                    border: `1px solid ${COLORS.highlight}`,
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '0.3rem',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'inherit'
                                  }}
                                >
                                  删除
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {investments.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: COLORS.textMuted }}>
                  暂无投资记录，点击"+ 添加投资"开始记录
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rebalance Tab */}
        {activeTab === 'rebalance' && (
          <div>
            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>再平衡建议</h3>
              
              {rebalanceSuggestions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: COLORS.success
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>投资组合已平衡</div>
                  <div style={{ color: COLORS.textMuted, marginTop: '0.5rem' }}>
                    当前配置与目标配置的偏差在 5% 以内
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{
                    background: `${COLORS.warning}20`,
                    border: `1px solid ${COLORS.warning}`,
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <strong>⚠ 需要调整</strong> - 检测到 {rebalanceSuggestions.length} 项偏差超过 5%
                  </div>

                  {rebalanceSuggestions.map((suggestion, idx) => (
                    <div key={idx} style={{
                      background: COLORS.accent,
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
                      marginBottom: '1rem',
                      borderLeft: `4px solid ${suggestion.action === 'Reduce' ? COLORS.highlight : COLORS.success}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <div style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                            {suggestion.asset === 'stocks' ? '股票' : suggestion.asset === 'bonds' ? '债券' : '现金'}
                          </div>
                          <div style={{ color: COLORS.textMuted, fontSize: '0.9rem' }}>
                            当前: {suggestion.currentPct.toFixed(1)}% → 目标: {suggestion.targetPct.toFixed(1)}%
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: suggestion.action === 'Reduce' ? COLORS.highlight : COLORS.success
                          }}>
                            {suggestion.action === 'Reduce' ? '−' : '+'} ¥{suggestion.amount.toLocaleString()}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                            {suggestion.action === 'Reduce' ? '减少' : '增加'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceDashboard;

